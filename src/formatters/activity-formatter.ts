import { 
  ProcessedActivityEvent, 
  BundledItemConsumedEvent,
  AttackEvent,
  KilledEvent,
  MintEvent,
  PlayedEvent,
  ShopItemPurchasedEvent,
  LandTransferEvent,
  LandMintedEvent,
  LandNameChangedEvent,
  VillageUpgradedWithLeafEvent,
  VillageSpeedUpWithSeedEvent,
  TownUpgradedWithLeafEvent,
  TownSpeedUpWithSeedEvent,
  QuestStartedEvent,
  QuestFinalizedEvent,
  VillageProductionClaimedEvent
} from '../types';
import { 
  formatScore, 
  formatAddress, 
  formatTimeAgo, 
  getBuildingName, 
  getQuestDifficulty, 
  formatQuestReward 
} from '../utils/formatters';

// Event emojis mapping
const EVENT_EMOJIS: { [key: string]: string } = {
  'Attack': '⚔️',
  'Killed': '💀', 
  'Mint': '🌱',
  'Played': '🎮',
  'ItemConsumed': '🪴',
  'ShopItemPurchased': '🛒',
  'LandTransferEvent': '🏠',
  'LandMintedEvent': '🆕',
  'LandNameChangedEvent': '✏️',
  'VillageUpgradedWithLeafEvent': '⚒️',
  'VillageSpeedUpWithSeedEvent': '⚡',
  'TownUpgradedWithLeafEvent': '⚒️',
  'TownSpeedUpWithSeedEvent': '⚡',
  'QuestStartedEvent': '⏳',
  'QuestFinalizedEvent': '✅',
  'VillageProductionClaimedEvent': '✅'
};

export function formatEventForTelegram(
  event: ProcessedActivityEvent, 
  shopItemMap: { [key: string]: string } = {},
  gardenItemMap: { [key: string]: string } = {}
): string {
  const emoji = EVENT_EMOJIS[event.__typename] || '❓';
  const timeAgo = formatTimeAgo(event.timestamp);
  
  let eventText = '';

  switch (event.__typename) {
    case 'Attack':
      const attackEvent = event as AttackEvent;
      const attackerIsWinner = attackEvent.attacker === attackEvent.winner;
      const opponent = attackerIsWinner
        ? { name: attackEvent.loserName }
        : { name: attackEvent.winnerName };
      
      eventText = `${attackEvent.attackerName} attacked ${opponent.name} and ${attackerIsWinner ? 'won' : 'lost'} ${formatScore(parseInt(attackEvent.scoresWon))} PTS!`;
      break;

    case 'Killed':
      const killedEvent = event as KilledEvent;
      

      
      // Use names if available, otherwise fall back to Plant #ID format
      // killer is the winner (who did the killing), deadId is the loser (who got killed)
      const winnerName = killedEvent.winnerName || `Plant #${killedEvent.killer}`;
      const loserName = killedEvent.loserName || `Plant #${killedEvent.deadId}`;
      
      eventText = `${winnerName} killed ${loserName} and claimed a star!`;
      break;

    case 'Mint':
      const mintEvent = event as MintEvent;
      eventText = `Plant #${mintEvent.nftId}, was born!`;
      break;

    case 'Played':
      const playedEvent = event as PlayedEvent;
      eventText = `${playedEvent.nftName} played ${playedEvent.gameName} and got ${formatScore(parseInt(playedEvent.points))} PTS!`;
      break;

    case 'ItemConsumed':
      const itemEvent = event as BundledItemConsumedEvent;
      
      // Try both string and number keys for lookup
      const itemName = gardenItemMap[itemEvent.itemId] || gardenItemMap[String(itemEvent.itemId)] || `Item #${itemEvent.itemId}`;
      const quantityText = itemEvent.quantity > 1 ? `${itemEvent.quantity}x ` : '';
      
      eventText = `${itemEvent.nftName} consumed ${quantityText}${itemName}!`;
      break;

    case 'ShopItemPurchased':
      const shopEvent = event as ShopItemPurchasedEvent;
      
      // Try both string and number keys for lookup
      const shopItemName = shopItemMap[shopEvent.itemId] || shopItemMap[String(shopEvent.itemId)] || `Item #${shopEvent.itemId}`;
      eventText = `${shopEvent.nftName} bought ${shopItemName} from the shop!`;
      break;

    case 'LandTransferEvent':
      const transferEvent = event as LandTransferEvent;
      eventText = `Land #${transferEvent.tokenId} was transferred!`;
      break;

    case 'LandMintedEvent':
      const landMintEvent = event as LandMintedEvent;
      eventText = `A new land, Land #${landMintEvent.tokenId}, was minted!`;
      break;

    case 'LandNameChangedEvent':
      const nameEvent = event as LandNameChangedEvent;
      eventText = `Land #${nameEvent.tokenId} was renamed to "${nameEvent.name}"!`;
      break;

    case 'VillageUpgradedWithLeafEvent':
      const villageUpgradeEvent = event as VillageUpgradedWithLeafEvent;
      const villageBuildingName = getBuildingName(villageUpgradeEvent.buildingId, false);
      eventText = `Land #${villageUpgradeEvent.landId} started upgrading ${villageBuildingName}!`;
      break;

    case 'VillageSpeedUpWithSeedEvent':
      const villageSpeedEvent = event as VillageSpeedUpWithSeedEvent;
      const villageSpeedBuildingName = getBuildingName(villageSpeedEvent.buildingId, false);
      eventText = `Land #${villageSpeedEvent.landId} sped up ${villageSpeedBuildingName} construction!`;
      break;

    case 'TownUpgradedWithLeafEvent':
      const townUpgradeEvent = event as TownUpgradedWithLeafEvent;
      const townBuildingName = getBuildingName(townUpgradeEvent.buildingId, true);
      eventText = `Land #${townUpgradeEvent.landId} started upgrading ${townBuildingName}!`;
      break;

    case 'TownSpeedUpWithSeedEvent':
      const townSpeedEvent = event as TownSpeedUpWithSeedEvent;
      const townSpeedBuildingName = getBuildingName(townSpeedEvent.buildingId, true);
      eventText = `Land #${townSpeedEvent.landId} sped up ${townSpeedBuildingName} construction!`;
      break;

    case 'QuestStartedEvent':
      const questStartEvent = event as QuestStartedEvent;
      const difficulty = getQuestDifficulty(questStartEvent.difficulty);
      eventText = `Land #${questStartEvent.landId} started a ${difficulty} quest!`;
      break;

    case 'QuestFinalizedEvent':
      const questEndEvent = event as QuestFinalizedEvent;
      const reward = formatQuestReward(questEndEvent.rewardType, questEndEvent.amount);
      eventText = `Land #${questEndEvent.landId} completed a quest and earned ${reward}!`;
      break;

    case 'VillageProductionClaimedEvent':
      const productionEvent = event as VillageProductionClaimedEvent;
      const productionBuildingName = getBuildingName(productionEvent.buildingId, false);
      eventText = `Land #${productionEvent.landId} claimed production from ${productionBuildingName}!`;
      break;

    default:
      eventText = `Unknown event occurred`;
  }

  return `${emoji} ${eventText} ${timeAgo}`;
}
