<script setup lang="ts">
import { connectToHost, type LocationPayload } from '@belongnet/bridge-sdk'
import { onBeforeUnmount, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'frame',
})

const status = ref<'idle' | 'connecting' | 'ready' | 'requesting' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const payload = ref<LocationPayload | null>(null)
const isEmbedded = ref(false)

let connection: { destroy(): void; remote: { getLocation: () => Promise<LocationPayload> } } | null = null

const connect = async () => {
  status.value = 'connecting'
  errorMessage.value = null
  try {
    connection = await connectToHost({
      allowedOrigins: [window.location.origin],
    })
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Could not connect to the host.'
  }
}

const requestLocation = async () => {
  if (!connection) return
  status.value = 'requesting'
  errorMessage.value = null
  try {
    payload.value = await connection.remote.getLocation()
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch location from host.'
  }
}

const triggerToast = async (payload: { msg: string; icon?: string; type: 'error' | 'success' }) => {
  if (!connection) return
  try {
    await connection.remote.showToast(payload)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Failed to send toast request.'
  }
}

onMounted(async () => {
  isEmbedded.value = window.parent !== window
  if (!isEmbedded.value) {
    status.value = 'error'
    errorMessage.value = 'This page must be opened inside the host iframe.'
    return
  }

  await connect()
})

onBeforeUnmount(() => {
  connection?.destroy()
})
</script>

<template>
  <div class="mx-auto flex h-full max-w-md flex-col gap-6">
      <div class="flex items-center gap-2">
        <span class="text-sm text-slate-900">Frame status:</span>
        <UBadge
          :color="status === 'ready' ? 'success' : status === 'error' ? 'error' : 'neutral'"
          variant="subtle"
          :icon="status === 'ready' ? 'i-lucide-check-circle' : status === 'error' ? 'i-lucide-x-circle' : 'i-lucide-circle'"
        >
         {{ status }}
        </UBadge>
      </div>

      <div class="mt-4 text-xs text-slate-600">
        <div class="text-[10px] uppercase tracking-[0.2em] text-slate-400">Functions</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            size="xs"
            color="primary"
            icon="i-lucide-play"
            :disabled="status !== 'ready'"
            @click="requestLocation"
          >
            getLocation()
          </UButton>
          <span class="self-center text-[11px] text-slate-500">Returns the current device location.</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <UButton
            size="xs"
            color="success"
            icon="i-lucide-play"
            :disabled="status !== 'ready'"
            @click="triggerToast({ msg: 'Success from frame', icon: 'i-lucide-check', type: 'success' })"
          >
            showToast(success)
          </UButton>
          <UButton
            size="xs"
            color="error"
            icon="i-lucide-play"
            :disabled="status !== 'ready'"
            @click="triggerToast({ msg: 'Error from frame', icon: 'i-lucide-alert-triangle', type: 'error' })"
          >
            showToast(error)
          </UButton>
          <span class="self-center text-[11px] text-slate-500">Display a toast in the host app.</span>
        </div>
      </div>

      <div class="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-xs text-slate-100">
        <pre class="whitespace-pre-wrap">{{ payload ? JSON.stringify(payload, null, 2) : '{ }' }}</pre>
      </div>

      <p v-if="errorMessage" class="mt-3 text-xs text-rose-600">
        {{ errorMessage }}
      </p>

  </div>
</template>
