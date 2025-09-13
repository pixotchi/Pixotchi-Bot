import { createPublicClient, http, formatUnits, fallback } from 'viem';
import { base } from 'viem/chains';
import { botConfig } from '../config';
import { SeedBurnData } from '../types';

// ERC20 ABI for totalSupply function
const ERC20_ABI = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Create RPC transports with fallback
function createRpcTransport() {
  const rpcUrls = [botConfig.baseRpcUrl, ...botConfig.baseRpcBackups];
  
  if (rpcUrls.length === 1) {
    return http(rpcUrls[0]);
  }
  
  // Use fallback transport for multiple RPCs
  return fallback(
    rpcUrls.map(url => http(url)),
    { rank: false } // Don't rank by latency, use in order
  );
}

// Create viem client for Base network with fallback RPCs
const publicClient = createPublicClient({
  chain: base,
  transport: createRpcTransport(),
});

export class SeedBurnTracker {
  private intervalData: Map<number, { lastSupply: number; lastCheck: Date }> = new Map();
  private pendingRequests: Map<number, Promise<SeedBurnData>> = new Map();
  private baselineInitialized: boolean = false;

  async getCurrentSupply(): Promise<number> {
    try {
      const totalSupply = await publicClient.readContract({
        address: botConfig.seedContractAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      });

      // Convert from wei to SEED tokens (18 decimals)
      const supplyInTokens = parseFloat(formatUnits(totalSupply, 18));
      return supplyInTokens;
    } catch (error) {
      console.error('Failed to fetch SEED total supply:', error);
      throw new Error('Unable to fetch SEED supply from contract');
    }
  }

  async getSeedBurnData(intervalMinutes: number): Promise<SeedBurnData> {
    // Check if there's already a pending request for this interval to avoid race conditions
    if (this.pendingRequests.has(intervalMinutes)) {
      return this.pendingRequests.get(intervalMinutes)!;
    }

    // Create and store the promise to prevent concurrent requests for same interval
    const promise = this.fetchSeedBurnData(intervalMinutes);
    this.pendingRequests.set(intervalMinutes, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(intervalMinutes);
    }
  }

  private async fetchSeedBurnData(intervalMinutes: number): Promise<SeedBurnData> {
    const currentSupply = await this.getCurrentSupply();
    const totalBurned = botConfig.seedTotalSupply - currentSupply;
    
    let burnedInPeriod = 0;
    const now = new Date();
    
    // Get interval-specific tracking data
    const intervalKey = intervalMinutes;
    const previousData = this.intervalData.get(intervalKey);
    
    // Calculate burned in period if we have previous data for this specific interval
    if (previousData) {
      const timeDiff = now.getTime() - previousData.lastCheck.getTime();
      const expectedInterval = intervalMinutes * 60 * 1000; // Convert to milliseconds
      
      // Only calculate period burn if the time difference is reasonable (within 2x the interval)
      // This handles cases where the bot was restarted or there were delays
      if (timeDiff <= expectedInterval * 2) {
        burnedInPeriod = previousData.lastSupply - currentSupply;
      }
    }

    // Update tracking data for this specific interval
    this.intervalData.set(intervalKey, {
      lastSupply: currentSupply,
      lastCheck: now
    });

    return {
      currentSupply,
      totalBurned,
      burnedInPeriod: Math.max(0, burnedInPeriod), // Ensure non-negative
      periodMinutes: intervalMinutes,
      timestamp: now,
    };
  }

  reset(intervalMinutes?: number): void {
    if (intervalMinutes) {
      // Reset specific interval data
      this.intervalData.delete(intervalMinutes);
      this.pendingRequests.delete(intervalMinutes);
    } else {
      // Reset all data
      this.intervalData.clear();
      this.pendingRequests.clear();
    }
  }

  async initializeBaseline(intervalMinutes: number): Promise<void> {
    try {
      console.log('Initializing SEED burn baseline...');
      const currentSupply = await this.getCurrentSupply();
      const now = new Date();
      
      // Set baseline for the specified interval
      this.intervalData.set(intervalMinutes, {
        lastSupply: currentSupply,
        lastCheck: now
      });
      
      this.baselineInitialized = true;
      console.log(`SEED burn baseline initialized: ${currentSupply.toFixed(2)} SEED supply at ${now.toISOString()}`);
    } catch (error) {
      console.error('Failed to initialize SEED burn baseline:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentSupply();
      return true;
    } catch (error) {
      console.error('SEED contract connection test failed:', error);
      return false;
    }
  }
}

export const seedBurnTracker = new SeedBurnTracker();
