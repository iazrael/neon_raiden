import { BehaviorSubject } from 'rxjs';

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用监控 */
  enabled: boolean;
  /** 帧时间阈值（ms），超过此值触发警告 */
  frameTimeThreshold: number;
  /** 是否输出到控制台 */
  reportToConsole: boolean;
}

/**
 * 系统耗时记录
 */
export interface SystemMetric {
  /** 系统名称 */
  name: string;
  /** 耗时（毫秒） */
  durationMs: number;
  /** 所属层级（P1-P8） */
  layer: string;
}

/**
 * 层级聚合数据
 */
export interface LayerMetrics {
  /** 该层级总耗时 */
  totalMs: number;
  /** 该层级下各系统耗时 */
  systems: SystemMetric[];
}

/**
 * 帧性能快照
 */
export interface FrameSnapshot {
  /** 总帧时间（ms） */
  frameTime: number;
  /** 是否超过阈值 */
  thresholdExceeded: boolean;
  /** 各层级聚合数据 */
  layers: Record<string, LayerMetrics>;
}

/**
 * 性能监控器
 *
 * 职责：
 * - 记录每个系统的执行时间
 * - 按层级聚合数据
 * - 超阈值时触发警告并输出流
 * - 提供配置开关
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private performance$ = new BehaviorSubject<FrameSnapshot | null>(null);

  /** 当前帧的临时数据 */
  private currentFrameSystems: SystemMetric[] = [];

  constructor(config: PerformanceConfig) {
    this.config = config;
  }

  /**
   * 帧开始
   */
  startFrame(): void {
    if (!this.config.enabled) return;
    this.currentFrameSystems = [];
  }

  /**
   * 记录系统耗时
   * @param name 系统名称
   * @param layer 所属层级（P1-P8）
   * @param durationMs 耗时（毫秒）
   */
  recordSystem(name: string, layer: string, durationMs: number): void {
    if (!this.config.enabled) return;
    this.currentFrameSystems.push({ name, durationMs, layer });
  }

  /**
   * 帧结束，结算并输出
   * @param frameTime 总帧时间（ms）
   */
  endFrame(frameTime: number): void {
    if (!this.config.enabled) return;

    const exceeded = frameTime > this.config.frameTimeThreshold;
    const layers = this.aggregateByLayer(this.currentFrameSystems);

    const snapshot: FrameSnapshot = { frameTime, thresholdExceeded: exceeded, layers };
    this.performance$.next(snapshot);

    if (exceeded && this.config.reportToConsole) {
      this.reportWarning(frameTime, layers);
    }
  }

  /**
   * 按层级聚合数据
   */
  private aggregateByLayer(systems: SystemMetric[]): Record<string, LayerMetrics> {
    const layers: Record<string, LayerMetrics> = {};

    for (const sys of systems) {
      if (!layers[sys.layer]) {
        layers[sys.layer] = { totalMs: 0, systems: [] };
      }
      layers[sys.layer].totalMs += sys.durationMs;
      layers[sys.layer].systems.push(sys);
    }

    return layers;
  }

  /**
   * 打印警告到控制台
   */
  private reportWarning(frameTime: number, layers: Record<string, LayerMetrics>): void {
    const fps = (1000 / frameTime).toFixed(1);

    console.warn(
      `%c⚠️ 帧耗时超标: ${frameTime.toFixed(2)}ms (${fps} FPS)`,
      'color: #ff6b6b; font-weight: bold;',
    );

    // 按总耗时排序层级
    const sortedLayers = Object.entries(layers).sort((a, b) => b[1].totalMs - a[1].totalMs);

    for (const [layerName, data] of sortedLayers) {
      // 单层超过 2ms 标红
      const isSlowLayer = data.totalMs > 2;

      console.groupCollapsed(
        `%c${layerName}: ${data.totalMs.toFixed(2)}ms`,
        isSlowLayer ? 'color: #ff6b6b;' : 'color: #51cf66;',
      );

      // 该层内耗时 > 0.5ms 的系统
      const slowSystems = data.systems.filter((s) => s.durationMs > 0.5);
      for (const sys of slowSystems) {
        const color = sys.durationMs > 2 ? '#ff6b6b' : '#ffd43b';
        console.log(`  %c${sys.name}: ${sys.durationMs.toFixed(2)}ms`, `color: ${color}`);
      }

      console.groupEnd();
    }
  }

  /**
   * 获取性能流
   */
  get stream(): BehaviorSubject<FrameSnapshot | null> {
    return this.performance$;
  }

  /**
   * 运行时更新配置
   */
  updateConfig(partial: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<PerformanceConfig> {
    return this.config;
  }
}
