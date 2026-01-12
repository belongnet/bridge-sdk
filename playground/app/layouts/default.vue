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
  <div class="bg-default text-default">
    <div class="py-4 px-6">
      <h1 class="font-semibold text-default text-center">
        <NuxtLink
          to="https://github.com/belongnet/bridge-sdk"
          target="_blank"
          class="underline"
        >@belongnet/bridge-sdk</NuxtLink> - Playground
      </h1>
    </div>

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
          <UColorModeSwitch />
        </template>
      </UNavigationMenu>
    </footer>
  </div>
</template>
