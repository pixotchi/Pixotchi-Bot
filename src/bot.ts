import { Bot, GrammyError, HttpError } from 'grammy';
import { botConfig } from './config';
import { ActivityScheduler } from './services/scheduler';
import { SeedBurnScheduler } from './services/seed-burn-scheduler';
import { MessageManager } from './handlers/message-manager';
import { ActivityHandler } from './handlers/activity-handler';
import { SeedBurnHandler } from './handlers/seed-burn-handler';
import { AdminHandler } from './handlers/admin-handler';

export class PixotchiBot {
  private bot: Bot;
  private scheduler: ActivityScheduler;
  private seedBurnScheduler: SeedBurnScheduler;
  private messageManager: MessageManager;
  private activityHandler: ActivityHandler;
  private seedBurnHandler: SeedBurnHandler;
  private adminHandler: AdminHandler;

  constructor() {
    this.bot = new Bot(botConfig.token);
    this.scheduler = new ActivityScheduler(botConfig.defaultIntervalMinutes);
    this.seedBurnScheduler = new SeedBurnScheduler(botConfig.defaultSeedBurnIntervalMinutes);
    this.messageManager = new MessageManager(this.bot);
    this.activityHandler = new ActivityHandler(this.bot, this.messageManager);
    this.seedBurnHandler = new SeedBurnHandler(this.bot);
    this.adminHandler = new AdminHandler(
      this.bot, 
      this.scheduler, 
      this.seedBurnScheduler,
      this.activityHandler,
      this.seedBurnHandler
    );

    this.setupBot();
    this.setupSchedulers();
  }

  private setupBot(): void {
    // Error handling
    this.bot.catch((err) => {
      const ctx = err.ctx;
      console.error(`Error while handling update ${ctx.update.update_id}:`);
      const e = err.error;
      
      if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
      } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
      } else {
        console.error("Unknown error:", e);
      }
    });

    // Public commands
    this.bot.command('start', (ctx) => this.adminHandler.handleStart(ctx));
    this.bot.command('activities', (ctx) => this.adminHandler.handleActivities(ctx));
    this.bot.command('seedburn', (ctx) => this.adminHandler.handleSeedBurn(ctx));

    // Admin commands
    this.bot.command('admin_help', (ctx) => this.adminHandler.handleAdminHelp(ctx));
    this.bot.command('admin_interval', (ctx) => this.adminHandler.handleSetInterval(ctx));
    this.bot.command('admin_seed_interval', (ctx) => this.adminHandler.handleSetSeedInterval(ctx));
    this.bot.command('admin_status', (ctx) => this.adminHandler.handleStatus(ctx));
    this.bot.command('admin_test', (ctx) => this.adminHandler.handleTest(ctx));
    this.bot.command('admin_force', (ctx) => this.adminHandler.handleForceReport(ctx));
    this.bot.command('admin_seed_force', (ctx) => this.adminHandler.handleForceSeedReport(ctx));
    this.bot.command('admin_restart', (ctx) => this.adminHandler.handleRestart(ctx));

    // Callback query handlers for pagination
    this.bot.on('callback_query:data', async (ctx) => {
      const data = ctx.callbackQuery.data;
      
      if (data.startsWith('page_')) {
        const page = parseInt(data.replace('page_', ''), 10);
        if (!isNaN(page)) {
          await this.messageManager.handlePageNavigation(ctx, page);
        }
      } else if (data === 'noop') {
        await ctx.answerCallbackQuery();
      }
    });

    // Handle unknown commands
    this.bot.on('message:text', async (ctx) => {
      if (ctx.message.text.startsWith('/')) {
        await ctx.reply('❓ Unknown command. Use /start to see available commands.');
      }
    });

    console.log('Bot handlers configured');
  }

  private setupSchedulers(): void {
    // Listen for scheduled activity reports
    this.scheduler.on('report-requested', (intervalMinutes: number) => {
      this.activityHandler.handleScheduledReport(intervalMinutes).catch(error => {
        console.error('Scheduled activity report failed:', error);
      });
    });

    // Listen for scheduled SEED burn reports
    this.seedBurnScheduler.on('burn-report-requested', (intervalMinutes: number) => {
      this.seedBurnHandler.handleScheduledBurnReport(intervalMinutes).catch(error => {
        console.error('Scheduled SEED burn report failed:', error);
      });
    });

    console.log('Schedulers configured');
  }

  async start(): Promise<void> {
    try {
      // Test bot token by getting bot info
      const me = await this.bot.api.getMe();
      console.log(`Bot @${me.username} initialized successfully`);

      // Test target chat access
      try {
        await this.bot.api.getChat(botConfig.targetChatId);
        console.log(`Target chat ${botConfig.targetChatId} is accessible`);
      } catch (error) {
        console.warn(`Warning: Cannot access target chat ${botConfig.targetChatId}. Make sure the bot is added to the chat.`);
      }

      // Initialize SEED burn baseline silently
      try {
        await this.seedBurnHandler.initializeBurnBaseline(botConfig.defaultSeedBurnIntervalMinutes);
      } catch (error) {
        console.warn('Warning: Failed to initialize SEED burn baseline. First burn report may be inaccurate.');
      }

      // Start both schedulers
      this.scheduler.start();
      this.seedBurnScheduler.start();

      // Start the bot
      await this.bot.start();
      console.log('Pixotchi Activity Bot is running!');

    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    console.log('Stopping Pixotchi Activity Bot...');
    
    this.scheduler.stop();
    this.seedBurnScheduler.stop();
    await this.bot.stop();
    
    console.log('Bot stopped successfully');
  }

  getBot(): Bot {
    return this.bot;
  }

  getScheduler(): ActivityScheduler {
    return this.scheduler;
  }

  getSeedBurnScheduler(): SeedBurnScheduler {
    return this.seedBurnScheduler;
  }
}
