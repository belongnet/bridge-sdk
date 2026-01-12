<script setup lang="ts">
import { connectToHost, type LocationPayload, type ThemeMode } from '@belongnet/bridge-sdk'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

definePageMeta({
  layout: 'frame'
})

const status = ref<'idle' | 'connecting' | 'ready' | 'requesting' | 'error'>('idle')
const errorMessage = ref<string | null>(null)
const payload = ref<LocationPayload | null>(null)
const isEmbedded = ref(false)
const frameTheme = ref<ThemeMode>('light')
const colorMode = useColorMode()

const connection = shallowRef<Awaited<ReturnType<typeof connectToHost>> | null>(null)
const toastForm = ref({
  message: 'Hello from frame',
  icon: 'i-lucide-check',
  type: 'success' as 'error' | 'success'
})

const connect = async () => {
  status.value = 'connecting'
  errorMessage.value = null
  try {
    connection.value = await connectToHost({
      allowedOrigins: [window.location.origin],
      methods: {
        async setTheme(theme) {
          frameTheme.value = theme
          colorMode.value = theme
        }
      }
    })
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Could not connect to the host.'
  }
}

const requestLocation = async () => {
  if (!connection.value) return
  status.value = 'requesting'
  errorMessage.value = null
  try {
    payload.value = await connection.value.remote.getLocation()
    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Failed to fetch location from host.'
  }
}

const triggerToast = async (payload: { message: string, icon?: string, type: 'error' | 'success' }) => {
  if (!connection.value) return
  try {
    await connection.value.remote.showToast(payload)
  } catch (error) {
    status.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : 'Failed to send toast request.'
  }
}

const paramsOpen = ref<Record<string, boolean>>({})

const methods = computed(() => [
  {
    key: 'getLocation',
    label: 'getLocation()',
    description: 'Returns the current device location.',
    args: [],
    call: requestLocation
  },
  {
    key: 'showToast',
    label: 'showToast()',
    description: 'Display a toast in the host app.',
    args: [
      {
        key: 'message',
        label: 'message',
        type: 'text',
        placeholder: 'Message'
      },
      {
        key: 'icon',
        label: 'icon',
        type: 'text',
        placeholder: 'Icon (optional)'
      },
      {
        key: 'type',
        label: 'type',
        type: 'select',
        options: ['success', 'error']
      }
    ],
    call: () => triggerToast({
      message: toastForm.value.message,
      icon: toastForm.value.icon || undefined,
      type: toastForm.value.type
    })
  }
])

const canCall = (key: string) => {
  if (status.value !== 'ready') return false
  if (key === 'showToast') return toastForm.value.message.trim().length > 0
  return true
}

const toggleParams = (key: string) => {
  paramsOpen.value = {
    ...paramsOpen.value,
    [key]: !paramsOpen.value[key],
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
  connection.value?.destroy()
})
</script>

<template>
  <div class="mx-auto flex h-full max-w-md flex-col gap-2">
    <div class="flex items-center gap-2">
      <span class="text-sm text-default">Frame status:</span>
      <UBadge
        :color="status === 'ready' ? 'success' : status === 'error' ? 'error' : 'neutral'"
        variant="subtle"
        :icon="status === 'ready' ? 'i-lucide-check-circle' : status === 'error' ? 'i-lucide-x-circle' : 'i-lucide-circle'"
      >
        {{ status }}
      </UBadge>
    </div>

    <UCollapsible class="flex flex-col gap-2 text-xs text-muted" default-open>
      <div class="-mx-2 px-2">
        <UButton
          label="Incoming state"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          size="xs"
          class="group w-full px-0 text-[10px] uppercase text-muted hover:text-default hover:bg-transparent"
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200', base: 'hover:bg-transparent' }"
          block
        />
      </div>
      <template #content>
        <div class="rounded-lg border border-default px-3 py-2 text-xs text-muted">
          <span>Theme: {{ frameTheme }}</span>
        </div>
      </template>
    </UCollapsible>

    <div class="mt-2 text-xs text-muted">
      <div class="text-[10px] uppercase text-muted">
        Frame Methods
      </div>
      <div class="mt-3 space-y-3">
        <FunctionItem
          v-for="method in methods"
          :key="method.key"
          :label="method.label"
          :description="method.description"
          :disabled="!canCall(method.key)"
          @call="method.call"
        >
          <template #actions>
            <UButton
              v-if="method.args.length"
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
            v-if="method.args.length"
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
                      v-model="toastForm[arg.key as 'type']"
                      :items="arg.options"
                      size="xs"
                    />
                    <UInput
                      v-else
                      v-model="toastForm[arg.key as 'message' | 'icon']"
                      size="xs"
                      :placeholder="arg.placeholder"
                    />
                  </div>
                </div>
              </div>
            </template>
          </UCollapsible>
        </FunctionItem>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-muted px-4 py-3 text-xs text-default">
      <pre class="whitespace-pre-wrap">{{ payload ? JSON.stringify(payload, null, 2) : '{ }' }}</pre>
    </div>

    <p
      v-if="errorMessage"
      class="mt-3 text-xs text-rose-600"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
