type Handler<T> = (payload: T) => void | Promise<void>;

export class EventBus<EventMap extends Record<string, any>> {
  private listeners: Map<keyof EventMap, Set<Handler<any>>> = new Map();

  subscribe<K extends keyof EventMap>(type: K, handler: Handler<EventMap[K]>): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(handler as Handler<any>);
    this.listeners.set(type, set);
    return () => {
      const s = this.listeners.get(type);
      if (!s) return;
      s.delete(handler as Handler<any>);
      if (s.size === 0) this.listeners.delete(type);
    };
  }

  async publish<K extends keyof EventMap>(type: K, payload: EventMap[K]): Promise<void> {
    const set = this.listeners.get(type);
    if (!set || set.size === 0) return;
    for (const h of Array.from(set)) {
      const res = h(payload);
      if (res instanceof Promise) await res;
    }
  }
}

