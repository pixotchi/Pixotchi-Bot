import { Bot, Context, InlineKeyboard } from 'grammy';
import { ChatState, ProcessedActivityEvent } from '../types';
import { 
  buildPaginatedMessage, 
  formatMessageForTelegram, 
  buildLoadingMessage, 
  buildErrorMessage,
  buildNoActivitiesMessage 
} from '../formatters/message-builder';

export class MessageManager {
  private bot: Bot;
  private chatStates: Map<number, ChatState> = new Map();

  constructor(bot: Bot) {
    this.bot = bot;
  }

  async sendLoadingMessage(chatId: number, stage: 'checking' | 'processing' | 'formatting'): Promise<number | null> {
    try {
      const message = buildLoadingMessage(stage);
      const result = await this.bot.api.sendMessage(chatId, message);
      
      // Initialize or update chat state
      const state = this.getChatState(chatId);
      state.messageId = result.message_id;
      
      return result.message_id;
    } catch (error) {
      console.error('Failed to send loading message:', error);
      return null;
    }
  }

  async updateLoadingMessage(chatId: number, stage: 'checking' | 'processing' | 'formatting'): Promise<void> {
    const state = this.getChatState(chatId);
    if (!state.messageId) return;

    try {
      const message = buildLoadingMessage(stage);
      await this.bot.api.editMessageText(chatId, state.messageId, message);
    } catch (error) {
      console.error('Failed to update loading message:', error);
    }
  }

  async sendActivityReport(
    chatId: number, 
    activities: ProcessedActivityEvent[], 
    intervalMinutes: number,
    shopItemMap: { [key: string]: string } = {},
    gardenItemMap: { [key: string]: string } = {}
  ): Promise<void> {
    const state = this.getChatState(chatId);
    state.activities = activities;
    state.intervalMinutes = intervalMinutes;
    state.currentPage = 1;
    state.totalPages = Math.max(1, Math.ceil(activities.length / 6));
    state.lastUpdate = new Date();

    try {
      if (activities.length === 0) {
        const message = buildNoActivitiesMessage(intervalMinutes);
        const result = await this.bot.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
        state.messageId = result.message_id;
        return;
      }

      const paginatedMessage = buildPaginatedMessage(
        activities, 
        state.currentPage, 
        intervalMinutes, 
        shopItemMap, 
        gardenItemMap
      );
      
      const messageText = formatMessageForTelegram(paginatedMessage);
      const keyboard = this.buildNavigationKeyboard(state.currentPage, state.totalPages);

      const result = await this.bot.api.sendMessage(
        chatId, 
        messageText, 
        { 
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );
      state.messageId = result.message_id;
    } catch (error) {
      console.error('Failed to send activity report:', error);
      await this.sendErrorMessage(chatId, 'Failed to send activity report');
    }
  }

  async handlePageNavigation(ctx: Context, page: number): Promise<void> {
    if (!ctx.chat || !ctx.callbackQuery) return;

    const chatId = ctx.chat.id;
    const state = this.getChatState(chatId);
    
    if (!state.activities || state.activities.length === 0) {
      await ctx.answerCallbackQuery('No activities to navigate');
      return;
    }

    const validPage = Math.max(1, Math.min(page, state.totalPages));
    state.currentPage = validPage;

    try {
      const paginatedMessage = buildPaginatedMessage(
        state.activities, 
        state.currentPage, 
        state.intervalMinutes
      );
      
      const messageText = formatMessageForTelegram(paginatedMessage);
      const keyboard = this.buildNavigationKeyboard(state.currentPage, state.totalPages);

      await ctx.editMessageText(
        messageText, 
        { 
          reply_markup: keyboard,
          parse_mode: 'HTML'
        }
      );
      
      await ctx.answerCallbackQuery(`Page ${validPage} of ${state.totalPages}`);
    } catch (error) {
      console.error('Failed to handle page navigation:', error);
      await ctx.answerCallbackQuery('Navigation failed');
    }
  }

  async sendErrorMessage(chatId: number, error: string): Promise<void> {
    const message = buildErrorMessage(error);

    try {
      await this.bot.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error('Failed to send error message:', err);
    }
  }

  private getChatState(chatId: number): ChatState {
    if (!this.chatStates.has(chatId)) {
      this.chatStates.set(chatId, {
        currentPage: 1,
        totalPages: 1,
        lastUpdate: new Date(),
        activities: [],
        intervalMinutes: 180
      });
    }
    return this.chatStates.get(chatId)!;
  }

  private buildNavigationKeyboard(currentPage: number, totalPages: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    if (totalPages <= 1) {
      return keyboard;
    }

    const buttons = [];
    
    if (currentPage > 1) {
      buttons.push({ text: '◀️ Prev', callback_data: `page_${currentPage - 1}` });
    }
    
    buttons.push({ text: `${currentPage}/${totalPages}`, callback_data: 'noop' });
    
    if (currentPage < totalPages) {
      buttons.push({ text: 'Next ▶️', callback_data: `page_${currentPage + 1}` });
    }

    keyboard.row(...buttons);
    return keyboard;
  }

  getChatStates(): Map<number, ChatState> {
    return this.chatStates;
  }

  clearChatState(chatId: number): void {
    this.chatStates.delete(chatId);
  }
}
