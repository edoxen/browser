const STORAGE_KEY = 'edoxen-theme'
const ATTR = 'data-theme'

function applyTheme(next: 'light' | 'dark') {
  document.documentElement.setAttribute(ATTR, next)
}

function preferredTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

class ThemeToggle extends HTMLElement {
  connectedCallback() {
    const initial = preferredTheme()
    applyTheme(initial)
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Toggle dark mode')
    btn.textContent = initial === 'dark' ? '☀' : '☾'
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute(ATTR) === 'dark' ? 'dark' : 'light'
      const next = current === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      localStorage.setItem(STORAGE_KEY, next)
      btn.textContent = next === 'dark' ? '☀' : '☾'
    })
    this.appendChild(btn)
  }
}

customElements.define('theme-toggle', ThemeToggle)
