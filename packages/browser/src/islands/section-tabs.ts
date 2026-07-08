class SectionTabs extends HTMLElement {
  connectedCallback(): void {
    const tabs = Array.from(this.querySelectorAll('[data-spelling]'))
    if (tabs.length <= 1) return

    const target = this.dataset.target
    if (!target) return

    tabs.forEach((tab) => {
      const button = tab as HTMLButtonElement
      if (button.tagName !== 'BUTTON') return
      button.addEventListener('click', () => {
        const spelling = button.dataset.spelling
        if (!spelling) return

        tabs.forEach((t) => {
          const other = t as HTMLButtonElement
          other.setAttribute('aria-pressed', other === button ? 'true' : 'false')
        })

        const blocks = document.querySelectorAll(`[data-tab-target="${target}"]`)
        blocks.forEach((block) => {
          const el = block as HTMLElement
          const match = el.dataset.spelling === spelling
          el.hidden = !match
        })
      })
    })

    const firstActive = tabs.find((t) => t.getAttribute('aria-pressed') === 'true') ?? tabs[0]
    if (firstActive) (firstActive as HTMLButtonElement).click()
  }
}

customElements.define('section-tabs', SectionTabs)
