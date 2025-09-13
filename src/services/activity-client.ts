import { ActivityEvent, ProcessedActivityEvent, BundledItemConsumedEvent, ItemConsumedEvent, ShopItem, GardenItem } from '../types';
import { botConfig } from '../config';

// Filter activities to custom time window
function filterByTimeWindow(activities: ActivityEvent[], minutes: number): ActivityEvent[] {
  const now = Math.floor(Date.now() / 1000);
  const timeWindowAgo = now - (minutes * 60);
  
  return activities.filter(activity => {
    const activityTimestamp = parseInt(activity.timestamp);
    return activityTimestamp >= timeWindowAgo;
  });
}

// Bundle item consumed events (same logic as main app)
function bundleItemConsumedEvents(activities: ActivityEvent[]): ProcessedActivityEvent[] {
  const bundledMap = new Map<string, BundledItemConsumedEvent>();
  const otherEvents: Exclude<ActivityEvent, ItemConsumedEvent>[] = [];

  activities.forEach(activity => {
    if (activity.__typename === 'ItemConsumed') {
      const key = `${activity.nftId}-${activity.timestamp}-${activity.itemId}`;
      
      if (bundledMap.has(key)) {
        const existing = bundledMap.get(key)!;
        existing.quantity += 1;
      } else {
        bundledMap.set(key, {
          ...activity,
          quantity: 1
        });
      }
    } else {
      otherEvents.push(activity as Exclude<ActivityEvent, ItemConsumedEvent>);
    }
  });

  const bundledEvents = Array.from(bundledMap.values());
  const allProcessedEvents = [...otherEvents, ...bundledEvents];
  
  // Re-sort by timestamp
  allProcessedEvents.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
  
  return allProcessedEvents;
}

// GraphQL query from main app
const GET_ALL_ACTIVITY_QUERY = `
  query GetAllActivity {
    attacks(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        attacker
        winner
        loser
        attackerName
        winnerName
        loserName
        scoresWon
      }
    }
    killeds(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        nftId
        deadId
        killer
        winnerName
        loserName
        reward
      }
    }
    mints(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        nftId
      }
    }
    playeds(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        nftName
        gameName
        points
      }
    }
    itemConsumeds(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        nftName
        giver
        itemId
      }
    }
    shopItemPurchaseds(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        nftName
        giver
        itemId
      }
    }
    landTransferEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        from
        to
        tokenId
        blockHeight
      }
    }
    landMintedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        to
        tokenId
        mintPrice
        blockHeight
      }
    }
    landNameChangedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        tokenId
        name
        blockHeight
      }
    }
    villageUpgradedWithLeafEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        buildingId
        upgradeCost
        xp
        blockHeight
      }
    }
    villageSpeedUpWithSeedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        buildingId
        speedUpCost
        xp
        blockHeight
      }
    }
    townUpgradedWithLeafEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        buildingId
        upgradeCost
        xp
        blockHeight
      }
    }
    townSpeedUpWithSeedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        buildingId
        speedUpCost
        xp
        blockHeight
      }
    }
    questStartedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        farmerSlotId
        difficulty
        startBlock
        endBlock
        blockHeight
      }
    }
    questFinalizedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        farmerSlotId
        player
        rewardType
        amount
        blockHeight
      }
    }
    villageProductionClaimedEvents(orderBy: "timestamp", orderDirection: "desc", limit: 100) {
      items {
        __typename
        id
        timestamp
        landId
        buildingId
        blockHeight
      }
    }
  }
`;

const SHOP_ITEMS_QUERY = `
  query GetShopItems {
    shopItems {
      id
      name
      price
      effectTime
      description
      category
    }
  }
`;

const GARDEN_ITEMS_QUERY = `
  query GetGardenItems {
    gardenItems {
      id
      name
      price
      points
      timeExtension
      description
      category
    }
  }
`;

export async function getAllActivity(intervalMinutes: number): Promise<ProcessedActivityEvent[]> {
  try {
    const response = await fetch(botConfig.ponderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: GET_ALL_ACTIVITY_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const json = await response.json() as any;

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      throw new Error('Error fetching activity data');
    }

    const { data } = json;
    
    const allActivities: ActivityEvent[] = [
      ...(data.attacks?.items || []),
      ...(data.killeds?.items || []),
      ...(data.mints?.items || []),
      ...(data.playeds?.items || []),
      ...(data.itemConsumeds?.items || []),
      ...(data.shopItemPurchaseds?.items || []),
      ...(data.landTransferEvents?.items || []),
      ...(data.landMintedEvents?.items || []),
      ...(data.landNameChangedEvents?.items || []),
      ...(data.villageUpgradedWithLeafEvents?.items || []),
      ...(data.villageSpeedUpWithSeedEvents?.items || []),
      ...(data.townUpgradedWithLeafEvents?.items || []),
      ...(data.townSpeedUpWithSeedEvents?.items || []),
      ...(data.questStartedEvents?.items || []),
      ...(data.questFinalizedEvents?.items || []),
      ...(data.villageProductionClaimedEvents?.items || []),
    ];

    // Sort by timestamp (newest first)
    allActivities.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    
    // Filter to custom time window
    const filteredActivities = filterByTimeWindow(allActivities, intervalMinutes);
    
    // Bundle item consumed events
    return bundleItemConsumedEvents(filteredActivities);

  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
}

export async function getShopItems(): Promise<{ [key: string]: string }> {
  try {
    const response = await fetch(botConfig.ponderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SHOP_ITEMS_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const json = await response.json() as any;
    const shopItems = json.data?.shopItems || [];
    
    const itemMap: { [key: string]: string } = {};
    shopItems.forEach((item: ShopItem) => {
      itemMap[item.id] = item.name;
    });
    
    return itemMap;
  } catch (error) {
    console.error('Failed to fetch shop items:', error);
    return {};
  }
}

// Fallback garden item mapping when API fails
const FALLBACK_GARDEN_ITEMS: { [key: string]: string } = {
  "0": "Sunlight",
  "1": "Water", 
  "2": "Fertilizer",
  "3": "Pollinator",
  "4": "Magic Soil",
  "5": "Dream Dew"
};

export async function getGardenItems(): Promise<{ [key: string]: string }> {
  try {
    const response = await fetch(botConfig.ponderApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: GARDEN_ITEMS_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const json = await response.json() as any;
    const gardenItems = json.data?.gardenItems || [];
    
    const itemMap: { [key: string]: string } = {};
    gardenItems.forEach((item: GardenItem) => {
      itemMap[item.id] = item.name;
    });
    
    // If API returned no items, use fallback mapping
    if (Object.keys(itemMap).length === 0) {
      console.log('API returned no garden items, using fallback mapping');
      return FALLBACK_GARDEN_ITEMS;
    }
    
    return itemMap;
  } catch (error) {
    console.error('Failed to fetch garden items from API, using fallback mapping:', error);
    return FALLBACK_GARDEN_ITEMS;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const activities = await getAllActivity(60); // Test with 60 minutes
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
