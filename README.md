# Pixotchi Telegram Bot

A comprehensive Telegram bot for monitoring and reporting Pixotchi game activities and SEED token burn events on the Base blockchain network.

[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-2CA5E0?logo=telegram&logoColor=white&style=flat-square)](https://core.telegram.org/bots)
[![grammY](https://img.shields.io/badge/Framework-grammY-2B6CB0?style=flat-square)](https://grammy.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178c6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-43853d?logo=node.js&logoColor=white&style=flat-square)](https://nodejs.org/)
[![date-fns](https://img.shields.io/badge/Utils-date--fns-00C7B7?style=flat-square)](https://date-fns.org/)
[![Base Network](https://img.shields.io/badge/Base-Mainnet-0052FF?logo=coinbase&logoColor=white&style=flat-square)](https://www.base.org/)

## Overview

This bot provides automated reporting capabilities for the Pixotchi ecosystem, delivering real-time activity reports and SEED token burn analytics directly to Telegram chats. It integrates with the Pixotchi GraphQL API and Base blockchain to provide accurate, timely information about game events and token economics.

## Features

### Activity Reporting
- **Comprehensive Event Tracking**: Monitors all Pixotchi game activities including attacks, kills, mints, gameplay, item consumption, shop purchases, land operations, village/town upgrades, and quest activities
- **Intelligent Event Bundling**: Automatically groups related item consumption events for cleaner reporting
- **Interactive Pagination**: Navigate through large activity reports with inline keyboard controls
- **Customizable Time Windows**: Configure reporting intervals from minutes to hours
- **Smart Item Name Resolution**: Automatically resolves item IDs to human-readable names with fallback mechanisms

### SEED Token Burn Monitoring
- **Real-time Burn Tracking**: Monitors SEED token burns by tracking total supply changes
- **Period-based Analytics**: Calculates burns for specific time intervals with baseline tracking
- **Circulating Supply Calculation**: Provides current circulating supply based on total burns
- **Multi-RPC Resilience**: Automatic failover between multiple Base network RPC endpoints
- **Accurate Period Calculations**: Prevents double-counting with interval-specific state management

### Administrative Controls
- **Multi-admin Support**: Configure multiple administrators via Telegram user IDs
- **Dynamic Interval Management**: Adjust reporting intervals without restarting the bot
- **Real-time Status Monitoring**: Check scheduler status and next execution times
- **Manual Report Triggers**: Generate on-demand reports for immediate insights

### Technical Features
- **Concurrent Request Handling**: Prevents race conditions with request deduplication
- **Per-chat State Management**: Isolated state for multiple chat contexts
- **Automatic Error Recovery**: Graceful handling of API failures and network issues
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Type-safe Implementation**: Full TypeScript implementation with strict type checking

## Architecture

### Core Components

#### Handlers
- **ActivityHandler**: Manages activity report generation and item mapping
- **SeedBurnHandler**: Handles SEED token burn monitoring and reporting
- **AdminHandler**: Provides administrative commands and controls
- **MessageManager**: Centralized message sending and pagination management

#### Services
- **ActivityClient**: GraphQL API integration for fetching game events
- **SeedBurnClient**: Blockchain integration for SEED token monitoring
- **Schedulers**: Interval-based job scheduling for automated reports

#### Formatters
- **ActivityFormatter**: Converts raw events into human-readable messages
- **MessageBuilder**: Constructs paginated messages with navigation
- **SeedBurnFormatter**: Formats burn data with proper number formatting

### Data Flow
1. Schedulers trigger report generation at configured intervals
2. Handlers fetch data from respective services (API/blockchain)
3. Raw data is processed and formatted for Telegram display
4. Messages are sent with appropriate formatting and controls
5. User interactions are handled for pagination and commands

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Base network RPC access (Coinbase Developer Platform recommended)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pixotchi-telegram-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration values (see Configuration section)

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Production Deployment

#### Railway Deployment (Recommended)
1. Push code to GitHub repository
2. Connect repository to Railway project
3. Configure environment variables in Railway dashboard
4. Deploy automatically via Railway's build system

#### Docker Deployment
```bash
docker build -t pixotchi-bot .
docker run -d --env-file .env pixotchi-bot
```

## Configuration

### Environment Variables

#### Bot Configuration
- `TELEGRAM_BOT_TOKEN`: Telegram bot token from BotFather (required)
- `ADMIN_USER_IDS`: Comma-separated list of Telegram user IDs with admin access (required)
- `TARGET_CHAT_ID`: Primary chat ID for automated reports (required)

#### Timing Configuration
- `DEFAULT_INTERVAL_MINUTES`: Activity report interval in minutes (default: 180)
- `DEFAULT_SEED_BURN_INTERVAL_MINUTES`: SEED burn report interval in minutes (default: 60)

#### API Configuration
- `PONDER_API_URL`: Pixotchi GraphQL API endpoint (required)
- `SEED_CONTRACT_ADDRESS`: SEED token contract address on Base network (required)
- `SEED_TOTAL_SUPPLY`: Total SEED token supply for calculations (default: 20000000)

#### Blockchain Configuration
- `BASE_RPC_URL`: Primary Base network RPC endpoint (required)
- `BASE_RPC_BACKUP_1`: First backup RPC endpoint (optional)
- `BASE_RPC_BACKUP_2`: Second backup RPC endpoint (optional)

### Example Configuration
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
ADMIN_USER_IDS=123456789,987654321
TARGET_CHAT_ID=-1001234567890
DEFAULT_INTERVAL_MINUTES=180
DEFAULT_SEED_BURN_INTERVAL_MINUTES=60
PONDER_API_URL=https://api.mini.pixotchi.tech/graphql
SEED_CONTRACT_ADDRESS=0x546D239032b24eCEEE0cb05c92FC39090846adc7
SEED_TOTAL_SUPPLY=20000000
BASE_RPC_URL=https://api.developer.coinbase.com/rpc/v1/base/your-api-key
BASE_RPC_BACKUP_1=https://rpc.ankr.com/base/your-api-key
BASE_RPC_BACKUP_2=https://base-mainnet.public.blastapi.io
```

## Usage

### Bot Commands

#### Administrative Commands
- `/setinterval <minutes>`: Set activity report interval
- `/setseedinterval <minutes>`: Set SEED burn report interval
- `/status`: View current scheduler status and settings
- `/report`: Generate immediate activity report
- `/seedreport`: Generate immediate SEED burn report

#### User Commands
- `/start`: Initialize bot and display welcome message
- `/help`: Display available commands and usage information

### Interactive Features
- **Pagination Controls**: Use "Previous" and "Next" buttons to navigate through activity reports
- **Real-time Updates**: Reports automatically refresh based on configured intervals
- **Error Handling**: Automatic retry mechanisms with user-friendly error messages

## Development

### Project Structure
```
src/
├── bot.ts              # Main bot initialization
├── config.ts           # Configuration management
├── index.ts           # Application entry point
├── types.ts           # TypeScript type definitions
├── formatters/        # Message formatting utilities
├── handlers/          # Business logic handlers
├── services/          # External service integrations
└── utils/             # Helper utilities
```

### Building and Testing
```bash
# Build TypeScript
npm run build

# Run development server with hot reload
npm run dev

# Run linting
npm run lint

# Start production server
npm start
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and style enforcement
- **Error Handling**: Comprehensive error handling throughout
- **Logging**: Structured logging for debugging and monitoring

## API Integration

### Pixotchi GraphQL API
The bot integrates with the Pixotchi GraphQL API to fetch:
- Player attack events
- Kill events with rewards
- NFT minting events
- Gameplay events
- Item consumption and shop purchases
- Land operations and upgrades
- Quest activities
- Village and town management events

### Base Blockchain Integration
Direct integration with Base network for:
- SEED token contract monitoring
- Real-time total supply tracking
- Burn event calculation
- Multi-RPC failover support

## Monitoring and Maintenance

### Logging
The bot provides comprehensive logging including:
- Scheduler execution status
- API request/response cycles
- Blockchain interaction results
- Error conditions and recovery attempts
- Performance metrics

### Error Handling
- **Graceful Degradation**: Continues operation during partial failures
- **Automatic Retry**: Built-in retry mechanisms for transient failures
- **Fallback Mechanisms**: Alternative data sources when primary sources fail
- **User Notification**: Clear error messages for end users

### Health Monitoring
- **Scheduler Status**: Monitor active schedulers and next execution times
- **API Connectivity**: Track GraphQL API response times and errors
- **Blockchain Connectivity**: Monitor RPC endpoint health and failover
- **Memory Usage**: Track state management and prevent memory leaks

## Security Considerations

### Access Control
- Admin commands restricted to configured user IDs
- Input validation on all user inputs
- Rate limiting on command execution

### Data Protection
- No persistent storage of sensitive data
- Environment variable management for secrets
- Secure RPC endpoint usage

### Network Security
- HTTPS/WSS connections for all external communications
- Multiple RPC endpoints for redundancy
- Graceful handling of network interruptions

## Troubleshooting

### Common Issues

#### Bot Not Responding
- Verify `TELEGRAM_BOT_TOKEN` is correct and active
- Check bot has necessary permissions in target chat
- Confirm `ADMIN_USER_IDS` includes your Telegram user ID

#### Missing Activity Data
- Verify `PONDER_API_URL` is accessible
- Check GraphQL API response format hasn't changed
- Review item mapping fallback mechanisms

#### SEED Burn Reporting Issues
- Confirm `SEED_CONTRACT_ADDRESS` is correct
- Test RPC endpoint connectivity
- Verify contract ABI compatibility

#### Deployment Issues
- Check all required environment variables are set
- Verify Node.js version compatibility
- Review build logs for TypeScript compilation errors

### Getting Help
- Review application logs for detailed error information
- Check Railway deployment logs if using Railway
- Verify environment variable configuration
- Test individual components using admin commands

## Contributing

### Development Guidelines
- Follow TypeScript best practices
- Maintain comprehensive error handling
- Add logging for debugging purposes
- Update type definitions for new features
- Test thoroughly before deployment

### Code Style
- Use ESLint configuration provided
- Follow existing naming conventions
- Document complex business logic
- Maintain backward compatibility

## Support

For technical support or questions about the Pixotchi Telegram Bot, please refer to the project documentation or contact the development team through appropriate channels.

## License
Licensed under the MIT License. See the `LICENSE` file at the project root for details.

---

**Built with ❤️ for the Pixotchi community**

