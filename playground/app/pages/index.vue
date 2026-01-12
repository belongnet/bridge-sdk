<script setup lang="ts">
import { connectHost, type LocationPayload, type ToastPayload } from '@belongnet/bridge-sdk'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const iframeRef = ref<HTMLIFrameElement | null>(null)
const status = ref<'idle' | 'connecting' | 'connected' | 'serving' | 'error'>('idle')
const errorMessage = ref<string | null>(null)

let connection: { destroy(): void } | null = null
const toast = useToast()

const readLocation = async (): Promise<LocationPayload> => {
  const payload: LocationPayload = {
    lat: 55.7558,
    lng: 37.6173,
    accuracy: 12,
    ts: Date.now(),
  }
  return payload
}

onMounted(async () => {
  await nextTick()
  const iframe = iframeRef.value
  if (!iframe) return

  status.value = 'connecting'
  try {
    connection = await connectHost({
      iframe,
      allowedOrigins: [window.location.origin],
      methods: {
        async getLocation() {
          status.value = 'serving'
          try {
            return await readLocation()
          } finally {
            status.value = 'connected'
          }
        },
        async showToast(payload: ToastPayload) {
          toast.add({
            title: payload.msg,
            icon: payload.icon,
            color: payload.type === 'error' ? 'error' : 'success',
          })
        },
      },
    })
    status.value = 'connected'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Failed to connect to the frame.'
  }
})

onBeforeUnmount(() => {
  connection?.destroy()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-900">Host status:</span>
      <UBadge
        :color="status === 'connected' || status === 'serving' ? 'success' : status === 'error' ? 'error' : 'neutral'"
        variant="subtle"
        :icon="status === 'connected' || status === 'serving' ? 'i-lucide-check-circle' : status === 'error' ? 'i-lucide-x-circle' : 'i-lucide-circle'"
      >
       {{ status }}
      </UBadge>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-slate-400">
          iframe
        </div>
        <ClientOnly>
          <iframe
            ref="iframeRef"
            src="/frame"
            title="Bridge SDK Frame"
            class="h-[520px] w-full border-0 bg-white"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
