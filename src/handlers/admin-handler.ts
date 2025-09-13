import { Bot, Context, CommandContext } from 'grammy';
import { botConfig } from '../config';
import { ActivityScheduler } from '../services/scheduler';
import { SeedBurnScheduler } from '../services/seed-burn-scheduler';
import { ActivityHandler } from './activity-handler';
import { SeedBurnHandler } from './seed-burn-handler';

export class AdminHandler {
  private bot: Bot;
  private scheduler: ActivityScheduler;
  private seedBurnScheduler: SeedBurnScheduler;
  private activityHandler: ActivityHandler;
  private seedBurnHandler: SeedBurnHandler;

  constructor(
    bot: Bot, 
    scheduler: ActivityScheduler, 
    seedBurnScheduler: SeedBurnScheduler,
    activityHandler: ActivityHandler,
    seedBurnHandler: SeedBurnHandler
  ) {
    this.bot = bot;
    this.scheduler = scheduler;
    this.seedBurnScheduler = seedBurnScheduler;
    this.activityHandler = activityHandler;
    this.seedBurnHandler = seedBurnHandler;
  }

  private isAdmin(userId: number): boolean {
    return botConfig.adminUserIds.includes(userId);
  }

  private async checkAdminAccess(ctx: Context): Promise<boolean> {
    if (!ctx.from || !this.isAdmin(ctx.from.id)) {
      await ctx.reply('❌ Access denied. Admin privileges required.');
      return false;
    }
    return true;
  }

  async handleAdminHelp(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    const helpMessage = [
      '🔧 **Admin Commands**',
      '',
      '**Activity Reports:**',
      '`/admin_interval <minutes>` - Set activity interval (5-1440 minutes)',
      '`/admin_force` - Force immediate activity report',
      '',
      '**SEED Burn Reports:**',
      '`/admin_seed_interval <minutes>` - Set SEED burn interval (5-1440 minutes)',
      '`/admin_seed_force` - Force immediate SEED burn report',
      '',
      '**System:**',
      '`/admin_status` - Show bot status and settings',
      '`/admin_test` - Test all connections',
      '`/admin_restart` - Restart both schedulers',
      '',
      '📊 **Current Settings**',
      `• Target chat: ${botConfig.targetChatId}`,
      `• Activity interval: ${this.scheduler.getInterval()}m`,
      `• SEED burn interval: ${this.seedBurnScheduler.getInterval()}m`,
      `• Status: ${this.scheduler.getStatus().isRunning ? 'Running' : 'Stopped'}`,
    ].join('\n');

    await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
  }

  async handleSetInterval(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    const args = ctx.message?.text?.split(' ');
    if (!args || args.length !== 2) {
      await ctx.reply('❌ Usage: `/admin_interval <minutes>`\nExample: `/admin_interval 180`', { parse_mode: 'Markdown' });
      return;
    }

    const minutes = parseInt(args[1], 10);
    if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
      await ctx.reply('❌ Invalid interval. Please specify a number between 5 and 1440 minutes (24 hours).');
      return;
    }

