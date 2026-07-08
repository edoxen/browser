class DecadeScroller extends HTMLElement {
  connectedCallback(): void {
    const links = this.querySelectorAll('a[href^="#decade-"]')
    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = (event.currentTarget as HTMLAnchorElement).getAttribute('href')
        if (!href) return
        const target = document.querySelector(href)
        if (!target) return
        event.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', href)
      })
    })
  }
}

customElements.define('decade-scroller', DecadeScroller)
