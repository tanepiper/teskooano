/**
 * PerformanceProfiler - Benchmarking utilities for building systems
 *
 * Measures frame time, spatial query performance, memory usage,
 * and helps identify bottlenecks in building mechanics.
 *
 * Usage:
 *   const profiler = new PerformanceProfiler();
 *   profiler.startFrame();
 *   // ... game logic ...
 *   profiler.endFrame();
 *   console.log(profiler.getReport());
 */

export class PerformanceProfiler {
  constructor(options = {}) {
    this.historySize = options.historySize ?? 120; // ~2 seconds at 60fps
    this.warnThresholds = {
      frameTime: options.frameTimeWarn ?? 16.67, // 60fps
      queryTime: options.queryTimeWarn ?? 1, // 1ms per query
      memoryMB: options.memoryWarn ?? 500, // 500MB
    };

    this.frameHistory = [];
    this.queryHistory = [];
    this.customTimers = new Map();
    this.counters = new Map();

    this._frameStart = 0;
    this._currentFrame = null;
    this._enabled = true;
  }

  /**
   * Enable/disable profiling
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }

  /**
   * Start frame measurement
   */
  startFrame() {
    if (!this._enabled) return;

    this._frameStart = performance.now();
    this._currentFrame = {
      startTime: this._frameStart,
      sections: {},
      queries: [],
    };
  }

  /**
   * End frame measurement
   */
  endFrame() {
    if (!this._enabled || !this._currentFrame) return;

    const frameTime = performance.now() - this._frameStart;
    this._currentFrame.totalTime = frameTime;

    this.frameHistory.push(this._currentFrame);
    if (this.frameHistory.length > this.historySize) {
      this.frameHistory.shift();
    }

    this._currentFrame = null;
    return frameTime;
  }

  /**
   * Start timing a named section
   */
  startSection(name) {
    if (!this._enabled || !this._currentFrame) return;

    this._currentFrame.sections[name] = {
      start: performance.now(),
      end: null,
    };
  }

  /**
   * End timing a named section
   */
  endSection(name) {
    if (!this._enabled || !this._currentFrame) return;

    const section = this._currentFrame.sections[name];
    if (section) {
      section.end = performance.now();
      section.duration = section.end - section.start;
    }
  }

  /**
   * Time a function execution
   */
  time(name, fn) {
    if (!this._enabled) return fn();

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (this._currentFrame) {
      this._currentFrame.sections[name] = { duration };
    }

    return result;
  }

  /**
   * Time an async function execution
   */
  async timeAsync(name, fn) {
    if (!this._enabled) return fn();

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (this._currentFrame) {
      this._currentFrame.sections[name] = { duration };
    }

    return result;
  }

  /**
   * Record a spatial query for analysis
   */
  recordQuery(type, candidateCount, resultCount, timeMs) {
    if (!this._enabled) return;

    const query = { type, candidateCount, resultCount, timeMs };

    if (this._currentFrame) {
      this._currentFrame.queries.push(query);
    }

    this.queryHistory.push(query);
    if (this.queryHistory.length > this.historySize * 10) {
      this.queryHistory.shift();
    }
  }

