---
aliases: [PerformanceMonitor, performance-monitor, performance-metrics]
tags: [core, physics, performance, monitoring, metrics]
type: Class
package: "@teskooano/core-physics"
name: PerformanceMonitor
location: "src/utils/performance-monitor.ts"
status: deprecated
---

# PerformanceMonitor (Deprecated)

Built-in performance monitoring and metrics collection system for tracking simulation performance and optimization.

**⚠️ DEPRECATED**: This class is no longer used in the current implementation. Performance monitoring has been removed from the SimulationManager to simplify the codebase.

## 🎯 Purpose

The `PerformanceMonitor` provides comprehensive performance tracking for the physics simulation engine. It monitors operation timing, memory usage, and execution statistics to help identify performance bottlenecks and optimize simulation performance.

## 🏗️ Architecture

### Core Implementation

```typescript
export class PerformanceMonitor {
  private startTime: number = 0;
  private endTime: number = 0;
  private operationCount: number = 0;
  private totalDuration: number = 0;
  private memoryStart: number = 0;
  private memoryEnd: number = 0;

  start(): void;
  end(): void;
  getMetrics(): PerformanceMetrics;
  logSummary(operationName: string): void;
  private getMemoryUsage(): number;
}
```

### Key Features

- **Timing Tracking**: Monitors operation start/end times and duration
- **Memory Monitoring**: Tracks memory usage before and after operations
- **Statistics Collection**: Accumulates operation counts and total duration
- **Performance Reporting**: Provides detailed performance summaries

## 🔧 Implementation Details

### Performance Metrics

The monitor tracks comprehensive performance metrics:

```typescript
export interface PerformanceMetrics {
  operationCount: number;
  totalDuration: number;
  averageDuration: number;
  memoryUsed: number;
  memoryDelta: number;
  operationsPerSecond: number;
}
```

### Timing Measurement

The monitor provides precise timing measurements:

```typescript
start(): void {
  this.startTime = performance.now();
  this.memoryStart = this.getMemoryUsage();
}

end(): void {
  this.endTime = performance.now();
  this.memoryEnd = this.getMemoryUsage();

  const duration = this.endTime - this.startTime;
  this.totalDuration += duration;
  this.operationCount++;
}
```

### Memory Monitoring

The monitor tracks memory usage changes:

```typescript
private getMemoryUsage(): number {
  if ((performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
}
```

### Performance Statistics

The monitor calculates comprehensive performance statistics:

```typescript
getMetrics(): PerformanceMetrics {
  const averageDuration = this.operationCount > 0
    ? this.totalDuration / this.operationCount
    : 0;

  const operationsPerSecond = averageDuration > 0
    ? 1000 / averageDuration
    : 0;

  const memoryUsed = this.memoryEnd;
  const memoryDelta = this.memoryEnd - this.memoryStart;

  return {
    operationCount: this.operationCount,
    totalDuration: this.totalDuration,
    averageDuration,
    memoryUsed,
    memoryDelta,
    operationsPerSecond
  };
}
```

## 🚀 Usage

### Basic Usage

```typescript
import { performanceMonitor } from "@teskooano/core-physics";

// Start monitoring
performanceMonitor.start();

// Perform operation
const result = algorithm.calculateAcceleration(targetBody, allBodies, config);

// End monitoring
performanceMonitor.end();

// Get metrics
const metrics = performanceMonitor.getMetrics();
console.log(`Operation took ${metrics.averageDuration}ms on average`);
```

### Integration with Algorithms

The monitor is integrated with all force calculation algorithms:

```typescript
// In SimulationManager
private calculateAccelerationForBody_NBody(
  targetBodyState: PhysicsStateReal,
  allBodies: PhysicsStateReal[],
  config: SimulationConfiguration
): OSVector3 {
  performanceMonitor.start(); // Start monitoring

  const algorithm = this.getAlgorithmInstance("neighbor-based");
  const result = algorithm.calculateAcceleration(targetBodyState, allBodies, {
    neighborDistance: config.neighborDistance,
    barnesHutThreshold: config.neighborDistance,
  });

  performanceMonitor.end(); // End monitoring
  return result;
}
```

