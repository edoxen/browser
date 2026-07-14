<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  endpoint: string
  basePath: string
}>()

function urnToPath(urn: string): string {
  return encodeURIComponent(urn).replace(/%3A/g, ':')
}

interface DecisionItem {
  urn: string
  title?: string
  bodyType?: string
  kind?: string
}

const items = ref<DecisionItem[]>([])
const query = ref('')
const activeBodies = ref(new Set<string>())
const activeKinds = ref(new Set<string>())
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const res = await fetch(props.endpoint)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    items.value = data.items ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
})

const bodies = computed(() => [...new Set(items.value.map(i => i.bodyType).filter(Boolean))])
const kinds = computed(() => [...new Set(items.value.map(i => i.kind).filter(Boolean))])

const filtered = computed(() =>
  items.value.filter(item => {
    const q = query.value.trim().toLowerCase()
    if (q && !`${item.title ?? ''} ${item.urn}`.toLowerCase().includes(q)) return false
    if (activeBodies.value.size > 0 && !activeBodies.value.has(item.bodyType ?? '')) return false
    if (activeKinds.value.size > 0 && !activeKinds.value.has(item.kind ?? '')) return false
    return true
  })
)

function toggleBody(code: string) {
  activeBodies.value.has(code) ? activeBodies.value.delete(code) : activeBodies.value.add(code)
}
function toggleKind(kind: string) {
  activeKinds.value.has(kind) ? activeKinds.value.delete(kind) : activeKinds.value.add(kind)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <input
      v-model="query"
      type="search"
      placeholder="Search decisions…"
      class="w-full px-4 py-2.5 border border-border rounded-md bg-surface text-text placeholder:text-muted focus:border-accent focus:outline-none transition-colors duration-150"
    />

    <div v-if="bodies.length > 0 || kinds.length > 0" class="flex flex-wrap gap-2">
      <button
        v-for="body in bodies"
        :key="'body-' + body"
        type="button"
        @click="toggleBody(body)"
        :class="[
          'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer',
          activeBodies.has(body)
            ? 'bg-accent text-white border-accent'
            : 'bg-surface text-muted border-border hover:border-accent hover:text-primary'
        ]"
      >{{ body }}</button>
      <button
        v-for="kind in kinds"
        :key="'kind-' + kind"
        type="button"
        @click="toggleKind(kind)"
        :class="[
          'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer',
          activeKinds.has(kind)
            ? 'bg-accent text-white border-accent'
            : 'bg-surface text-muted border-border hover:border-accent hover:text-primary'
        ]"
      >{{ kind }}</button>
    </div>

    <p v-if="loading" class="py-4 text-muted text-sm">Loading decisions…</p>
    <p v-else-if="error" class="py-4 text-danger text-sm">Failed to load: {{ error }}</p>
    <p v-else-if="filtered.length === 0" class="py-8 text-center text-muted border border-dashed border-border rounded-md bg-surface">
      No matches found.
    </p>

    <ul v-else class="flex flex-col gap-3.5 list-none p-0 m-0">
      <li
        v-for="item in filtered"
        :key="item.urn"
        class="p-5 px-6 border border-border rounded-md bg-surface shadow-xs hover:shadow-sm hover:border-accent transition-all duration-150"
      >
        <a
          :href="`${basePath}/${urnToPath(item.urn)}`"
          class="font-serif text-lg font-semibold text-text no-underline hover:text-accent"
        >{{ item.title || item.urn }}</a>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mt-2.5 text-sm text-muted">
          <template v-if="item.bodyType">
            <dt class="font-semibold uppercase text-xs tracking-wide">Body</dt>
            <dd class="m-0">{{ item.bodyType }}</dd>
          </template>
          <template v-if="item.kind">
            <dt class="font-semibold uppercase text-xs tracking-wide">Kind</dt>
            <dd class="m-0">{{ item.kind }}</dd>
          </template>
        </dl>
      </li>
    </ul>
  </div>
</template>
