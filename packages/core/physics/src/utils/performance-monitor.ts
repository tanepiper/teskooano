/**
 * Simple performance monitoring utility for measuring algorithm performance
 */

export interface PerformanceMetrics {
  /** Number of operations performed */
  operationCount: number;
  /** Total time spent in operations (milliseconds) */
  totalTime: number;
  /** Average time per operation (milliseconds) */
  averageTime: number;
  /** Memory allocations during operations */
  memoryAllocations: number;
  /** Last operation timestamp */
  lastOperationTime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    operationCount: 0,
    totalTime: 0,
    averageTime: 0,
    memoryAllocations: 0,
    lastOperationTime: 0,
  };

  private startTime: number = 0;
  private initialMemory: number = 0;

  /**
   * Start timing an operation
   */
  start(): void {
    this.startTime = performance.now();
    this.initialMemory = this.getMemoryUsage();
  }

  /**
   * End timing an operation and record metrics
   */
  end(): void {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    const finalMemory = this.getMemoryUsage();
    const memoryDelta = finalMemory - this.initialMemory;

    this.metrics.operationCount++;
    this.metrics.totalTime += duration;
    this.metrics.averageTime =
      this.metrics.totalTime / this.metrics.operationCount;
    this.metrics.memoryAllocations += memoryDelta;
    this.metrics.lastOperationTime = endTime;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      operationCount: 0,
      totalTime: 0,
      averageTime: 0,
      memoryAllocations: 0,
      lastOperationTime: 0,
    };
  }

  /**
   * Get memory usage (approximate)
   */
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Log performance summary
   */
  logSummary(operationName: string): void {
    const metrics = this.getMetrics();
    console.log(`Performance Summary for ${operationName}:`, {
      operations: metrics.operationCount,
      totalTime: `${metrics.totalTime.toFixed(2)}ms`,
      averageTime: `${metrics.averageTime.toFixed(2)}ms`,
      memoryAllocations: `${(metrics.memoryAllocations / 1024).toFixed(2)}KB`,
    });
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
