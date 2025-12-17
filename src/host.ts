import { connect, WindowMessenger, type Log } from 'penpal'
import {
  type BridgeConnection,
  type FrameRemote,
  type FrameBridgeMethods,
  type HostBridgeMethods,
  locationSchema,
  normalizeAllowedOrigins,
} from './shared'

export interface ConnectHostOptions {
  iframe: HTMLIFrameElement
  allowedOrigins: readonly string[]
  methods: HostBridgeMethods
  channel?: string
  timeout?: number
  debug?: boolean | Log
}

const DEFAULT_CHANNEL = 'belongnet:bridge'

/**
 * Initializes the host-side Penpal bridge for an iframe element.
 */
export const connectHost = async ({
  iframe,
  allowedOrigins,
  methods,
  channel = DEFAULT_CHANNEL,
  timeout,
  debug,
}: ConnectHostOptions): Promise<BridgeConnection<FrameRemote>> => {
  if (!iframe?.contentWindow) {
    throw new Error('connectHost requires an iframe with an attached contentWindow')
  }

  const normalizedOrigins = normalizeAllowedOrigins(allowedOrigins)
  const messenger = new WindowMessenger({
    remoteWindow: iframe.contentWindow,
    allowedOrigins: normalizedOrigins,
  })

  const connection = connect<FrameBridgeMethods>({
    messenger,
    methods: createValidatedHostMethods(methods),
    timeout,
    channel,
    log: resolveLogger(debug),
  })

  const remote = await connection.promise

  return {
    remote: remote as FrameRemote,
    destroy: connection.destroy,
  }
}

const createValidatedHostMethods = (methods: HostBridgeMethods): HostBridgeMethods => {
  if (typeof methods?.getLocation !== 'function') {
    throw new Error('Host methods must implement getLocation()')
  }

  return {
    async getLocation() {
      const payload = await methods.getLocation()
      return locationSchema.parse(payload)
    },
  }
}

const resolveLogger = (debug?: boolean | Log): Log | undefined => {
  if (typeof debug === 'function') {
    return debug
  }

  if (debug) {
    return (...args: unknown[]) => {
      console.debug('[belongnet:bridge:host]', ...args)
    }
  }

  return undefined
}
