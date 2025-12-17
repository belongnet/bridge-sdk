import type { Methods } from 'penpal'
import { z } from 'zod'

/**
 * Zod schema describing a geolocation payload returned by the host app.
 */
export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  ts: z.number().optional(),
})

export type LocationPayload = z.infer<typeof locationSchema>

/**
 * Contract that the native host must fulfil for iframe consumers.
 */
export interface HostBridgeMethods extends Methods {
  getLocation(): Promise<LocationPayload>
}

/**
 * Contract for methods that the iframe exposes to the host.
 * Currently empty but intentionally structured for future expansion.
 */
export interface FrameBridgeMethods extends Methods {}

export type HostRemote = HostBridgeMethods
export type FrameRemote = FrameBridgeMethods

/**
 * Result returned by the bridge helpers.
 */
export interface BridgeConnection<TRemote> {
  remote: TRemote
  destroy(): void
}

const singleOriginSchema = z
  .string()
  .trim()
  .min(1, 'Origin must not be empty')
  .refine((value) => !value.includes('*'), {
    message: 'Origin wildcards are not allowed. Provide explicit origins.',
  })

const allowedOriginsSchema = z.array(singleOriginSchema).nonempty()

/**
 * Deduplicates and validates allowed origins while preserving insertion order.
 */
export const normalizeAllowedOrigins = (origins: readonly string[]): string[] => {
  const parsed = allowedOriginsSchema.parse(origins)
  const seen = new Set<string>()

  for (const origin of parsed) {
    if (!seen.has(origin)) {
      seen.add(origin)
    }
  }

  return Array.from(seen)
}
