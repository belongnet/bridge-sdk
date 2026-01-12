<script lang="ts" setup>
import { ref } from 'vue'

const footerItems = ref([
  {
    label: 'cm',
    slot: 'cm',
    as: 'div'
  },
  {
    label: '',
    to: 'https://belong.net/',
    slot: 'belong'
  },
  {
    icon: 'i-simple-icons-github',
    to: 'https://github.com/belongnet/bridge-sdk',
    target: '_blank'
  }
])
</script>

<template>
  <div class="bg-white text-slate-900">
    <UHeader class="border-b border-slate-200 bg-white">
      <template #left>
        <div class="flex items-center gap-3">
          <div class="text-sm font-semibold text-slate-900">
             <NuxtLink
              to="https://github.com/belongnet/bridge"
              target="_blank"
              class="underline"
            >@belongnet/bridge</NuxtLink> - Playground
          </div>
        </div>
      </template>

      <template #right>
        <UButton
          to="https://github.com/belongnet/bridge"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UContainer
      as="main"
      class="py-2"
    >
      <slot />
    </UContainer>

    <footer class="my-10">
      <UNavigationMenu
        :items="footerItems"
        class="justify-center"
        variant="link"
      >
        <template #belong>
          {{ new Date().getFullYear() }} &copy; Belong.net
        </template>
        <template #cm>
          <ColorModeButton />
        </template>
      </UNavigationMenu>
    </footer>
  </div>
</template>
