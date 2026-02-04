// src/engine/storage/base/IStorageBackend.ts

/**
 * 存储操作结果
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 存储后端抽象接口
 * 所有存储后端必须实现此接口
 */
export interface IStorageBackend {
  /**
   * 读取数据
   * @param key 存储键名
   */
  get<T>(key: string): Promise<StorageResult<T>>;

  /**
   * 写入数据
   * @param key 存储键名
   * @param value 要存储的值（会被序列化为JSON）
   */
  set<T>(key: string, value: T): Promise<StorageResult<void>>;

  /**
   * 删除数据
   * @param key 存储键名
   */
  remove(key: string): Promise<StorageResult<void>>;

  /**
   * 清空所有数据
   */
  clear(): Promise<StorageResult<void>>;

  /**
   * 检查是否支持该存储后端
   */
  isAvailable(): boolean;
}