    try {
      this.scheduler.setInterval(minutes);
      const timeText = minutes >= 60 
        ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''}${minutes % 60 !== 0 ? ` ${minutes % 60}m` : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      await ctx.reply(`✅ Reporting interval updated to ${timeText}.`);
      console.log(`Admin ${ctx.from?.id} changed interval to ${minutes}m`);
    } catch (error) {
      console.error('Failed to set interval:', error);
      await ctx.reply('❌ Failed to update interval. Please try again.');
    }
  }

  async handleSetSeedInterval(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    const args = ctx.message?.text?.split(' ');
    if (!args || args.length !== 2) {
      await ctx.reply('❌ Usage: `/admin_seed_interval <minutes>`\nExample: `/admin_seed_interval 60`', { parse_mode: 'Markdown' });
      return;
    }

    const minutes = parseInt(args[1], 10);
    if (isNaN(minutes) || minutes < 5 || minutes > 1440) {
      await ctx.reply('❌ Invalid interval. Please specify a number between 5 and 1440 minutes (24 hours).');
      return;
    }

    try {
      this.seedBurnScheduler.setInterval(minutes);
      
      // Initialize baseline for new interval
      try {
        await this.seedBurnHandler.initializeBurnBaseline(minutes);
        console.log(`Initialized SEED burn baseline for new ${minutes}m interval`);
      } catch (error) {
        console.warn(`Warning: Failed to initialize baseline for new interval: ${error}`);
      }
      
      const timeText = minutes >= 60 
        ? `${Math.floor(minutes / 60)} hour${Math.floor(minutes / 60) !== 1 ? 's' : ''}${minutes % 60 !== 0 ? ` ${minutes % 60}m` : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      await ctx.reply(`✅ SEED burn reporting interval updated to ${timeText}.`);
      console.log(`Admin ${ctx.from?.id} changed SEED burn interval to ${minutes}m`);
    } catch (error) {
      console.error('Failed to set SEED burn interval:', error);
      await ctx.reply('❌ Failed to update SEED burn interval. Please try again.');
    }
  }

  async handleStatus(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    try {
      const activityStatus = this.scheduler.getStatus();
      const seedBurnStatus = this.seedBurnScheduler.getStatus();
      const itemMaps = this.activityHandler.getItemMaps();
      
      const activityIntervalText = activityStatus.intervalMinutes >= 60 
        ? `${Math.floor(activityStatus.intervalMinutes / 60)}h${activityStatus.intervalMinutes % 60 !== 0 ? ` ${activityStatus.intervalMinutes % 60}m` : ''}`
        : `${activityStatus.intervalMinutes}m`;

      const seedIntervalText = seedBurnStatus.intervalMinutes >= 60 
        ? `${Math.floor(seedBurnStatus.intervalMinutes / 60)}h${seedBurnStatus.intervalMinutes % 60 !== 0 ? ` ${seedBurnStatus.intervalMinutes % 60}m` : ''}`
        : `${seedBurnStatus.intervalMinutes}m`;

      const statusMessage = [
        '📊 **Bot Status**',
        '',
        '**Activity Reports:**',
        `🔄 Status: ${activityStatus.isRunning ? '✅ Running' : '❌ Stopped'}`,
        `⏰ Interval: ${activityIntervalText}`,
        '',
        '**SEED Burn Reports:**',
        `🔥 Status: ${seedBurnStatus.isRunning ? '✅ Running' : '❌ Stopped'}`,
        `⏰ Interval: ${seedIntervalText}`,
        '',
        '**System:**',
        `🎯 Target Chat: ${botConfig.targetChatId}`,
        `📦 Shop items: ${Object.keys(itemMaps.shop).length}`,
        `📦 Garden items: ${Object.keys(itemMaps.garden).length}`,
        `🌐 API: ${botConfig.ponderApiUrl}`,
        `🔗 SEED Contract: ${botConfig.seedContractAddress.slice(0, 8)}...`,
      ];

      // Add next run times if available
      if (activityStatus.nextRun) {
        const nextRun = new Date(activityStatus.nextRun);
        statusMessage.splice(7, 0, `📅 Next Activity: ${nextRun.toLocaleString()}`);
      }
      
      if (seedBurnStatus.nextRun) {
        const nextRun = new Date(seedBurnStatus.nextRun);
        const insertIndex = activityStatus.nextRun ? 12 : 11;
        statusMessage.splice(insertIndex, 0, `📅 Next SEED: ${nextRun.toLocaleString()}`);
      }

      await ctx.reply(statusMessage.join('\n'), { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Failed to get status:', error);
      await ctx.reply('❌ Failed to retrieve status information.');
    }
  }

  async handleTest(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    await ctx.reply('🔄 Testing connections...');

    try {
      const [indexerConnected, seedContractConnected] = await Promise.all([
        this.activityHandler.testIndexerConnection(),
        this.seedBurnHandler.testSeedContract()
      ]);
      
      const results = [
        '**Connection Test Results:**',
        '',
        `📊 Indexer: ${indexerConnected ? '✅ Connected' : '❌ Failed'}`,
        `🔥 SEED Contract: ${seedContractConnected ? '✅ Connected' : '❌ Failed'}`,
      ];

      if (indexerConnected && seedContractConnected) {
        results.push('', '✅ All connections successful!');
      } else {
        results.push('', '⚠️ Some connections failed. Check logs for details.');
      }

      await ctx.reply(results.join('\n'), { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Connection test error:', error);
      await ctx.reply(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleForceReport(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    try {
      await ctx.reply('🔄 Generating immediate activity report...');
      this.scheduler.forceReport();
      console.log(`Admin ${ctx.from?.id} forced an activity report`);
    } catch (error) {
      console.error('Failed to force report:', error);
      await ctx.reply('❌ Failed to generate report. Please try again.');
    }
  }

  async handleForceSeedReport(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    try {
      await ctx.reply('🔄 Generating immediate SEED burn report...');
      this.seedBurnScheduler.forceReport();
      console.log(`Admin ${ctx.from?.id} forced a SEED burn report`);
    } catch (error) {
      console.error('Failed to force SEED burn report:', error);
      await ctx.reply('❌ Failed to generate SEED burn report. Please try again.');
    }
  }

  async handleRestart(ctx: CommandContext<Context>): Promise<void> {
    if (!await this.checkAdminAccess(ctx)) return;

    try {
      await ctx.reply('🔄 Restarting both schedulers...');
      
      this.scheduler.stop();
      this.seedBurnScheduler.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      this.scheduler.start();
      this.seedBurnScheduler.start();
      
      await ctx.reply('✅ Both schedulers restarted successfully!');
      console.log(`Admin ${ctx.from?.id} restarted both schedulers`);
    } catch (error) {
      console.error('Failed to restart schedulers:', error);
      await ctx.reply('❌ Failed to restart schedulers. Please check the logs.');
    }
  }

  // Public commands (non-admin)
  async handleActivities(ctx: CommandContext<Context>): Promise<void> {
    if (!ctx.chat) return;
    
    // Allow in the target chat or for admins
    if (ctx.chat.id !== botConfig.targetChatId && !this.isAdmin(ctx.from?.id || 0)) {
      await ctx.reply('❌ This command can only be used in the configured chat or by admins.');
      return;
    }

    await this.activityHandler.handleManualReport(ctx);
  }

  async handleSeedBurn(ctx: CommandContext<Context>): Promise<void> {
    if (!ctx.chat) return;
    
    // Allow in the target chat or for admins
    if (ctx.chat.id !== botConfig.targetChatId && !this.isAdmin(ctx.from?.id || 0)) {
      await ctx.reply('❌ This command can only be used in the configured chat or by admins.');
      return;
    }

    await this.seedBurnHandler.handleManualBurnReport(ctx);
  }

  async handleStart(ctx: CommandContext<Context>): Promise<void> {
    const welcomeMessage = [
      '🔥 **Pixotchi Activity Bot**',
      '',
      'I monitor the Pixotchi blockchain game and SEED token burns, reporting at regular intervals.',
      '',
      '**Available Commands:**',
      '• `/activities` - Show current activity report',
      '• `/seedburn` - Show current SEED burn report',
      '• `/start` - Show this welcome message',
      '',
      'Admins can use `/admin_help` for additional commands.',
      '',
      '🎮 Join the Pixotchi community and start playing!',
    ].join('\n');

    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  }
}
