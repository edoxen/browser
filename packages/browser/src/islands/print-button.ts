class PrintButton extends HTMLElement {
  connectedCallback(): void {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'edoxen-print-button'
    btn.textContent = this.dataset.label ?? 'Print'
    btn.addEventListener('click', () => window.print())
    this.appendChild(btn)
  }
}

customElements.define('print-button', PrintButton)
