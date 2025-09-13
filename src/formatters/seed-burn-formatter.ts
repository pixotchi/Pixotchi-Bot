import { SeedBurnData } from '../types';

export function formatSeedBurnMessage(burnData: SeedBurnData): string {
  const timeText = burnData.periodMinutes >= 60 
    ? `${Math.floor(burnData.periodMinutes / 60)}h${burnData.periodMinutes % 60 !== 0 ? ` ${burnData.periodMinutes % 60}m` : ''}`
    : `${burnData.periodMinutes}m`;

  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Format large numbers with K/M suffix
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return formatNumber(num);
    }
  };

  // Calculate circulating supply (20M - total burned)
  const TOTAL_SUPPLY = 20000000;
  const circulatingSupply = TOTAL_SUPPLY - burnData.totalBurned;

  const parts = [
    `🔥 <b>SEED Burn Report (${timeText})</b> 🔥`,
    '',
    `Burned: ${formatLargeNumber(burnData.burnedInPeriod)} SEED`,
    `Total Burned: ${formatLargeNumber(burnData.totalBurned)} SEED`,
    `Circulating Supply: ${formatLargeNumber(circulatingSupply)} SEED`
  ];

  return parts.join('\n');
}

export function formatSeedBurnError(error: string): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return [
    '🔥 <b>SEED Burn Report</b>',
    `Error • ${timeStr}`,
    '',
    `❌ ${error}`,
    '',
    'Contract connection issue - will retry next interval'
  ].join('\n');
}

export function formatSeedBurnLoading(): string {
  return '🔄 Checking SEED burns...';
}
