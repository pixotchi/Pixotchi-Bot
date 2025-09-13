import { ProcessedActivityEvent, PaginatedMessage } from '../types';
import { formatEventForTelegram } from './activity-formatter';

const EVENTS_PER_PAGE = 6;

export function buildPaginatedMessage(
  activities: ProcessedActivityEvent[],
  currentPage: number,
  intervalMinutes: number,
  shopItemMap: { [key: string]: string } = {},
  gardenItemMap: { [key: string]: string } = {}
): PaginatedMessage {
  const totalEvents = activities.length;
  const totalPages = Math.max(1, Math.ceil(totalEvents / EVENTS_PER_PAGE));
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  
  const startIndex = (validPage - 1) * EVENTS_PER_PAGE;
  const endIndex = Math.min(startIndex + EVENTS_PER_PAGE, totalEvents);
  const pageActivities = activities.slice(startIndex, endIndex);

  // Create clean header with current time
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  
  const timeText = intervalMinutes >= 60 
    ? `${Math.floor(intervalMinutes / 60)}h${intervalMinutes % 60 !== 0 ? ` ${intervalMinutes % 60}m` : ''}`
    : `${intervalMinutes}m`;
  
  const header = `🪴 <b>Activity Report (${timeText})</b> 🪴`;
  const subtitle = '';
  const pageInfo = totalEvents > 0 ? '' : '';

  const events = pageActivities.map(activity => 
    formatEventForTelegram(activity, shopItemMap, gardenItemMap)
  );

  const navigation = ''; // Remove navigation text, buttons handle this

  return {
    header,
    subtitle,
    pageInfo,
    events,
    navigation
  };
}

export function formatMessageForTelegram(message: PaginatedMessage): string {
  const parts = [message.header];
  
  if (message.subtitle) {
    parts.push(message.subtitle);
  }
  
  if (message.events.length > 0) {
    parts.push('', ...message.events);
  }

  return parts.join('\n');
}

export function buildLoadingMessage(stage: 'checking' | 'processing' | 'formatting'): string {
  switch (stage) {
    case 'checking':
      return '🔄 Checking activities...';
    case 'processing':
      return '📊 Processing activities...';
    case 'formatting':
      return '✨ Preparing report...';
    default:
      return '🔄 Loading...';
  }
}

export function buildErrorMessage(error: string): string {
  return `❌ Error: ${error}\n\nPlease try again later or contact an admin.`;
}

export function buildNoActivitiesMessage(intervalMinutes: number): string {
  const timeText = intervalMinutes >= 60 
    ? `${Math.floor(intervalMinutes / 60)}h${intervalMinutes % 60 !== 0 ? ` ${intervalMinutes % 60}m` : ''}`
    : `${intervalMinutes}m`;
  
  return [
    `🪴 <b>Activity Report (${timeText})</b> 🪴`,
    '',
    '😴 It\'s been quiet in the Pixotchi world!'
  ].join('\n');
}
