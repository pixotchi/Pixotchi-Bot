import { PixotchiBot } from './bot';

async function main() {
  console.log('🔥 Starting Pixotchi Activity Bot...');

  const bot = new PixotchiBot();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  try {
    await bot.start();
  } catch (error) {
    console.error('🚨 Failed to start bot:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('🚨 Fatal error in main:', error);
  process.exit(1);
});
