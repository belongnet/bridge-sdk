<script setup lang="ts">
import { Comment, Fragment, computed, useSlots } from 'vue'

const props = defineProps<{
  label: string
  description?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (event: 'call'): void
}>()

const slots = useSlots()
const hasRenderable = (nodes: unknown[]): boolean => {
  return nodes.some((node) => {
    if (!node || typeof node !== 'object') return false
    const vnode = node as { type?: unknown; children?: unknown }
    if (vnode.type === Comment) return false
    if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      return hasRenderable(vnode.children)
    }
    if (typeof vnode.children === 'string') {
      return vnode.children.trim().length > 0
    }
    if (Array.isArray(vnode.children)) {
      return hasRenderable(vnode.children)
    }
    return true
  })
}

const hasBody = computed(() => {
  const slot = slots.default?.() ?? []
  return hasRenderable(slot)
})
</script>

<template>
  <div class="rounded-xl border border-default p-3">
    <div class="flex items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="text-xs font-semibold text-default">{{ props.label }}</div>
        <div v-if="props.description" class="text-[11px] text-muted">— {{ props.description }}</div>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <UButton
          size="xs"
          color="primary"
          icon="i-lucide-play"
          :disabled="props.disabled"
          @click="emit('call')"
        >
          Call
        </UButton>
      </div>
    </div>

    <slot v-if="hasBody" />
  </div>
</template>
