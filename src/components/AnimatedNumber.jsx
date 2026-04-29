import { useState, useEffect, useRef } from 'react'

export default function AnimatedNumber({ value, duration = 1200, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const startTime = useRef(null)
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value || 0

  useEffect(() => {
    if (!numValue) { setDisplay(0); return }
    startTime.current = null

    function animate(timestamp) {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(eased * numValue)
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }

    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [numValue, duration])

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display)

  return <>{prefix}{formatted.toLocaleString()}{suffix}</>
}
