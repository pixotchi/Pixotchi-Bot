import { formatDistanceToNow } from 'date-fns';

// Reuse formatting functions from main app
export function formatScore(score: number): string {
  const points = score / 1e12;
  return points.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimeAgo(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}

export function getBuildingName(buildingId: number, isTown: boolean = false): string {
  const TOWN_BUILDINGS: { [key: number]: string } = {
    1: "Stake House",
    3: "Ware House", 
    5: "Marketplace",
    7: "Farmer House"
  };

  const VILLAGE_BUILDINGS: { [key: number]: string } = {
    0: "Solar Panels",
    3: "Soil Factory",
    5: "Bee Farm"
  };

  if (isTown) {
    return TOWN_BUILDINGS[buildingId] || `Building ${buildingId}`;
  } else {
    return VILLAGE_BUILDINGS[buildingId] || `Building ${buildingId}`;
  }
}

export function getQuestDifficulty(difficulty: number): string {
  const difficulties: { [key: number]: string } = {
    0: "Easy",
    1: "Medium", 
    2: "Hard"
  };
  return difficulties[difficulty] || `Level ${difficulty}`;
}

export function formatQuestReward(rewardType: number, amount: string): string {
  const rewards: { [key: number]: string } = {
    0: "SEED",
    1: "LEAF", 
    2: "time extension",
    3: "PTS",
    4: "experience"
  };
  
  const rewardName = rewards[rewardType] || "rewards";
  
  // Convert wei to readable format for LEAF (type 1) and SEED (type 0)
  if (rewardType === 0 || rewardType === 1) {
    const value = parseFloat(amount) / 1e18;
    return `${value.toFixed(2)} ${rewardName}`;
  }
  
  // For plant points (PTS), use same normalization as Plants tab
  if (rewardType === 3) {
    const ptsValue = parseFloat(amount);
    const formattedPts = formatScore(ptsValue);
    return `${formattedPts} ${rewardName}`;
  }
  
  // For experience, convert from wei
  if (rewardType === 4) {
    const value = parseFloat(amount) / 1e18;
    return `${value.toFixed(0)} ${rewardName}`;
  }
  
  // For time extension (type 2), convert seconds to hours and show as TOD
  if (rewardType === 2) {
    const seconds = parseFloat(amount);
    const hours = seconds / 3600;
    return `${hours.toFixed(1)}H TOD`;
  }
  
  // For other types, show raw amount
  return `${amount} ${rewardName}`;
}
