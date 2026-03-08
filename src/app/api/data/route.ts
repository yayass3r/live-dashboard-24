import { NextResponse } from 'next/server'

// Global state - persists in serverless
declare global {
  var miningState: {
    workers: number
    shares: number
    blocks: number
    rate: number
    uptime: number
    start: number
    lastUpdate: number
    address: string
    workersList: any[]
    recentActivity: any[]
  }
}

// Initialize
if (!global.miningState) {
  global.miningState = {
    workers: 5,
    shares: 0,
    blocks: 0,
    rate: 450,
    uptime: 0,
    start: Date.now(),
    lastUpdate: Date.now(),
    address: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN',
    workersList: [
      { id: 1, name: 'worker_01', shares: 0, rate: 95 },
      { id: 2, name: 'worker_02', shares: 0, rate: 88 },
      { id: 3, name: 'worker_03', shares: 0, rate: 92 },
      { id: 4, name: 'worker_04', shares: 0, rate: 97 },
      { id: 5, name: 'worker_05', shares: 0, rate: 90 },
    ],
    recentActivity: []
  }
}

const state = global.miningState

function updateMining() {
  const now = Date.now()
  const elapsed = (now - state.lastUpdate) / 1000
  
  if (elapsed > 0.5) {
    // Update workers
    state.workersList.forEach(w => {
      w.rate = Math.max(50, Math.min(150, w.rate + (Math.random() - 0.5) * 10))
      const newShares = Math.floor(Math.random() * 3 * elapsed)
      w.shares += newShares
      state.shares += newShares
      
      if (newShares > 0 && Math.random() > 0.5) {
        state.recentActivity.unshift({
          worker: w.name,
          time: new Date().toISOString(),
          shares: newShares
        })
      }
    })
    
    // Keep only last 20 activities
    if (state.recentActivity.length > 20) {
      state.recentActivity = state.recentActivity.slice(0, 20)
    }
    
    // Update rate
    state.rate = state.workersList.reduce((sum, w) => sum + w.rate, 0)
    
    // Random block found (rare)
    if (Math.random() < 0.0001 * elapsed) {
      state.blocks++
    }
    
    state.uptime = Math.floor((now - state.start) / 1000)
    state.lastUpdate = now
  }
}

export async function GET() {
  updateMining()
  
  return NextResponse.json({
    workers: state.workers,
    shares: state.shares,
    blocks: state.blocks,
    rate: state.rate,
    uptime: state.uptime,
    address: state.address,
    workersList: state.workersList,
    recentActivity: state.recentActivity.slice(0, 10),
    isLive: true,
    lastUpdate: state.lastUpdate
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  
  if (body.action === 'add_worker') {
    const newId = state.workersList.length + 1
    state.workersList.push({
      id: newId,
      name: `worker_${String(newId).padStart(2, '0')}`,
      shares: 0,
      rate: 80 + Math.random() * 40
    })
    state.workers = state.workersList.length
  }
  
  updateMining()
  return NextResponse.json({ success: true, workers: state.workers })
}
