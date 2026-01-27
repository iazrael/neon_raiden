/**
 * SpriteManager - 统一的精灵资源管理器
 *
 * 职责：
 * - 根据 SpriteRegistry 自动预加载所有 sprite
 * - 缓存已加载的图片，提供快速访问
 * - 提供获取图片和配置的统一接口
 * - 替代旧的 SpriteRenderer
 */

import { SpriteKey, SPRITE_REGISTRY, SpriteEntry, buildSpritePath } from './configs/sprites';

/**
 * 缓存的精灵数据
 */
interface CachedSprite {
  image: HTMLImageElement;
  config: SpriteEntry;
  loaded: boolean;
}

/**
 * SpriteManager 类
 */
export class SpriteManager {
  private static cache = new Map<SpriteKey, CachedSprite>();
  private static loadingPromises = new Map<SpriteKey, Promise<HTMLImageElement>>();

  /**
   * 预加载所有游戏资源
   * 根据 SPRITE_REGISTRY 自动加载所有 sprite
   */
  static async preloadAll(): Promise<void> {
    const entries = Object.values(SPRITE_REGISTRY);
    const promises = entries.map(entry => this.loadSprite(entry));

    await Promise.all(promises);
    console.log(`[SpriteManager] All assets preloaded: ${entries.length}`);
  }

  /**
   * 加载单个精灵
   */
  private static loadSprite(entry: SpriteEntry): Promise<HTMLImageElement> {
    const { key, file, width, height } = entry;

    // 检查是否已在加载中
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && cached.loaded) {
      return Promise.resolve(cached.image);
    }

    // 构建完整路径
    const src = buildSpritePath(key, file);
    if (!src) {
      return Promise.reject(new Error(`[SpriteManager] Invalid sprite path for key: ${key}`));
    }
    // 创建新的加载 Promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.width = width;
      img.height = height;

      img.onload = () => {
        this.cache.set(key, { image: img, config: entry, loaded: true });
        this.loadingPromises.delete(key);
        resolve(img);
      };

      img.onerror = () => {
        console.warn(`[SpriteManager] Failed to load: ${src}`);
        this.loadingPromises.delete(key);
        // 即使失败也缓存图片，避免重复尝试
        this.cache.set(key, { image: img, config: entry, loaded: false });
        resolve(img);
      };

      img.src = src;
    });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  /**
   * 获取缓存的图片
   */
  static getImage(key: SpriteKey): HTMLImageElement | undefined {
    return this.cache.get(key)?.image;
  }

  /**
   * 获取 sprite 配置
   */
  static getConfig(key: SpriteKey): SpriteEntry {
    return SPRITE_REGISTRY[key];
  }

  /**
   * 获取完整路径
   */
  static getPath(key: SpriteKey): string {
    const entry = SPRITE_REGISTRY[key];
    return buildSpritePath(key, entry.file);
  }

  /**
   * 检查图片是否已加载
   */
  static isLoaded(key: SpriteKey): boolean {
    const cached = this.cache.get(key);
    return cached?.loaded ?? false;
  }

  /**
   * 获取加载进度
   */
  static getLoadProgress(): { loaded: number; total: number } {
    const total = Object.keys(SPRITE_REGISTRY).length;
    const loaded = Array.from(this.cache.values()).filter(c => c.loaded).length;
    return { loaded, total };
  }

  /**
   * 清除缓存（主要用于测试）
   */
  static clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }
}
