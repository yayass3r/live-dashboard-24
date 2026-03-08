import { NextResponse } from 'next/server'

let state = {
  workers: 5,
  shares: 0,
  blocks: 0,
  rate: 450,
  uptime: 0,
  start: Date.now()
}

export async function GET() {
  state.shares += Math.floor(Math.random() * 10)
  state.rate = 400 + Math.random() * 100
  state.uptime = Math.floor((Date.now() - state.start) / 1000)
  if (Math.random() < 0.001) state.blocks++
  return NextResponse.json({ ...state, address: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN' })
}
