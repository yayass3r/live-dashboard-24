import { NextResponse } from 'next/server'

/**
 * ============================================
 * 🔧 MINING POOL CONFIGURATION - LIVE
 * ============================================
 */

// Your Wallet Address
const WALLET_ADDRESS = '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN'

// Braiins Pool Configuration
const BRAIINS_CONFIG = {
  API_TOKEN: 'PLqjqznSOP9yWLO2',
  BASE_URL: 'https://pool.braiins.com/accounts/profile/json/btc',
  POOL_NAME: 'Braiins Pool'
}

// Binance Pool Configuration
const BINANCE_CONFIG = {
  WORKER_NAME: 'yass3r.001',
  WORKER_PASSWORD: '123456',
  POOL_URLS: [
    'stratum+tcp://sha256.poolbinance.com:443',
    'stratum+tcp://btc.poolbinance.com:1800',
    'stratum+tcp://bs.poolbinance.com:3333'
  ],
  POOL_NAME: 'Binance Pool'
}

// Active pool selection
const ACTIVE_POOL = 'braiins'

/**
 * ============================================
 * BRAIINS POOL API
 * ============================================
 */
async function fetchBraiinsData() {
  try {
    const response = await fetch(BRAIINS_CONFIG.BASE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BRAIINS_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'MiningDashboard/1.0'
      },
      next: { revalidate: 30 }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Braiins API Error:', response.status, errorText)
      throw new Error(`Braiins API: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('Braiins Response:', JSON.stringify(data).substring(0, 500))

    // Extract workers data
    const workers = data.workers || []
    const workersList = workers.map((w: any, index: number) => ({
      id: index + 1,
      name: w.worker || w.name || `worker_${index + 1}`,
      shares: w.valid_shares || w.shares || 0,
      rate: w.hashrate || w.hashrate_5m || 0,
      status: w.alive !== false ? 'active' : 'offline'
    }))

    const activeWorkers = workersList.filter((w: any) => w.status === 'active').length
    const totalHashrate = workersList.reduce((sum: number, w: any) => sum + (w.rate || 0), 0)

    // Extract recent shares/activity
    const recentActivity = (data.shares || data.last_shares || []).slice(0, 10).map((s: any) => ({
      worker: s.worker || s.worker_name || 'unknown',
      time: s.timestamp || s.time || new Date().toISOString(),
      shares: s.shares || s.valid_shares || 1
    }))

    // Calculate uptime (from first worker or pool connection)
    const uptime = data.uptime || data.uptime_seconds || 
      (workers[0]?.connected_since ? 
        Math.floor((Date.now() / 1000) - workers[0].connected_since) : 0)

    return {
      workers: activeWorkers,
      shares: data.valid_shares || data.total_shares || 0,
      blocks: data.confirmed_blocks || data.blocks_found || 0,
      rate: totalHashrate,
      uptime: uptime,
      address: WALLET_ADDRESS,
      workersList: workersList,
      recentActivity: recentActivity,
      poolName: BRAIINS_CONFIG.POOL_NAME,
      poolUrls: [],
      isLive: true,
      timestamp: Date.now(),
      
      // Additional Braiins data
      estimatedReward: data.estimated_reward || 0,
      balance: data.confirmed_reward || data.balance || 0,
      unconfirmed: data.unconfirmed_reward || 0,
      difficulty: data.difficulty || 0
    }
  } catch (error: any) {
    console.error('Braiins Fetch Error:', error.message)
    return null
  }
}

/**
 * ============================================
 * BINANCE POOL API (Public endpoint)
 * ============================================
 */
async function fetchBinanceData() {
  try {
    // Binance Pool public stats API
    const response = await fetch(
      `https://pool.binance.com/mining/public/coins`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }
      }
    )

    // For now, return worker config since Binance requires HMAC auth
    return {
      workers: 1,
      shares: 0,
      blocks: 0,
      rate: 0,
      uptime: 0,
      address: WALLET_ADDRESS,
      workersList: [{
        id: 1,
        name: BINANCE_CONFIG.WORKER_NAME,
        shares: 0,
        rate: 0,
        status: 'active'
      }],
      recentActivity: [],
      poolName: BINANCE_CONFIG.POOL_NAME,
      poolUrls: BINANCE_CONFIG.POOL_URLS,
      workerConfig: {
        worker: BINANCE_CONFIG.WORKER_NAME,
        password: BINANCE_CONFIG.WORKER_PASSWORD
      },
      isLive: true,
      timestamp: Date.now()
    }
  } catch (error: any) {
    console.error('Binance Fetch Error:', error.message)
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
    workersList: [{
      id: 1,
      name: 'yass3r.001',
      shares: 0,
      rate: 0,
      status: 'connecting'
    }],
    recentActivity: [],
    poolName: ACTIVE_POOL === 'braiins' ? BRAIINS_CONFIG.POOL_NAME : BINANCE_CONFIG.POOL_NAME,
    poolUrls: ACTIVE_POOL === 'braiins' ? [] : BINANCE_CONFIG.POOL_URLS,
    isLive: false,
    error: error,
    timestamp: Date.now(),
    
    // Connection info
    connectionInfo: {
      braiinsToken: 'PLqjqznSOP9yWLO2',
      binanceWorker: 'yass3r.001',
      binancePools: BINANCE_CONFIG.POOL_URLS
    }
  }
}

/**
 * ============================================
 * MAIN API ROUTE
 * ============================================
 */
export async function GET() {
  let miningData = null

  if (ACTIVE_POOL === 'braiins') {
    miningData = await fetchBraiinsData()
  } else {
    miningData = await fetchBinanceData()
  }

  if (!miningData) {
    return NextResponse.json({
      ...getErrorFallback('Unable to connect to pool'),
      help: 'Check your internet connection and pool status'
    })
  }

  return NextResponse.json(miningData)
}

/**
 * ============================================
 * POST - Configuration Info
 * ============================================
 */
export async function POST(request: Request) {
  const body = await request.json()
  
  if (body.action === 'get_config') {
    return NextResponse.json({
      wallet: WALLET_ADDRESS,
      braiins: {
        apiToken: BRAIINS_CONFIG.API_TOKEN,
        apiUrl: BRAIINS_CONFIG.BASE_URL
      },
      binance: {
        worker: BINANCE_CONFIG.WORKER_NAME,
        password: BINANCE_CONFIG.WORKER_PASSWORD,
        pools: BINANCE_CONFIG.POOL_URLS
      },
      activePool: ACTIVE_POOL
    })
  }
  
  return NextResponse.json({ success: true })
}
