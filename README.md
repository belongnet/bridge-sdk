# @belongnet/bridge-sdk

Belong frame-to-app bridge — Typed messaging layer for native data between iframe's and Belong app.

## Installation

```sh
pnpm add @belongnet/bridge
```

## Iframe usage

```ts
import { connectToHost } from '@belongnet/bridge'

const { remote, destroy } = await connectToHost({
  allowedOrigins: ['https://app.belong.net', 'capacitor://localhost'],
})

const location = await remote.getLocation()

destroy() // optional cleanup
```

## Host usage

```ts
import { connectHost } from '@belongnet/bridge'

const iframe = document.querySelector<HTMLIFrameElement>('#belong-frame')!

const { destroy } = await connectHost({
  iframe,
  allowedOrigins: ['https://frame.belong.net'],
  methods: {
    async getLocation() {
      const loc = await CapacitorGeolocation.getCurrentPosition()
      return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        ts: Date.now(),
      }
    },
  },
})

// Destroy when the iframe is removed or reloaded.
destroy()
```

## Available methods

### `getLocation`

- **Signature:** `getLocation(): Promise<LocationPayload>`
- **Purpose:** Returns the best-known device coordinates (lat/lng) along with optional accuracy and timestamp metadata supplied by the host app.
- **Schema:** enforced via Zod on both the frame and host side

```ts
const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  ts: z.number().optional(),
})

type LocationPayload = z.infer<typeof locationSchema>
```

All responses are validated with Zod before being exposed to callers, ensuring the bridge stays resilient as new native capabilities are added.

## Development

```sh
npm install
npm run build
```


## Stack

- [Penpal](https://github.com/Aaronius/penpal) — RPC + postMessage bridge
- [Zod](https://zod.dev/) — runtime schema validation
- [TypeScript](https://www.typescriptlang.org/) — strict type safety
- [tsup](https://tsup.egoist.dev/) — ESM build pipeline


## License

MIT
