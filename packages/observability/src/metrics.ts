/**
 * Prometheus-Compatible OpenTelemetry Metrics Engine
 * @see docs/18-observability.md
 */

export type Labels = Record<string, string | number>;

function serializeLabels(labels?: Labels): string {
  if (!labels || Object.keys(labels).length === 0) return '';
  const entries = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
  return `{${entries.join(',')}}`;
}

export class Counter {
  private readonly counts: Map<string, number> = new Map();

  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[] = []
  ) {}

  inc(value = 1, labels?: Labels): void {
    if (value < 0) {
      throw new Error(`Counter ${this.name} cannot decrease`);
    }
    const key = serializeLabels(labels);
    const curr = this.counts.get(key) ?? 0;
    this.counts.set(key, curr + value);
  }

  get(labels?: Labels): number {
    return this.counts.get(serializeLabels(labels)) ?? 0;
  }

  exportPrometheus(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} counter`,
    ];
    if (this.counts.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [labelsStr, val] of this.counts.entries()) {
        lines.push(`${this.name}${labelsStr} ${val}`);
      }
    }
    return lines.join('\n');
  }
}

export class Gauge {
  private readonly values: Map<string, number> = new Map();

  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly labelNames: string[] = []
  ) {}

  set(value: number, labels?: Labels): void {
    const key = serializeLabels(labels);
    this.values.set(key, value);
  }

  inc(value = 1, labels?: Labels): void {
    const key = serializeLabels(labels);
    const curr = this.values.get(key) ?? 0;
    this.values.set(key, curr + value);
  }

  dec(value = 1, labels?: Labels): void {
    const key = serializeLabels(labels);
    const curr = this.values.get(key) ?? 0;
    this.values.set(key, curr - value);
  }

  get(labels?: Labels): number {
    return this.values.get(serializeLabels(labels)) ?? 0;
  }

  exportPrometheus(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} gauge`,
    ];
    if (this.values.size === 0) {
      lines.push(`${this.name} 0`);
    } else {
      for (const [labelsStr, val] of this.values.entries()) {
        lines.push(`${this.name}${labelsStr} ${val}`);
      }
    }
    return lines.join('\n');
  }
}

export class Histogram {
  private readonly sums: Map<string, number> = new Map();
  private readonly counts: Map<string, number> = new Map();
  private readonly bucketCounts: Map<string, Map<number, number>> = new Map();

  constructor(
    public readonly name: string,
    public readonly help: string,
    public readonly buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    public readonly labelNames: string[] = []
  ) {
    this.buckets.sort((a, b) => a - b);
  }

  observe(value: number, labels?: Labels): void {
    const key = serializeLabels(labels);
    const sum = (this.sums.get(key) ?? 0) + value;
    const count = (this.counts.get(key) ?? 0) + 1;
    this.sums.set(key, sum);
    this.counts.set(key, count);

    let bMap = this.bucketCounts.get(key);
    if (!bMap) {
      bMap = new Map<number, number>();
      for (const b of this.buckets) bMap.set(b, 0);
      this.bucketCounts.set(key, bMap);
    }

    for (const b of this.buckets) {
      if (value <= b) {
        bMap.set(b, (bMap.get(b) ?? 0) + 1);
      }
    }
  }

  exportPrometheus(): string {
    const lines: string[] = [
      `# HELP ${this.name} ${this.help}`,
      `# TYPE ${this.name} histogram`,
    ];

    for (const [key, count] of this.counts.entries()) {
      const bMap = this.bucketCounts.get(key) ?? new Map<number, number>();
      const baseLabels = key.length > 2 ? key.slice(1, -1) : '';

      for (const b of this.buckets) {
        const val = bMap.get(b) ?? 0;
        const bLabel = baseLabels ? `${baseLabels},le="${b}"` : `le="${b}"`;
        lines.push(`${this.name}_bucket{${bLabel}} ${val}`);
      }
      const infLabel = baseLabels ? `${baseLabels},le="+Inf"` : `le="+Inf"`;
      lines.push(`${this.name}_bucket{${infLabel}} ${count}`);
      lines.push(`${this.name}_sum${key} ${this.sums.get(key) ?? 0}`);
      lines.push(`${this.name}_count${key} ${count}`);
    }

    return lines.join('\n');
  }
}

export class MetricsRegistry {
  private readonly metrics: Map<string, Counter | Gauge | Histogram> = new Map();

  createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    let existing = this.metrics.get(name);
    if (!existing) {
      existing = new Counter(name, help, labelNames);
      this.metrics.set(name, existing);
    }
    return existing as Counter;
  }

  createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    let existing = this.metrics.get(name);
    if (!existing) {
      existing = new Gauge(name, help, labelNames);
      this.metrics.set(name, existing);
    }
    return existing as Gauge;
  }

  createHistogram(name: string, help: string, buckets?: number[], labelNames: string[] = []): Histogram {
    let existing = this.metrics.get(name);
    if (!existing) {
      existing = new Histogram(name, help, buckets, labelNames);
      this.metrics.set(name, existing);
    }
    return existing as Histogram;
  }

  clear(): void {
    this.metrics.clear();
  }

  exportPrometheusMetrics(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(metric.exportPrometheus());
    }
    return lines.join('\n\n') + '\n';
  }
}

export const defaultRegistry = new MetricsRegistry();
