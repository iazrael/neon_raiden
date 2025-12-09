export class CombatTag {
    setTag(entity: { tags?: Record<string, number> }, key: string, ttlMs: number) {
        const now = Date.now();
        if (!entity.tags) entity.tags = {};
        entity.tags[key] = now + ttlMs;
    }

    hasTag(entity: { tags?: Record<string, number> }, key: string): boolean {
        const now = Date.now();
        const exp = entity.tags?.[key];
        return exp !== undefined && exp > now;
    }

    cleanup(entity: { tags?: Record<string, number> }) {
        if (!entity.tags) return;
        const now = Date.now();
        Object.keys(entity.tags).forEach(k => {
            if ((entity.tags as Record<string, number>)[k] <= now) delete (entity.tags as Record<string, number>)[k];
        });
    }
}
