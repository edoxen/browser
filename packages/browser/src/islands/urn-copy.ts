class UrnCopy extends HTMLElement {
  connectedCallback() {
    const text = this.dataset.text ?? this.textContent ?? ''
    if (!text) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'edoxen-urn-copy__button'
    btn.setAttribute('aria-label', `Copy ${this.dataset.label ?? 'URN'} to clipboard`)
    btn.textContent = 'Copy'
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text)
        btn.textContent = 'Copied'
        setTimeout(() => {
          btn.textContent = 'Copy'
        }, 1500)
      } catch {
        btn.textContent = 'Press Ctrl+C'
        setTimeout(() => {
          btn.textContent = 'Copy'
        }, 1500)
      }
    })
    this.replaceChildren(btn)
  }
}

customElements.define('urn-copy', UrnCopy)
