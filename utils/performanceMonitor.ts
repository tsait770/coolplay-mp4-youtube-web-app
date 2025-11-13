import { InteractionManager } from 'react-native';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__;

  startMeasure(name: string): void {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: Date.now(),
    });
    console.log(`[Performance] Started measuring: ${name}`);
  }

  endMeasure(name: string): number | null {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[Performance] No start time found for: ${name}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`[Performance] ${name}: ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`[Performance] SLOW OPERATION: ${name} took ${duration}ms`);
    }

    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn();
    
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }

  measureSync<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();
    
    this.startMeasure(name);
    try {
      return fn();
    } finally {
      this.endMeasure(name);
    }
  }

  runAfterInteractions(callback: () => void): void {
    InteractionManager.runAfterInteractions(() => {
      callback();
    });
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  logSummary(): void {
    if (!this.enabled) return;
    
    const metrics = this.getMetrics();
    if (metrics.length === 0) {
      console.log('[Performance] No metrics recorded');
      return;
    }

    console.log('\n[Performance] Summary:');
    console.log('='.repeat(50));
    
    metrics
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(m => {
        const status = (m.duration || 0) > 1000 ? '⚠️ SLOW' : '✓';
        console.log(`${status} ${m.name}: ${m.duration}ms`);
      });
    
    console.log('='.repeat(50) + '\n');
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

export const performanceMonitor = new PerformanceMonitor();
