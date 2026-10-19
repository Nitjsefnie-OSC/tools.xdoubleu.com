import { useEffect } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

// Beacons each Web Vitals sample to POST /web-vitals.
function reportWebVital(metric: Metric) {
  const body = JSON.stringify({ name: metric.name, value: metric.value })

  if (typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/web-vitals', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/web-vitals', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true
  }).catch(() => {})
}

export function WebVitals(): null {
  useEffect(() => {
    onCLS(reportWebVital)
    onFCP(reportWebVital)
    onINP(reportWebVital)
    onLCP(reportWebVital)
    onTTFB(reportWebVital)
  }, [])
  return null
}
