import { config } from 'dotenv';
import { BotConfig } from './types';

config();

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function parseAdminUserIds(adminIds: string): number[] {
  return adminIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
}

function parseRpcBackups(): string[] {
  const backups = [
    process.env.BASE_RPC_BACKUP_1,
    process.env.BASE_RPC_BACKUP_2,
    process.env.BASE_RPC_BACKUP_3,
  ].filter((url): url is string => Boolean(url));
  
  return backups;
}

export const botConfig: BotConfig = {
  token: getRequiredEnv('TELEGRAM_BOT_TOKEN'),
  adminUserIds: parseAdminUserIds(getRequiredEnv('ADMIN_USER_IDS')),
  targetChatId: parseInt(getRequiredEnv('TARGET_CHAT_ID'), 10),
  defaultIntervalMinutes: parseInt(getOptionalEnv('DEFAULT_INTERVAL_MINUTES', '180'), 10),
  defaultSeedBurnIntervalMinutes: parseInt(getOptionalEnv('DEFAULT_SEED_BURN_INTERVAL_MINUTES', '60'), 10),
  ponderApiUrl: getOptionalEnv('PONDER_API_URL', 'https://api.mini.pixotchi.tech/graphql'),
  seedContractAddress: getRequiredEnv('SEED_CONTRACT_ADDRESS'),
  seedTotalSupply: parseInt(getRequiredEnv('SEED_TOTAL_SUPPLY'), 10),
  baseRpcUrl: getOptionalEnv('BASE_RPC_URL', 'https://mainnet.base.org'),
  baseRpcBackups: parseRpcBackups(),
};

// Validate config
if (isNaN(botConfig.targetChatId)) {
  throw new Error('TARGET_CHAT_ID must be a valid number');
}

if (botConfig.adminUserIds.length === 0) {
  throw new Error('ADMIN_USER_IDS must contain at least one valid user ID');
}

if (botConfig.defaultIntervalMinutes < 5 || botConfig.defaultIntervalMinutes > 1440) {
  throw new Error('DEFAULT_INTERVAL_MINUTES must be between 5 and 1440 minutes (24 hours)');
}

if (botConfig.defaultSeedBurnIntervalMinutes < 5 || botConfig.defaultSeedBurnIntervalMinutes > 1440) {
  throw new Error('DEFAULT_SEED_BURN_INTERVAL_MINUTES must be between 5 and 1440 minutes (24 hours)');
}

if (!botConfig.seedContractAddress || botConfig.seedContractAddress === '0xYourSeedContractAddressHere') {
  throw new Error('SEED_CONTRACT_ADDRESS must be set to a valid contract address');
}

if (isNaN(botConfig.seedTotalSupply) || botConfig.seedTotalSupply <= 0) {
  throw new Error('SEED_TOTAL_SUPPLY must be a positive number');
}

console.log('Bot configuration loaded successfully');
console.log(`- Target chat ID: ${botConfig.targetChatId}`);
console.log(`- Admin users: ${botConfig.adminUserIds.length}`);
console.log(`- Default interval: ${botConfig.defaultIntervalMinutes} minutes`);
console.log(`- SEED burn interval: ${botConfig.defaultSeedBurnIntervalMinutes} minutes`);
console.log(`- API URL: ${botConfig.ponderApiUrl}`);
console.log(`- SEED contract: ${botConfig.seedContractAddress}`);
console.log(`- Base RPC: ${botConfig.baseRpcUrl}`);
console.log(`- RPC backups: ${botConfig.baseRpcBackups.length}`);