### Performance Reporting

The monitor provides detailed performance summaries:

```typescript
// Log performance summary
performanceMonitor.logSummary("Force Calculation");

// Output example:
// Performance Summary for Force Calculation:
// - Operations: 1000
// - Total Duration: 1250.5ms
// - Average Duration: 1.25ms
// - Operations/Second: 800
// - Memory Used: 45.2MB
// - Memory Delta: +2.1MB
```

## 🔗 Integration

### With SimulationManager

The monitor is integrated with the simulation manager:

```typescript
export class SimulationManager {
  // ...

  getPerformanceStats(): any {
    return performanceMonitor.getMetrics();
  }

  logPerformanceSummary(): void {
    performanceMonitor.logSummary("Force Calculation");
  }
}
```

### With All Algorithms

The monitor is used by all force calculation algorithms:

- **NeighborBasedAlgorithm**: Tracks neighbor finding and force calculation
- **BarnesHutAlgorithm**: Monitors tree construction and traversal
- **FMMAlgorithm**: Tracks multipole expansion and clustering
- **P3MAlgorithm**: Monitors mesh creation and force calculation
- **TreePMAlgorithm**: Tracks hybrid method performance

## 📊 Performance Considerations

### Advantages

- **Comprehensive Tracking**: Monitors timing, memory, and operation counts
- **Easy Integration**: Simple start/end API for any operation
- **Detailed Reporting**: Provides comprehensive performance summaries
- **Memory Awareness**: Tracks memory usage and changes

### Limitations

- **Browser Dependent**: Memory monitoring requires browser support
- **Overhead**: Minimal overhead for timing measurements
- **Single Operation**: Tracks one operation at a time

### Optimization Tips

1. **Use Consistently**: Monitor all major operations for comprehensive data
2. **Analyze Trends**: Look for performance degradation over time
3. **Memory Monitoring**: Watch for memory leaks and excessive allocation
4. **Operation Frequency**: Monitor operations per second for throughput analysis

## 🔍 Performance Analysis

### Key Metrics

| Metric                | Description                | Importance             |
| --------------------- | -------------------------- | ---------------------- |
| **Operation Count**   | Total number of operations | Throughput measurement |
| **Total Duration**    | Cumulative time spent      | Overall performance    |
| **Average Duration**  | Time per operation         | Efficiency measurement |
| **Operations/Second** | Throughput rate            | Performance comparison |
| **Memory Used**       | Current memory usage       | Memory efficiency      |
| **Memory Delta**      | Memory change              | Memory leak detection  |

### Performance Patterns

The monitor helps identify common performance patterns:

1. **Linear Scaling**: Operations per second remains constant
2. **Degradation**: Operations per second decreases over time
3. **Memory Growth**: Memory usage increases without corresponding data growth
4. **Bottlenecks**: Specific operations taking disproportionate time

## 🔍 Related Components

- [[core/core-physics/SimulationManager|SimulationManager]] - Uses monitor for performance tracking
- [[core/core-physics/AlgorithmFactory|AlgorithmFactory]] - Algorithms use monitor for optimization
- [[core/core-physics/NeighborBasedAlgorithm|NeighborBasedAlgorithm]] - Monitors neighbor-based performance
- [[core/core-physics/BarnesHutAlgorithm|BarnesHutAlgorithm]] - Tracks tree algorithm performance
- [[core/core-physics/FMMAlgorithm|FMMAlgorithm]] - Monitors multipole method performance
- [[core/core-physics/P3MAlgorithm|P3MAlgorithm]] - Tracks particle-mesh performance
- [[core/core-physics/TreePMAlgorithm|TreePMAlgorithm]] - Monitors hybrid method performance

---

_The PerformanceMonitor provides essential performance tracking capabilities for the physics simulation engine, enabling developers to identify bottlenecks, optimize performance, and ensure efficient operation across all force calculation algorithms._
