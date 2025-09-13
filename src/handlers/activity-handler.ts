import { Bot, Context } from 'grammy';
import { MessageManager } from './message-manager';
import { getAllActivity, getShopItems, getGardenItems, testConnection } from '../services/activity-client';
import { ProcessedActivityEvent } from '../types';
import { botConfig } from '../config';

export class ActivityHandler {
  private bot: Bot;
  private messageManager: MessageManager;
  private shopItemMap: { [key: string]: string } = {};
  private gardenItemMap: { [key: string]: string } = {};
  private lastItemMapUpdate: Date = new Date(0);

  constructor(bot: Bot, messageManager: MessageManager) {
    this.bot = bot;
    this.messageManager = messageManager;
  }

  async handleScheduledReport(intervalMinutes: number): Promise<void> {
    console.log(`Generating scheduled activity report (${intervalMinutes}m interval)`);
    
    try {
      // Send to configured target chat
      await this.generateActivityReport(botConfig.targetChatId, intervalMinutes);
    } catch (error) {
      console.error('Failed to handle scheduled report:', error);
      
      // Notify admins about the error
      for (const adminId of botConfig.adminUserIds) {
        try {
          await this.bot.api.sendMessage(
            adminId, 
            `❌ Scheduled activity report failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        } catch (notifyError) {
          console.error(`Failed to notify admin ${adminId}:`, notifyError);
        }
      }
    }
  }

  async handleManualReport(ctx: Context): Promise<void> {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    console.log(`Manual activity report requested for chat ${chatId}`);
    
    await this.generateActivityReport(chatId, 180); // Default 180 minutes for manual reports
  }

  private async generateActivityReport(chatId: number, intervalMinutes: number): Promise<void> {
    try {
      // Update item maps if needed
      await this.updateItemMaps();

      // Fetch activities
      const activities = await getAllActivity(intervalMinutes);
      console.log(`Found ${activities.length} activities in the last ${intervalMinutes} minutes`);

      // Send final report
      await this.messageManager.sendActivityReport(
        chatId,
        activities,
        intervalMinutes,
        this.shopItemMap,
        this.gardenItemMap
      );

      console.log(`Activity report sent successfully to chat ${chatId}`);

    } catch (error) {
      console.error('Failed to generate activity report:', error);
      await this.messageManager.sendErrorMessage(
        chatId, 
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private async updateItemMaps(): Promise<void> {
    const now = new Date();
    const timeSinceUpdate = now.getTime() - this.lastItemMapUpdate.getTime();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    if (timeSinceUpdate < CACHE_DURATION) {
      return; // Use cached data
    }

    try {
      console.log('Updating item maps...');
      const [shopItems, gardenItems] = await Promise.all([
        getShopItems(),
        getGardenItems()
      ]);

      this.shopItemMap = shopItems;
      this.gardenItemMap = gardenItems;
      this.lastItemMapUpdate = now;

      console.log(`Updated item maps: ${Object.keys(shopItems).length} shop items, ${Object.keys(gardenItems).length} garden items`);
      
      // Log garden items for debugging
      if (Object.keys(gardenItems).length > 0) {
        console.log('Garden items loaded:', Object.entries(gardenItems).map(([id, name]) => `${id}: ${name}`).join(', '));
      } else {
        console.warn('No garden items loaded - item consumption will show as Item #ID');
      }
    } catch (error) {
      console.error('Failed to update item maps:', error);
      // Continue with cached data
    }
  }

  async testIndexerConnection(): Promise<boolean> {
    try {
      console.log('Testing indexer connection...');
      const isConnected = await testConnection();
      console.log(`Indexer connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      console.error('Indexer connection test failed:', error);
      return false;
    }
  }

  getItemMaps(): { shop: { [key: string]: string }, garden: { [key: string]: string } } {
    return {
      shop: this.shopItemMap,
      garden: this.gardenItemMap
    };
  }

  async forceItemMapUpdate(): Promise<void> {
    this.lastItemMapUpdate = new Date(0); // Force update
    await this.updateItemMaps();
  }
}
