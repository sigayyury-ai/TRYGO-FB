interface GTMEvent {
  event: string
  [key: string]: any
}

export const pushGTMEvent = (event: GTMEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.event, event)
  }
}