import { Bot, Context } from 'grammy';
import { seedBurnTracker } from '../services/seed-burn-client';
import { formatSeedBurnMessage, formatSeedBurnError, formatSeedBurnLoading } from '../formatters/seed-burn-formatter';
import { SeedBurnState } from '../types';
import { botConfig } from '../config';

export class SeedBurnHandler {
  private bot: Bot;
  private burnStates: Map<number, SeedBurnState> = new Map();

  constructor(bot: Bot) {
    this.bot = bot;
  }

  private getChatBurnState(chatId: number): SeedBurnState {
    if (!this.burnStates.has(chatId)) {
      this.burnStates.set(chatId, {});
    }
    return this.burnStates.get(chatId)!;
  }

  async handleScheduledBurnReport(intervalMinutes: number): Promise<void> {
    console.log(`Generating scheduled SEED burn report (${intervalMinutes}m interval)`);
    
    try {
      // Send to configured target chat
      await this.generateBurnReport(botConfig.targetChatId, intervalMinutes);
    } catch (error) {
      console.error('Failed to handle scheduled burn report:', error);
      
      // Notify admins about the error
      for (const adminId of botConfig.adminUserIds) {
        try {
          await this.bot.api.sendMessage(
            adminId, 
            `❌ Scheduled SEED burn report failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        } catch (notifyError) {
          console.error(`Failed to notify admin ${adminId}:`, notifyError);
        }
      }
    }
  }

  async handleManualBurnReport(ctx: Context): Promise<void> {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    console.log(`Manual SEED burn report requested for chat ${chatId}`);
    
    await this.generateBurnReport(chatId, 60); // Default 60 minutes for manual reports
  }

  private async generateBurnReport(chatId: number, intervalMinutes: number): Promise<void> {
    const burnState = this.getChatBurnState(chatId);
    
    try {
      // Fetch burn data
      const burnData = await seedBurnTracker.getSeedBurnData(intervalMinutes);
      console.log(`SEED burn data: ${burnData.burnedInPeriod} burned in ${intervalMinutes}m, total: ${burnData.totalBurned}`);

      // Send final report
      const reportMessage = formatSeedBurnMessage(burnData);
      const result = await this.bot.api.sendMessage(chatId, reportMessage, { parse_mode: 'HTML' });
      burnState.messageId = result.message_id;

      console.log(`SEED burn report sent successfully to chat ${chatId}`);

    } catch (error) {
      console.error('Failed to generate SEED burn report:', error);
      
      const errorMessage = formatSeedBurnError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      
      try {
        await this.bot.api.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' });
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
    }
  }

  async initializeBurnBaseline(intervalMinutes: number): Promise<void> {
    try {
      await seedBurnTracker.initializeBaseline(intervalMinutes);
    } catch (error) {
      console.error('Failed to initialize burn baseline:', error);
      throw error;
    }
  }

  async testSeedContract(): Promise<boolean> {
    try {
      console.log('Testing SEED contract connection...');
      const isConnected = await seedBurnTracker.testConnection();
      console.log(`SEED contract connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      console.error('SEED contract connection test failed:', error);
      return false;
    }
  }

  resetBurnState(chatId?: number): void {
    if (chatId) {
      this.burnStates.delete(chatId);
    } else {
      this.burnStates.clear();
    }
    seedBurnTracker.reset();
  }

  getBurnState(chatId: number): SeedBurnState {
    const state = this.burnStates.get(chatId);
    return state ? { ...state } : {};
  }

  clearChatState(chatId: number): void {
    this.burnStates.delete(chatId);
  }
}
