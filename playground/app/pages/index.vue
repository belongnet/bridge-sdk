<script setup lang="ts">
import { connectHost, type LocationPayload, type ToastPayload, type ThemeMode } from '@belongnet/bridge-sdk'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const iframeRef = ref<HTMLIFrameElement | null>(null)
const status = ref<'idle' | 'connecting' | 'connected' | 'serving' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const frameTheme = ref<ThemeMode>('light')
const hostForm = ref({
  theme: 'light' as ThemeMode,
})
const paramsOpen = ref<Record<string, boolean>>({})

let connection: Awaited<ReturnType<typeof connectHost>> | null = null
const toast = useToast()

const readLocation = async (): Promise<LocationPayload> => {
  const payload: LocationPayload = {
    lat: 55.7558,
    lng: 37.6173,
    accuracy: 12,
    ts: Date.now()
  }
  return payload
}

const sendTheme = async () => {
  if (!connection) return
  try {
    await connection.remote.setTheme(hostForm.value.theme)
    frameTheme.value = hostForm.value.theme
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to send theme to the frame.'
  }
}

const hostMethods = computed(() => [
  {
    key: 'setTheme',
    label: 'setTheme()',
    description: 'Send theme preference to the frame.',
    args: [
      {
        key: 'theme',
        label: 'theme',
        type: 'select',
        options: ['light', 'dark'],
      },
    ],
    call: sendTheme,
  },
])

const toggleParams = (key: string) => {
  paramsOpen.value = {
    ...paramsOpen.value,
    [key]: !paramsOpen.value[key],
  }
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
            title: payload.message,
            icon: payload.icon,
            color: payload.type === 'error' ? 'error' : 'success'
          })
        }
      }
    })
    status.value = 'connected'
    await connection.remote.setTheme(frameTheme.value)
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
      <span class="text-sm text-default">Host status:</span>
      <UBadge
        :color="status === 'connected' || status === 'serving' ? 'success' : status === 'error' ? 'error' : 'neutral'"
        variant="subtle"
        :icon="status === 'connected' || status === 'serving' ? 'i-lucide-check-circle' : status === 'error' ? 'i-lucide-x-circle' : 'i-lucide-circle'"
      >
        {{ status }}
      </UBadge>
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="text-xs text-muted">
        <div class="text-[10px] uppercase text-muted">App Methods</div>
        <div class="mt-3 space-y-3">
          <div class="max-w-md">
          <FunctionItem
            v-for="method in hostMethods"
            :key="method.key"
            :label="method.label"
            :description="method.description"
            :disabled="status !== 'connected' && status !== 'serving'"
            @call="method.call"
          >
            <template #actions>
              <UButton
                v-if="method.args?.length"
                icon="i-lucide-settings"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Parameters"
                :ui="{ base: 'hover:bg-transparent text-muted hover:text-default' }"
                @click="toggleParams(method.key)"
              />
            </template>
            <UCollapsible
              v-if="method.args?.length"
              v-model:open="paramsOpen[method.key]"
              class="flex flex-col gap-2"
            >
              <template #content>
                <div class="mt-3 rounded-lg border border-default p-3">
                  <div class="grid gap-2">
                    <div
                      v-for="arg in method.args"
                      :key="arg.key"
                      class="grid gap-1"
                    >
                      <label class="text-[11px] uppercase text-muted">{{ arg.label }}</label>
                      <USelect
                        v-if="arg.type === 'select'"
                        v-model="hostForm[arg.key as 'theme']"
                        :items="arg.options"
                        size="xs"
                      />
                    </div>
                  </div>
                </div>
              </template>
            </UCollapsible>
          </FunctionItem>
        </div>
      </div>
      </div>
      <div class="overflow-hidden rounded-lg border border-default bg-default">
        <div class="border-b border-default px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-muted">
          iframe
        </div>
        <ClientOnly>
          <iframe
            ref="iframeRef"
            src="/frame"
            title="Bridge SDK Frame"
            class="h-[520px] w-full border-0 bg-default"
          />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
