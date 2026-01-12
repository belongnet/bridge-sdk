import { connect, WindowMessenger, type Log, type RemoteProxy } from 'penpal'
import {
  type BridgeConnection,
  type FrameBridgeMethods,
  type HostBridgeMethods,
  type HostRemote,
  locationSchema,
  toastSchema,
  normalizeAllowedOrigins,
} from './shared'

export interface ConnectToHostOptions {
  /**
   * List of explicit origins the iframe trusts.
   */
  allowedOrigins: readonly string[]
  /**
   * Optional methods the iframe exposes to the host.
   */
  methods?: FrameBridgeMethods
  /**
   * Custom communication channel identifier, useful when multiple bridges exist.
   */
  channel?: string
  /**
   * Milliseconds to wait for the host before timing out.
   */
  timeout?: number
  /**
   * Enable debug logging or pass a custom logger.
   */
  debug?: boolean | Log
  /**
   * Override the window used for communication (defaults to global window).
   */
  targetWindow?: Window
}

const DEFAULT_CHANNEL = 'belongnet:bridge'

/**
 * Connects the iframe to the native host application.
 */
export const connectToHost = async ({
  allowedOrigins,
  methods,
  channel = DEFAULT_CHANNEL,
  timeout,
  debug,
  targetWindow,
}: ConnectToHostOptions): Promise<BridgeConnection<HostRemote>> => {
  const normalizedOrigins = normalizeAllowedOrigins(allowedOrigins)
  const resolvedWindow = targetWindow ?? window
  const parentWindow = resolvedWindow.parent

  if (!parentWindow || parentWindow === resolvedWindow) {
    throw new Error('connectToHost must be called within an iframe context')
  }

  const messenger = new WindowMessenger({
    remoteWindow: parentWindow,
    allowedOrigins: normalizedOrigins,
  })

  const connection = connect<HostBridgeMethods>({
    messenger,
    methods: methods ?? {},
    timeout,
    channel,
    log: resolveLogger(debug),
  })

  const remote = await connection.promise

  return {
    remote: createHostRemote(remote),
    destroy: connection.destroy,
  }
}

const createHostRemote = (remote: RemoteProxy<HostBridgeMethods>): HostRemote => ({
  async getLocation() {
    const payload = await remote.getLocation()
    return locationSchema.parse(payload)
  },
  async showToast(payload) {
    const parsed = toastSchema.parse(payload)
    await remote.showToast(parsed)
  },
})

const resolveLogger = (debug?: boolean | Log): Log | undefined => {
  if (typeof debug === 'function') {
    return debug
  }

  if (debug) {
    return (...args: unknown[]) => {
      console.debug('[belongnet:bridge:frame]', ...args)
    }
  }

  return undefined
}