  /**
   * Increment a counter
   */
  count(name, amount = 1) {
    if (!this._enabled) return;

    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + amount);
  }

  /**
   * Reset a counter
   */
  resetCount(name) {
    this.counters.set(name, 0);
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime() {
    if (this.frameHistory.length === 0) return 0;

    const sum = this.frameHistory.reduce((acc, f) => acc + f.totalTime, 0);
    return sum / this.frameHistory.length;
  }

  /**
   * Get current FPS estimate
   */
  getFPS() {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }

  /**
   * Get section timing statistics
   */
  getSectionStats(sectionName) {
    const times = this.frameHistory
      .map((f) => f.sections[sectionName]?.duration)
      .filter((t) => t !== undefined);

    if (times.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    };
  }

  /**
   * Get query statistics
   */
  getQueryStats() {
    if (this.queryHistory.length === 0) {
      return { avgTime: 0, avgCandidates: 0, avgResults: 0, count: 0 };
    }

    const stats = {
      avgTime: 0,
      avgCandidates: 0,
      avgResults: 0,
      count: this.queryHistory.length,
      byType: {},
    };

    for (const q of this.queryHistory) {
      stats.avgTime += q.timeMs;
      stats.avgCandidates += q.candidateCount;
      stats.avgResults += q.resultCount;

      if (!stats.byType[q.type]) {
        stats.byType[q.type] = { time: 0, count: 0 };
      }
      stats.byType[q.type].time += q.timeMs;
      stats.byType[q.type].count++;
    }

    stats.avgTime /= stats.count;
    stats.avgCandidates /= stats.count;
    stats.avgResults /= stats.count;

    for (const type in stats.byType) {
      stats.byType[type].avgTime =
        stats.byType[type].time / stats.byType[type].count;
    }

    return stats;
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedHeapMB: performance.memory.usedJSHeapSize / 1024 / 1024,
        totalHeapMB: performance.memory.totalJSHeapSize / 1024 / 1024,
        limitMB: performance.memory.jsHeapSizeLimit / 1024 / 1024,
      };
    }
    return null;
  }

  /**
   * Get comprehensive report
   */
  getReport() {
    const avgFrameTime = this.getAverageFrameTime();
    const fps = this.getFPS();
    const memory = this.getMemoryUsage();
    const queryStats = this.getQueryStats();

    // Gather all section names
    const sectionNames = new Set();
    for (const frame of this.frameHistory) {
      for (const name of Object.keys(frame.sections)) {
        sectionNames.add(name);
      }
    }

    const sections = {};
    for (const name of sectionNames) {
      sections[name] = this.getSectionStats(name);
    }

    // Warnings
    const warnings = [];
    if (avgFrameTime > this.warnThresholds.frameTime) {
      warnings.push(
        `Frame time ${avgFrameTime.toFixed(2)}ms exceeds ${this.warnThresholds.frameTime}ms threshold`,
      );
    }
    if (queryStats.avgTime > this.warnThresholds.queryTime) {
      warnings.push(
        `Query time ${queryStats.avgTime.toFixed(2)}ms exceeds ${this.warnThresholds.queryTime}ms threshold`,
      );
    }
    if (memory && memory.usedHeapMB > this.warnThresholds.memoryMB) {
      warnings.push(
        `Memory usage ${memory.usedHeapMB.toFixed(0)}MB exceeds ${this.warnThresholds.memoryMB}MB threshold`,
      );
    }

    return {
      fps: Math.round(fps),
      frameTime: {
        avg: avgFrameTime,
        min: Math.min(...this.frameHistory.map((f) => f.totalTime)),
        max: Math.max(...this.frameHistory.map((f) => f.totalTime)),
      },
      sections,
      queries: queryStats,
      memory,
      counters: Object.fromEntries(this.counters),
      warnings,
      frameCount: this.frameHistory.length,
    };
  }

  /**
   * Format report as string for console
   */
  formatReport() {
    const report = this.getReport();
    const lines = [
      `=== Performance Report ===`,
      `FPS: ${report.fps} (${report.frameTime.avg.toFixed(2)}ms avg)`,
      `Frame Range: ${report.frameTime.min.toFixed(2)}ms - ${report.frameTime.max.toFixed(2)}ms`,
      ``,
    ];

    if (Object.keys(report.sections).length > 0) {
      lines.push(`Sections:`);
      for (const [name, stats] of Object.entries(report.sections)) {
        lines.push(
          `  ${name}: ${stats.avg.toFixed(2)}ms avg (${stats.min.toFixed(2)}-${stats.max.toFixed(2)})`,
        );
      }
      lines.push(``);
    }

    if (report.queries.count > 0) {
      lines.push(`Queries: ${report.queries.count} total`);
      lines.push(`  Avg Time: ${report.queries.avgTime.toFixed(3)}ms`);
      lines.push(
        `  Avg Candidates: ${report.queries.avgCandidates.toFixed(0)}`,
      );
      lines.push(`  Avg Results: ${report.queries.avgResults.toFixed(0)}`);
      lines.push(``);
    }

    if (report.memory) {
      lines.push(
        `Memory: ${report.memory.usedHeapMB.toFixed(0)}MB / ${report.memory.limitMB.toFixed(0)}MB`,
      );
      lines.push(``);
    }

    if (Object.keys(report.counters).length > 0) {
      lines.push(`Counters:`);
      for (const [name, value] of Object.entries(report.counters)) {
        lines.push(`  ${name}: ${value}`);
      }
      lines.push(``);
    }

    if (report.warnings.length > 0) {
      lines.push(`⚠️ Warnings:`);
      for (const warning of report.warnings) {
        lines.push(`  - ${warning}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Reset all data
   */
  reset() {
    this.frameHistory = [];
    this.queryHistory = [];
    this.counters.clear();
    this._currentFrame = null;
  }

  /**
   * Create on-screen debug display
   */
  createOverlay(container = document.body) {
    const overlay = document.createElement("div");
    overlay.id = "perf-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 10000;
      pointer-events: none;
      white-space: pre;
    `;
    container.appendChild(overlay);

    const update = () => {
      if (!this._enabled) {
        overlay.style.display = "none";
        return;
      }
      overlay.style.display = "block";

      const report = this.getReport();
      const fpsColor =
        report.fps >= 55 ? "#0f0" : report.fps >= 30 ? "#ff0" : "#f00";

      overlay.innerHTML = `
<span style="color: ${fpsColor}">FPS: ${report.fps}</span>
Frame: ${report.frameTime.avg.toFixed(1)}ms
${report.memory ? `Mem: ${report.memory.usedHeapMB.toFixed(0)}MB` : ""}
${report.queries.count > 0 ? `Queries: ${report.queries.avgTime.toFixed(2)}ms avg` : ""}
${report.warnings.length > 0 ? `<span style="color: #f00">⚠ ${report.warnings.length} warnings</span>` : ""}
      `.trim();
    };

    // Update every 100ms
    const intervalId = setInterval(update, 100);

    return {
      element: overlay,
      destroy: () => {
        clearInterval(intervalId);
        overlay.remove();
      },
    };
  }
}

/**
 * Benchmark utility for comparing implementations
 */
export class Benchmark {
  constructor(name) {
    this.name = name;
    this.results = [];
  }

  /**
   * Run a function multiple times and record results
   */
  run(fn, iterations = 1000, warmup = 100) {
    // Warmup
    for (let i = 0; i < warmup; i++) {
      fn();
    }

    // Actual benchmark
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const result = {
      iterations,
      total: times.reduce((a, b) => a + b, 0),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: this._median(times),
      p95: this._percentile(times, 95),
      p99: this._percentile(times, 99),
    };

    this.results.push(result);
    return result;
  }

  /**
   * Compare multiple implementations
   */
  static compare(benchmarks) {
    const results = [];

    for (const { name, fn, iterations } of benchmarks) {
      const bench = new Benchmark(name);
      const result = bench.run(fn, iterations);
      results.push({ name, ...result });
    }

    // Sort by avg time
    results.sort((a, b) => a.avg - b.avg);

    // Calculate relative performance
    const baseline = results[0].avg;
    for (const result of results) {
      result.relative = result.avg / baseline;
    }

    return results;
  }

  /**
   * Format comparison results
   */
  static formatComparison(results) {
    const lines = ["=== Benchmark Comparison ===", ""];

    for (const r of results) {
      lines.push(`${r.name}:`);
      lines.push(`  Avg: ${r.avg.toFixed(4)}ms (${r.relative.toFixed(2)}x)`);
      lines.push(`  Min: ${r.min.toFixed(4)}ms, Max: ${r.max.toFixed(4)}ms`);
      lines.push(`  P95: ${r.p95.toFixed(4)}ms, P99: ${r.p99.toFixed(4)}ms`);
      lines.push("");
    }

    return lines.join("\n");
  }

  _median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  _percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

/**
 * Wrapper to profile spatial structure operations
 */
export function profileSpatialStructure(structure, profiler) {
  return {
    insert: (object, position) => {
      profiler.startSection("insert");
      const result = structure.insert(object, position);
      profiler.endSection("insert");
      return result;
    },

    remove: (object) => {
      profiler.startSection("remove");
      const result = structure.remove(object);
      profiler.endSection("remove");
      return result;
    },

    queryRadius: (position, radius) => {
      const start = performance.now();
      profiler.startSection("queryRadius");
      const results = structure.queryRadius(position, radius);
      profiler.endSection("queryRadius");

      const timeMs = performance.now() - start;
      profiler.recordQuery(
        "radius",
        structure.objectCount || 0,
        results.length,
        timeMs,
      );

      return results;
    },

    queryBounds: (bounds) => {
      const start = performance.now();
      profiler.startSection("queryBounds");
      const results = structure.queryBounds(bounds);
      profiler.endSection("queryBounds");

      const timeMs = performance.now() - start;
      profiler.recordQuery(
        "bounds",
        structure.objectCount || 0,
        results.length,
        timeMs,
      );

      return results;
    },
  };
}

export default PerformanceProfiler;
