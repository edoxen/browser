<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface LocaleEntry {
  code: string
  label: string
  routePrefix: string
}

const props = defineProps<{
  locales: LocaleEntry[]
  current: string
}>()

const open = ref(false)
const currentPath = ref('/')

onMounted(() => {
  currentPath.value = window.location.pathname.replace(/\/+$/, '') || '/'
})

const nonDefaultLocales = computed(() => props.locales.filter((l) => l.routePrefix))

function buildUrl(targetPrefix: string): string {
  let stripped = currentPath.value
  for (const l of nonDefaultLocales.value) {
    if (stripped.startsWith(l.routePrefix + '/')) {
      stripped = stripped.slice(l.routePrefix.length)
      break
    }
  }
  if (!stripped.startsWith('/')) stripped = '/' + stripped
  return targetPrefix ? targetPrefix + stripped : stripped
}

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

const currentLocale = computed(() => props.locales.find((l) => l.code === props.current) ?? props.locales[0])
</script>

<template>
  <div class="relative" @mouseleave="close">
    <button
      type="button"
      @click="toggle"
      class="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted hover:text-primary hover:bg-border/50 transition-all"
      :aria-label="`Switch language (current: ${currentLocale?.label})`"
      aria-haspopup="true"
      :aria-expanded="open"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span class="font-mono text-xs uppercase">{{ current?.slice(0, 3) }}</span>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <ul
        v-if="open"
        class="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-md shadow-md py-1 list-none p-0 m-0 z-50"
      >
        <li v-for="l in locales" :key="l.code">
          <a
            :href="buildUrl(l.routePrefix)"
            class="flex items-center justify-between px-3 py-1.5 text-sm no-underline transition-colors"
            :class="l.code === current ? 'text-accent font-semibold bg-accent/5' : 'text-text hover:bg-border/40'"
            @click="close"
          >
            <span>{{ l.label }}</span>
            <span class="font-mono text-[10px] text-muted uppercase">{{ l.code }}</span>
          </a>
        </li>
      </ul>
    </Transition>
  </div>
</template>
