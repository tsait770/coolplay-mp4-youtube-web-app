class MemoryMonitor {
  private timers: Set<ReturnType<typeof setTimeout>> = new Set();
  private intervals: Set<ReturnType<typeof setInterval>> = new Set();
  private listeners: Map<string, Set<() => void>> = new Map();

  registerTimer(timer: ReturnType<typeof setTimeout>): void {
    this.timers.add(timer);
  }

  clearTimer(timer: ReturnType<typeof setTimeout>): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  registerInterval(interval: ReturnType<typeof setInterval>): void {
    this.intervals.add(interval);
  }

  clearInterval(interval: ReturnType<typeof setInterval>): void {
    clearInterval(interval);
    this.intervals.delete(interval);
  }

  registerListener(key: string, listener: () => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)?.add(listener);
  }

  removeListener(key: string, listener: () => void): void {
    this.listeners.get(key)?.delete(listener);
  }

  clearAllTimers(): void {
    console.log(`[Memory] Clearing ${this.timers.size} timers`);
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  clearAllIntervals(): void {
    console.log(`[Memory] Clearing ${this.intervals.size} intervals`);
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  clearAllListeners(): void {
    let totalListeners = 0;
    this.listeners.forEach(set => {
      totalListeners += set.size;
    });
    console.log(`[Memory] Clearing ${totalListeners} listeners`);
    this.listeners.clear();
  }

  cleanup(): void {
    this.clearAllTimers();
    this.clearAllIntervals();
    this.clearAllListeners();
  }

  getStats(): {
    timers: number;
    intervals: number;
    listeners: number;
  } {
    let totalListeners = 0;
    this.listeners.forEach(set => {
      totalListeners += set.size;
    });

    return {
      timers: this.timers.size,
      intervals: this.intervals.size,
      listeners: totalListeners,
    };
  }

  logStats(): void {
    const stats = this.getStats();
    console.log('[Memory] Current stats:');
    console.log(`  - Active timers: ${stats.timers}`);
    console.log(`  - Active intervals: ${stats.intervals}`);
    console.log(`  - Active listeners: ${stats.listeners}`);
    
    if (stats.timers > 10) {
      console.warn('[Memory] WARNING: High number of active timers');
    }
    if (stats.intervals > 5) {
      console.warn('[Memory] WARNING: High number of active intervals');
    }
    if (stats.listeners > 50) {
      console.warn('[Memory] WARNING: High number of active listeners');
    }
  }
}

export const memoryMonitor = new MemoryMonitor();
