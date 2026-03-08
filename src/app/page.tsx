'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [d, setD] = useState(null)
  useEffect(() => {
    const f = () => fetch('/api/data').then(r => r.json()).then(setD)
    f()
    const i = setInterval(f, 1000)
    return () => clearInterval(i)
  }, [])
  
  if (!d) return <div style={{ padding: 40 }}>Loading...</div>
  
  const fmt = (s) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  
  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ color: '#f7931a', marginBottom: 20 }}>📊 Live Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Workers</div>
          <div style={{ fontSize: 28, color: '#22c55e' }}>{d.workers}</div>
        </div>
        <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, borderLeft: '3px solid #f7931a' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Shares</div>
          <div style={{ fontSize: 28, color: '#f7931a' }}>{d.shares.toLocaleString()}</div>
        </div>
        <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Blocks</div>
          <div style={{ fontSize: 28, color: '#8b5cf6' }}>{d.blocks}</div>
        </div>
        <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, borderLeft: '3px solid #06b6d4' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Rate</div>
          <div style={{ fontSize: 28, color: '#06b6d4' }}>{d.rate.toFixed(0)}</div>
        </div>
        <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, borderLeft: '3px solid #ec4899' }}>
          <div style={{ fontSize: 12, color: '#888' }}>Uptime</div>
          <div style={{ fontSize: 28, color: '#ec4899' }}>{fmt(d.uptime)}</div>
        </div>
      </div>
      <div style={{ background: '#1a1a2e', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <span style={{ color: '#888' }}>Address: </span>
        <span style={{ color: '#f7931a', fontSize: 14 }}>{d.address}</span>
      </div>
      <div style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 40 }}>
        Live Dashboard • Updates every second
      </div>
    </div>
  )
}
