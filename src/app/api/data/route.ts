import { NextResponse } from 'next/server'

/**
 * ============================================
 * 🔧 REAL MINING POOL API CONFIGURATION
 * ============================================
 * 
 * Choose your mining pool and fill in the required credentials below.
 * Uncomment the pool you want to use and comment out the others.
 */

// ============================================
// OPTION 1: BRAIINS POOL (Slush Pool)
// ============================================
const BRAIINS_CONFIG = {
  // 👇 PASTE YOUR BRAIINS API TOKEN HERE
  API_TOKEN: 'YOUR_BRAIINS_API_TOKEN_HERE',
  
  // 👇 PASTE YOUR WALLET ADDRESS HERE (Bitcoin address for payouts)
  WALLET_ADDRESS: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN',
  
  // API Base URL
  BASE_URL: 'https://pool.braiins.com/accounts/profile/json/btc',
  
  // Pool name for display
  POOL_NAME: 'Braiins Pool'
}

// ============================================
// OPTION 2: BINANCE POOL
// ============================================
const BINANCE_CONFIG = {
  // 👇 PASTE YOUR BINANCE API KEY HERE
  API_KEY: 'YOUR_BINANCE_API_KEY_HERE',
  
  // 👇 PASTE YOUR BINANCE SECRET KEY HERE
  SECRET_KEY: 'YOUR_BINANCE_SECRET_KEY_HERE',
  
  // 👇 PASTE YOUR MINING ACCOUNT NAME HERE
  ACCOUNT_NAME: 'YOUR_MINING_ACCOUNT_NAME',
  
  // 👇 PASTE YOUR WALLET ADDRESS HERE
  WALLET_ADDRESS: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN',
  
  // API Base URL
  BASE_URL: 'https://pool.binance.com',
  
  // Pool name for display
  POOL_NAME: 'Binance Pool'
}

// ============================================
// OPTION 3: NICEHASH
// ============================================
const NICEHASH_CONFIG = {
  // 👇 PASTE YOUR NICEHASH API KEY HERE
  API_KEY: 'YOUR_NICEHASH_API_KEY_HERE',
  
  // 👇 PASTE YOUR NICEHASH ORGANIZATION ID HERE
  ORG_ID: 'YOUR_ORGANIZATION_ID_HERE',
  
  // 👇 PASTE YOUR NICEHASH API SECRET HERE
  API_SECRET: 'YOUR_NICEHASH_API_SECRET_HERE',
  
  // 👇 PASTE YOUR BTC WALLET ADDRESS HERE
  WALLET_ADDRESS: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN',
  
  // API Base URL
  BASE_URL: 'https://api2.nicehash.com',
  
  // Pool name for display
  POOL_NAME: 'NiceHash'
}

// ============================================
// OPTION 4: F2POOL
// ============================================
const F2POOL_CONFIG = {
  // 👇 PASTE YOUR F2POOL USERNAME HERE
  USERNAME: 'YOUR_F2POOL_USERNAME',
  
  // 👇 PASTE YOUR WALLET ADDRESS HERE
  WALLET_ADDRESS: '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN',
  
  // API URL (uses wallet address for authentication)
  BASE_URL: 'https://api.f2pool.com',
  
  // Pool name for display
  POOL_NAME: 'F2Pool'
}

// ============================================
// 🎯 ACTIVE POOL SELECTION
// Change this to select which pool to use
// Options: 'braiins' | 'binance' | 'nicehash' | 'f2pool'
// ============================================
const ACTIVE_POOL = 'braiins'

// ============================================
// WALLET ADDRESS (Used across all pools)
// 👇 PASTE YOUR BITCOIN WALLET ADDRESS HERE
// ============================================
const WALLET_ADDRESS = '1LDkwJs9whVa2iTh8LRsThDrCympoM9QXN'


/**
 * ============================================
 * API FETCHER FUNCTIONS
 * ============================================
 */

