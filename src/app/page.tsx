'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [d, setD] = useState<any>(null)
  const [history, setHistory] = useState<number[]>([])
  
  useEffect(() => {
    const f = () => fetch('/api/data').then(r => r.json()).then(data => {
      setD(data)
      setHistory(h => [...h.slice(-59), data.rate])
    })
    f()
    const i = setInterval(f, 1000)
    return () => clearInterval(i)
  }, [])
  
  const addWorker = async () => {
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_worker' })
    })
  }
  
  if (!d) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#f7931a' }}>
        <div style={{ fontSize: 48 }}>⛏️</div>
        <div>Loading...</div>
      </div>
    </div>
  )
  
  const fmt = (s: number) => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const time = (t: string) => new Date(t).toLocaleTimeString()
  
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)', padding: 20, fontFamily: 'monospace', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(90deg, #f7931a, #ffab40)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0, color: '#000' }}>⛏️ Mining Pool</h1>
            <p style={{ margin: '8px 0 0', color: '#333', fontSize: 14 }}>24/7 Auto Mining Active</p>
          </div>
          <button onClick={addWorker} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            ➕ Add Worker
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Workers', v: d.workers, c: '#22c55e' },
          { l: 'Shares', v: d.shares?.toLocaleString(), c: '#f7931a' },
          { l: 'Blocks', v: d.blocks, c: '#8b5cf6' },
          { l: 'Rate', v: `${d.rate?.toFixed(0)} U/s`, c: '#06b6d4' },
          { l: 'Uptime', v: fmt(d.uptime), c: '#ec4899' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, borderLeft: `4px solid ${s.c}` }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 26, fontWeight: 'bold', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Address */}
      <div style={{ background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        💰 <span style={{ color: '#888', fontSize: 12 }}>Wallet: </span>
        <span style={{ color: '#f7931a', fontSize: 14, wordBreak: 'break-all' }}>{d.address}</span>
        <span style={{ marginLeft: 20, color: d.isLive ? '#22c55e' : '#ef4444', fontSize: 12 }}>
          {d.isLive ? '● LIVE' : '○ OFFLINE'}
        </span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Workers */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', color: '#f7931a', fontSize: 18 }}>👷 Active Workers</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: 8, textAlign: 'left', color: '#888' }}>Name</th>
                <th style={{ padding: 8, textAlign: 'right', color: '#888' }}>Rate</th>
                <th style={{ padding: 8, textAlign: 'right', color: '#888' }}>Shares</th>
              </tr>
            </thead>
            <tbody>
              {d.workersList?.map((w: any) => (
                <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 8 }}>⚡ {w.name}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#06b6d4' }}>{w.rate.toFixed(0)}</td>
                  <td style={{ padding: 8, textAlign: 'right', color: '#f7931a' }}>{w.shares}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', color: '#22c55e', fontSize: 18 }}>📊 Recent Activity</h2>
          <div style={{ maxHeight: 180, overflow: 'auto' }}>
            {d.recentActivity?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#666' }}>Starting...</div>
            ) : (
              d.recentActivity?.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.02)', borderRadius: 4, marginBottom: 2, fontSize: 12 }}>
                  <span style={{ color: '#22c55e' }}>✓ {a.worker}</span>
                  <span style={{ color: '#666' }}>{time(a.time)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', color: '#06b6d4', fontSize: 18 }}>📈 Rate (60s)</h2>
          <div style={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {history.map((h, i) => (
              <div key={i} style={{ flex: 1, background: 'linear-gradient(to top, #06b6d4, #0891b2)', height: `${Math.min((h / 200) * 100, 100)}%`, borderRadius: '2px 2px 0 0', minHeight: 2 }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#666', marginTop: 8 }}>
            <span>60s ago</span>
            <span>Now</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px', color: '#8b5cf6', fontSize: 18 }}>🎯 Results</h2>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>💎</div>
            <div style={{ fontSize: 24, color: '#8b5cf6', fontWeight: 'bold' }}>{d.blocks} Blocks</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Mining 24/7</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 30, paddingBottom: 20, color: '#666', fontSize: 12 }}>
        <div>⚡ Mining Pool v2.0 • 24/7 Auto Mining</div>
        <div style={{ marginTop: 8 }}>Updates every second • Works even when you're offline</div>
      </div>
    </div>
  )
}
