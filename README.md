# @belongnet/bridge-sdk

Typed iframe ↔ host bridge for Belong apps. Provides a safe, validated RPC layer between an embedded frame and its host.

## Installation

```sh
pnpm add @belongnet/bridge-sdk
```

## Quick start

### Iframe (frame -> host)

```ts
import { connectToHost } from '@belongnet/bridge-sdk'

const { remote, destroy } = await connectToHost({
  allowedOrigins: ['https://app.belong.net', 'capacitor://localhost'],
  methods: {
    async setTheme(theme) {
      document.documentElement.dataset.theme = theme
    },
  },
})

const location = await remote.getLocation()
await remote.showToast({ message: 'Hello from frame', type: 'success' })

destroy() // optional cleanup
```

### Host (host -> frame)

```ts
import { connectHost } from '@belongnet/bridge-sdk'

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
    async showToast({ message, type }) {
      const variant = type === 'error' ? 'danger' : 'success'
      AppToast.show({ message, variant })
    },
  },
})

// Destroy when the iframe is removed or reloaded.
destroy()
```

## Available methods

### Host methods (frame -> host)

#### `getLocation`

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

#### `showToast`

- **Signature:** `showToast(payload: ToastPayload): Promise<void>`
- **Purpose:** Allows the frame to display a host-native toast notification.
- **Schema:** enforced via Zod on both the frame and host side

```ts
const toastSchema = z.object({
  message: z.string().min(1),
  icon: z.string().optional(),
  type: z.enum(['error', 'success']),
})

type ToastPayload = z.infer<typeof toastSchema>
```

### Frame methods (host -> frame)

#### `setTheme`

- **Signature:** `setTheme(theme: ThemeMode): Promise<void>`
- **Purpose:** Lets the host notify the iframe about theme changes.
- **Schema:** constrained to explicit theme values

```ts
type ThemeMode = 'light' | 'dark'
```

All responses are validated with Zod before being exposed to callers, ensuring the bridge stays resilient as new native capabilities are added.

## Development

Clone the repository and install dependencies:

```sh
pnpm install
pnpm run build
```

Implement new feature, check build, and make PR.


## Stack

- [Penpal](https://github.com/Aaronius/penpal) — RPC + postMessage bridge
- [Zod](https://zod.dev/) — runtime schema validation
- [TypeScript](https://www.typescriptlang.org/) — strict type safety

## License

MIT
