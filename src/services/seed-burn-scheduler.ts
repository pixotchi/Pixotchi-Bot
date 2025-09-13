import { EventEmitter } from 'events';

export class SeedBurnScheduler extends EventEmitter {
  private intervalMinutes: number;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(initialIntervalMinutes: number = 60) {
    super();
    this.intervalMinutes = Math.max(5, Math.min(1440, initialIntervalMinutes));
  }

  start(): void {
    if (this.isRunning) {
      console.log('SEED burn scheduler is already running');
      return;
    }

    const intervalMs = this.intervalMinutes * 60 * 1000;
    
    this.intervalId = setInterval(() => {
      console.log(`Scheduled SEED burn report triggered (${this.intervalMinutes}m interval)`);
      this.emit('burn-report-requested', this.intervalMinutes);
    }, intervalMs);
    
    this.isRunning = true;
    console.log(`SEED burn scheduler started with ${this.intervalMinutes}m interval (${intervalMs}ms)`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('SEED burn scheduler stopped');
  }

  setInterval(minutes: number): void {
    const newInterval = Math.max(5, Math.min(1440, minutes));
    if (newInterval === this.intervalMinutes) {
      return;
    }

    this.intervalMinutes = newInterval;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }

    console.log(`SEED burn scheduler interval updated to ${this.intervalMinutes}m`);
  }

  getInterval(): number {
    return this.intervalMinutes;
  }

  getStatus(): { isRunning: boolean; intervalMinutes: number; nextRun?: string } {
    const status = {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      nextRun: undefined as string | undefined
    };

    if (this.intervalId && this.isRunning) {
      // Calculate next run time based on interval
      const now = new Date();
      const nextRun = new Date(now.getTime() + (this.intervalMinutes * 60 * 1000));
      status.nextRun = nextRun.toISOString();
    }

    return status;
  }

  forceReport(): void {
    console.log('Forcing immediate SEED burn report');
    this.emit('burn-report-requested', this.intervalMinutes);
  }
}
