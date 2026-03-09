import { NextResponse } from 'next/server'

/**
 * ============================================
 * 🔧 REAL MINING POOL API CONFIGURATION
 * ============================================
 */

// 👇 PASTE YOUR WALLET ADDRESS HERE
const WALLET_ADDRESS = '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN'

// 👇 PASTE YOUR MINING POOL API URL HERE
// Example for Braiins: https://pool.braiins.com/accounts/profile/json/btc
// Example for F2Pool: https://api.f2pool.com/{wallet_address}
const POOL_API_URL = 'YOUR_POOL_API_URL_HERE'

// 👇 PASTE YOUR API KEY/TOKEN HERE (if required)
const API_KEY = 'YOUR_API_KEY_HERE'

// Pool name for display
const POOL_NAME = 'Your Pool Name'

/**
 * ============================================
 * FETCH REAL MINING DATA
 * ============================================
 */
async function fetchMiningData() {
  try {
    const response = await fetch(POOL_API_URL, {
      method: 'GET',
      headers: {
        // Add your pool's required headers
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      // Revalidate every 60 seconds
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      throw new Error(`Pool API error: ${response.status}`)
    }

    const data = await response.json()
    
    /**
     * 👇 CUSTOMIZE THIS MAPPING
     * Map your pool's API response fields to our format
     * 
     * Example mapping - adjust field names to match your pool's API:
     */
    return {
      workers: data.active_workers || data.workers || 0,
      shares: data.valid_shares || data.shares || 0,
      blocks: data.blocks_found || data.blocks || 0,
      rate: data.hashrate || data.current_hashrate || 0,
      uptime: data.uptime_seconds || data.uptime || 0,
      address: WALLET_ADDRESS,
      workersList: (data.workers_list || data.workers || []).map((w: any, i: number) => ({
        id: i + 1,
        name: w.name || w.worker_name || `worker_${i + 1}`,
        shares: w.shares || w.valid_shares || 0,
        rate: w.hashrate || w.rate || 0,
        status: w.alive || w.status === 'active' ? 'active' : 'offline'
      })),
      recentActivity: (data.recent_shares || data.activity || []).slice(0, 10),
      poolName: POOL_NAME,
      isLive: true,
      timestamp: Date.now()
    }
  } catch (error: any) {
    console.error('Pool API Error:', error.message)
    return null
  }
}

/**
 * ============================================
 * ERROR FALLBACK
 * ============================================
 */
function getErrorFallback(error: string) {
  return {
    workers: 0,
    shares: 0,
    blocks: 0,
    rate: 0,
    uptime: 0,
    address: WALLET_ADDRESS,
    workersList: [],
    recentActivity: [],
    poolName: 'Disconnected',
    isLive: false,
    error: error,
    timestamp: Date.now()
  }
}

/**
 * ============================================
 * MAIN API ROUTE
 * ============================================
 */
export async function GET() {
  const miningData = await fetchMiningData()

  if (!miningData) {
    return NextResponse.json({
      ...getErrorFallback('Failed to connect to pool API'),
      help: `
        Configure your mining pool:
        1. Set POOL_API_URL to your pool's API endpoint
        2. Set API_KEY if required
        3. Map response fields in fetchMiningData()
        
        Popular pool APIs:
        - Braiins: https://pool.braiins.com/accounts/profile/json/btc
        - F2Pool: https://api.f2pool.com/{wallet}
        - Binance: https://pool.binance.com
      `
    })
  }

  return NextResponse.json(miningData)
}

export async function POST(request: Request) {
  return NextResponse.json({
    success: false,
    message: 'Configure workers in your pool dashboard'
  })
}
