/**
 * 所有事件的基础接口
 * 使用 extends BaseEvent<'EventName'> 来定义新事件
 */
export interface BaseEvent<T extends string> {
  type: T;
}