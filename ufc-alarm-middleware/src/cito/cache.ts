interface Entry<T> {
  fetchedAt: number;
  value: T;
}

export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e || Date.now() - e.fetchedAt >= this.ttlMs) return undefined;
    return e.value;
  }

  /** Ignora o TTL — usado só pelo fail-soft do live status para devolver o
   * último valor bom conhecido mesmo expirado, quando a Cito falha. */
  getStale(key: string): T | undefined {
    return this.map.get(key)?.value;
  }

  set(key: string, value: T): void {
    this.map.set(key, { fetchedAt: Date.now(), value });
  }
}
