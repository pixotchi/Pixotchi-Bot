// Reuse types from main app
export type ActivityEvent = 
  | AttackEvent 
  | KilledEvent 
  | MintEvent 
  | PlayedEvent 
  | ItemConsumedEvent 
  | ShopItemPurchasedEvent 
  | LandTransferEvent 
  | LandMintedEvent 
  | LandNameChangedEvent 
  | VillageUpgradedWithLeafEvent 
  | VillageSpeedUpWithSeedEvent 
  | TownUpgradedWithLeafEvent 
  | TownSpeedUpWithSeedEvent 
  | QuestStartedEvent 
  | QuestFinalizedEvent 
  | VillageProductionClaimedEvent;

export type AttackEvent = {
  __typename: "Attack";
  id: string;
  timestamp: string;
  attacker: string;
  winner: string;
  loser: string;
  scoresWon: string;
  attackerName: string;
  winnerName: string;
  loserName: string;
};

export type KilledEvent = {
  __typename: "Killed";
  id: string;
  timestamp: string;
  nftId: string;
  deadId: string;
  killer: string;
  winnerName: string;
  loserName: string;
  reward: string;
};

export type MintEvent = {
  __typename: "Mint";
  id: string;
  timestamp: string;
  nftId: string;
};

export type PlayedEvent = {
  __typename: "Played";
  id: string;
  timestamp: string;
  nftId: string;
  nftName: string;
  points: string;
  timeExtension: string;
  gameName: string;
};

export type ItemConsumedEvent = {
  __typename: "ItemConsumed";
  id: string;
  timestamp: string;
  nftId: string;
  nftName: string;
  giver: string;
  itemId: string;
};

export type ShopItemPurchasedEvent = {
  __typename: "ShopItemPurchased";
  id: string;
  timestamp: string;
  nftId: string;
  nftName: string;
  giver: string;
  itemId: string;
};

export type LandTransferEvent = {
  __typename: "LandTransferEvent";
  id: string;
  timestamp: string;
  from: string;
  to: string;
  tokenId: string;
  blockHeight: string;
};

export type LandMintedEvent = {
  __typename: "LandMintedEvent";
  id: string;
  timestamp: string;
  to: string;
  tokenId: string;
  mintPrice: string;
  blockHeight: string;
};

export type LandNameChangedEvent = {
  __typename: "LandNameChangedEvent";
  id: string;
  timestamp: string;
  tokenId: string;
  name: string;
  blockHeight: string;
};

export type VillageUpgradedWithLeafEvent = {
  __typename: "VillageUpgradedWithLeafEvent";
  id: string;
  timestamp: string;
  landId: string;
  buildingId: number;
  upgradeCost: string;
  xp: string;
  blockHeight: string;
};

export type VillageSpeedUpWithSeedEvent = {
  __typename: "VillageSpeedUpWithSeedEvent";
  id: string;
  timestamp: string;
  landId: string;
  buildingId: number;
  speedUpCost: string;
  xp: string;
  blockHeight: string;
};

export type TownUpgradedWithLeafEvent = {
  __typename: "TownUpgradedWithLeafEvent";
  id: string;
  timestamp: string;
  landId: string;
  buildingId: number;
  upgradeCost: string;
  xp: string;
  blockHeight: string;
};

export type TownSpeedUpWithSeedEvent = {
  __typename: "TownSpeedUpWithSeedEvent";
  id: string;
  timestamp: string;
  landId: string;
  buildingId: number;
  speedUpCost: string;
  xp: string;
  blockHeight: string;
};

export type QuestStartedEvent = {
  __typename: "QuestStartedEvent";
  id: string;
  timestamp: string;
  landId: string;
  farmerSlotId: string;
  difficulty: number;
  startBlock: string;
  endBlock: string;
  blockHeight: string;
};

export type QuestFinalizedEvent = {
  __typename: "QuestFinalizedEvent";
  id: string;
  timestamp: string;
  landId: string;
  farmerSlotId: string;
  player: string;
  rewardType: number;
  amount: string;
  blockHeight: string;
};

export type VillageProductionClaimedEvent = {
  __typename: "VillageProductionClaimedEvent";
  id: string;
  timestamp: string;
  landId: string;
  buildingId: number;
  blockHeight: string;
};

// Enhanced type for bundled item consumption
export type BundledItemConsumedEvent = ItemConsumedEvent & {
  quantity: number;
};

export type ProcessedActivityEvent = Exclude<ActivityEvent, ItemConsumedEvent> | BundledItemConsumedEvent;

// Bot-specific types
export interface BotConfig {
  token: string;
  adminUserIds: number[];
  targetChatId: number;
  defaultIntervalMinutes: number;
  defaultSeedBurnIntervalMinutes: number;
  ponderApiUrl: string;
  seedContractAddress: string;
  seedTotalSupply: number;
  baseRpcUrl: string;
  baseRpcBackups: string[];
}

export interface ChatState {
  messageId?: number;
  currentPage: number;
  totalPages: number;
  lastUpdate: Date;
  activities: ProcessedActivityEvent[];
  intervalMinutes: number;
}

export interface PaginatedMessage {
  header: string;
  subtitle: string;
  pageInfo: string;
  events: string[];
  navigation: string;
}

// Shop and Garden Items
export type ShopItem = {
  id: string;
  name: string;
  price: any;
  effectTime: any;
  description?: string;
  category?: string;
  imageUrl?: string;
};

export type GardenItem = {
  id: string;
  name: string;
  price: any;
  points: number;
  timeExtension: number;
  description?: string;
  category?: string;
};

// SEED Burn tracking types
export interface SeedBurnData {
  currentSupply: number;
  totalBurned: number;
  burnedInPeriod: number;
  periodMinutes: number;
  timestamp: Date;
}

export interface SeedBurnState {
  lastSupply?: number;
  lastCheck?: Date;
  messageId?: number;
}
