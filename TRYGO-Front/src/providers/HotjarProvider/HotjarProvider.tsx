import { FC, useEffect } from 'react'

declare global {
  interface Window {
    hj: any
    _hjSettings: {
      hjid: number
      hjsv: number
    }
  }
}

interface HotjarProviderProps {
  hjid?: number
  hjsv?: number
}

const HotjarProvider: FC<HotjarProviderProps> = ({ 
  hjid = 6541579, 
  hjsv = 6 
}) => {
  useEffect(() => {
    // Only initialize in production environment
    if (process.env.NODE_ENV !== 'production') {
      console.log('Hotjar is disabled in development mode')
      return
    }

    // Initialize Hotjar
    (function(h: any, o: any, t: string, j: string, a?: any, r?: any) {
      h.hj = h.hj || function() {
        (h.hj.q = h.hj.q || []).push(arguments)
      }
      h._hjSettings = { hjid, hjsv }
      a = o.getElementsByTagName('head')[0]
      r = o.createElement('script')
      r.async = 1
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv
      a.appendChild(r)
    })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=')

    // Cleanup function (optional)
    return () => {
      // Hotjar doesn't provide a cleanup method, but we can at least log
      console.log('Hotjar Provider unmounted')
    }
  }, [hjid, hjsv])

  return null
}

export default HotjarProvider
