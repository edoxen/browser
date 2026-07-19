// Reading-progress bar: a thin accent fill pinned to the top of the
// viewport tracking scroll position through the page. Present on detail
// pages only (the page opts in by rendering <reading-progress>).
class ReadingProgress extends HTMLElement {
  private fill: HTMLElement | null = null
  private onScroll = (): void => this.update()

  connectedCallback(): void {
    const fill = document.createElement('div')
    fill.className = 'edoxen-reading-progress__fill'
    this.replaceChildren(fill)
    this.fill = fill
    window.addEventListener('scroll', this.onScroll, { passive: true })
    window.addEventListener('resize', this.onScroll)
    this.update()
  }

  disconnectedCallback(): void {
    window.removeEventListener('scroll', this.onScroll)
    window.removeEventListener('resize', this.onScroll)
  }

  private update(): void {
    if (!this.fill) return
    const doc = document.documentElement
    const scrollable = doc.scrollHeight - window.innerHeight
    const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 100
    this.fill.style.width = `${pct}%`
  }
}

customElements.define('reading-progress', ReadingProgress)
