<script setup lang="ts">
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'edoxen-theme'
const isDark = ref(false)

function applyTheme() {
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') {
    isDark.value = stored === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

function toggle() {
  isDark.value = !isDark.value
  applyTheme()
  localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <button
    type="button"
    @click="toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    class="p-2 rounded-sm text-muted hover:bg-border/60 hover:text-primary transition-colors duration-150 cursor-pointer text-lg"
  >{{ isDark ? '☀' : '☾' }}</button>
</template>