// Braiins Pool API
async function fetchBraiinsData() {
  try {
    const response = await fetch(BRAIINS_CONFIG.BASE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BRAIINS_CONFIG.API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Cache for 60 seconds
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      throw new Error(`Braiins API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format Braiins response to our structure
    const workers = data.workers || []
    const workersList = workers.map((w: any, index: number) => ({
      id: index + 1,
      name: w.worker || `worker_${index + 1}`,
      shares: w.valid_shares || 0,
      rate: w.hashrate || 0,
      status: w.alive ? 'active' : 'offline'
    }))

    const activeWorkers = workersList.filter((w: any) => w.status === 'active').length
    const totalHashrate = workersList.reduce((sum: number, w: any) => sum + w.rate, 0)

    return {
      workers: activeWorkers,
      shares: data.valid_shares || 0,
      blocks: data.confirmed_blocks || 0,
      rate: totalHashrate,
      uptime: data.uptime_seconds || 0,
      address: WALLET_ADDRESS,
      workersList: workersList,
      recentActivity: data.recent_shares?.slice(0, 10).map((s: any) => ({
        worker: s.worker,
        time: s.timestamp,
        shares: s.shares
      })) || [],
      poolName: BRAIINS_CONFIG.POOL_NAME,
      isLive: true
    }
  } catch (error: any) {
    console.error('Braiins API Error:', error.message)
    return null
  }
}

// Binance Pool API
async function fetchBinanceData() {
  try {
    // Binance Pool requires HMAC signature
    // This is a simplified version - full implementation needs crypto signing
    const endpoint = '/sapi/v1/mining/statistics/user/status'
    const timestamp = Date.now()
    
    const response = await fetch(
      `${BINANCE_CONFIG.BASE_URL}${endpoint}?userName=${BINANCE_CONFIG.ACCOUNT_NAME}&timestamp=${timestamp}`,
      {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': BINANCE_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }
      }
    )

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format Binance response
    const workersList = data.data?.workerList?.map((w: any, index: number) => ({
      id: index + 1,
      name: w.workerName || `worker_${index + 1}`,
      shares: w.validShare || 0,
      rate: w.hashRate || 0,
      status: w.status === '0' ? 'active' : 'offline'
    })) || []

    const activeWorkers = workersList.filter((w: any) => w.status === 'active').length

    return {
      workers: activeWorkers,
      shares: data.data?.validShare || 0,
      blocks: data.data?.blocks || 0,
      rate: data.data?.hashRate || 0,
      uptime: data.data?.uptime || 0,
      address: WALLET_ADDRESS,
      workersList: workersList,
      recentActivity: [],
      poolName: BINANCE_CONFIG.POOL_NAME,
      isLive: true
    }
  } catch (error: any) {
    console.error('Binance API Error:', error.message)
    return null
  }
}

// NiceHash API
async function fetchNiceHashData() {
  try {
    const endpoint = '/main/api/v2/mining/rigs/stats'
    
    const response = await fetch(
      `${NICEHASH_CONFIG.BASE_URL}${endpoint}`,
      {
        method: 'GET',
        headers: {
          'X-Organization-Id': NICEHASH_CONFIG.ORG_ID,
          'X-Api-Key': NICEHASH_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }
      }
    )

    if (!response.ok) {
      throw new Error(`NiceHash API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format NiceHash response
    const rigs = data.rigs || []
    const workersList = rigs.map((r: any, index: number) => ({
      id: index + 1,
      name: r.rigId || `rig_${index + 1}`,
      shares: r.stats?.validShares || 0,
      rate: r.stats?.hashrate || 0,
      status: r.status === 'MINING' ? 'active' : 'offline'
    }))

    const activeWorkers = workersList.filter((w: any) => w.status === 'active').length
    const totalHashrate = workersList.reduce((sum: number, w: any) => sum + w.rate, 0)

    return {
      workers: activeWorkers,
      shares: data.totalValidShares || 0,
      blocks: 0, // NiceHash doesn't mine blocks directly
      rate: totalHashrate,
      uptime: data.totalUptime || 0,
      address: WALLET_ADDRESS,
      workersList: workersList,
      recentActivity: [],
      poolName: NICEHASH_CONFIG.POOL_NAME,
      isLive: true
    }
  } catch (error: any) {
    console.error('NiceHash API Error:', error.message)
    return null
  }
}

// F2Pool API
async function fetchF2PoolData() {
  try {
    // F2Pool uses wallet address for authentication
    const response = await fetch(
      `${F2POOL_CONFIG.BASE_URL}/${WALLET_ADDRESS}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }
      }
    )

    if (!response.ok) {
      throw new Error(`F2Pool API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Format F2Pool response
    const workers = data.workers || {}
    const workersList = Object.entries(workers).map(([name, w]: [string, any], index: number) => ({
      id: index + 1,
      name: name,
      shares: w.shares || 0,
      rate: w.hashrate || 0,
      status: w.alive ? 'active' : 'offline'
    }))

    const activeWorkers = workersList.filter((w: any) => w.status === 'active').length

    return {
      workers: activeWorkers,
      shares: data.shares || 0,
      blocks: data.blocks || 0,
      rate: data.hashrate || 0,
      uptime: data.uptime || 0,
      address: WALLET_ADDRESS,
      workersList: workersList,
      recentActivity: [],
      poolName: F2POOL_CONFIG.POOL_NAME,
      isLive: true
    }
  } catch (error: any) {
    console.error('F2Pool API Error:', error.message)
    return null
  }
}

// ============================================
// GENERIC POOL API FETCHER
// For any pool that provides a simple JSON endpoint
// ============================================
async function fetchGenericPoolData() {
  /**
   * 👇 CONFIGURE YOUR CUSTOM POOL HERE
   * 
   * Example for a generic pool API that returns JSON:
   * - URL: The full API endpoint URL
   * - Headers: Any required authentication headers
   */
  const CUSTOM_POOL_CONFIG = {
    // 👇 PASTE YOUR POOL API URL HERE
    API_URL: 'https://your-pool-api.com/api/stats/YOUR_WALLET',
    
    // 👇 PASTE YOUR API KEY HERE (if required)
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // 👇 PASTE YOUR WALLET ADDRESS HERE
    WALLET_ADDRESS: WALLET_ADDRESS,
  }

  try {
    const response = await fetch(CUSTOM_POOL_CONFIG.API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CUSTOM_POOL_CONFIG.API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }
    })

    if (!response.ok) {
      throw new Error(`Pool API error: ${response.status}`)
    }

    const data = await response.json()
    
    /**
     * 👇 CUSTOMIZE THIS MAPPING
     * Map your pool's API response to our standard format
     */
    return {
      workers: data.workers || data.active_workers || 0,
      shares: data.shares || data.valid_shares || 0,
      blocks: data.blocks_found || data.confirmed_blocks || 0,
      rate: data.hashrate || data.current_hashrate || 0,
      uptime: data.uptime || data.online_time || 0,
      address: CUSTOM_POOL_CONFIG.WALLET_ADDRESS,
      workersList: (data.workers_list || data.workers || []).map((w: any, i: number) => ({
        id: i + 1,
        name: w.name || w.worker || `worker_${i + 1}`,
        shares: w.shares || w.valid_shares || 0,
        rate: w.hashrate || w.rate || 0,
        status: w.status === 'active' || w.alive ? 'active' : 'offline'
      })),
      recentActivity: (data.recent_activity || data.last_shares || []).slice(0, 10),
      poolName: 'Custom Pool',
      isLive: true
    }
  } catch (error: any) {
    console.error('Custom Pool API Error:', error.message)
    return null
  }
}

/**
 * ============================================
 * ERROR FALLBACK DATA
 * Returns when API fails
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
 * MAIN API ROUTE HANDLER
 * ============================================
 */
export async function GET() {
  let miningData = null

  // Fetch data from the active pool
  switch (ACTIVE_POOL) {
    case 'braiins':
      miningData = await fetchBraiinsData()
      break
    case 'binance':
      miningData = await fetchBinanceData()
      break
    case 'nicehash':
      miningData = await fetchNiceHashData()
      break
    case 'f2pool':
      miningData = await fetchF2PoolData()
      break
    default:
      miningData = await fetchGenericPoolData()
  }

  // If API call failed, return error state
  if (!miningData) {
    return NextResponse.json({
      ...getErrorFallback('Failed to connect to mining pool API. Check your credentials.'),
      help: 'Make sure you have configured your pool API credentials in route.ts'
    })
  }

  // Add timestamp for freshness check
  miningData.timestamp = Date.now()

  return NextResponse.json(miningData)
}

/**
 * ============================================
 * POST HANDLER - Add Worker (Optional)
 * ============================================
 */
export async function POST(request: Request) {
  const body = await request.json()
  
  // This endpoint could be used to:
  // 1. Register a new worker with the pool
  // 2. Update worker settings
  // 3. Switch between pools
  
  return NextResponse.json({
    success: false,
    message: 'Worker management not implemented. Configure workers directly in your pool dashboard.',
    poolDashboard: getPoolDashboardUrl()
  })
}

/**
 * Get the pool dashboard URL for manual management
 */
function getPoolDashboardUrl(): string {
  switch (ACTIVE_POOL) {
    case 'braiins':
      return 'https://pool.braiins.com'
    case 'binance':
      return 'https://pool.binance.com'
    case 'nicehash':
      return 'https://nicehash.com'
    case 'f2pool':
      return 'https://f2pool.com'
    default:
      return 'https://your-pool-dashboard.com'
  }
}
