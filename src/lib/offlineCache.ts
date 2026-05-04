// Lightweight offline cache + write-queue using IndexedDB (idb-keyval).
// Use it to store last-known reads (e.g. jobs, customers) and queue
// mutations performed while offline. On reconnect, queue auto-flushes.

import { get, set, del, keys, createStore } from "idb-keyval";
import { supabase } from "@/services/supabase";

const cacheStore = createStore("rx-cache", "kv");
const queueStore = createStore("rx-queue", "kv");

// ---------- Read cache ----------
export async function cacheRead<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 60_000,
): Promise<T> {
  try {
    const cached = (await get(key, cacheStore)) as
      | { v: T; t: number }
      | undefined;
    const fresh = cached && Date.now() - cached.t < ttlMs;
    if (fresh) {
      // background refresh (stale-while-revalidate)
      loader()
        .then((v) => set(key, { v, t: Date.now() }, cacheStore))
        .catch(() => {});
      return cached.v;
    }
    const v = await loader();
    await set(key, { v, t: Date.now() }, cacheStore);
    return v;
  } catch (e) {
    // Offline → return stale if any
    const cached = (await get(key, cacheStore)) as { v: T } | undefined;
    if (cached) return cached.v;
    throw e;
  }
}

export async function clearCache(prefix?: string) {
  const all = await keys(cacheStore);
  for (const k of all) {
    if (!prefix || (typeof k === "string" && k.startsWith(prefix))) {
      await del(k, cacheStore);
    }
  }
}

// ---------- Write queue ----------
export type QueuedOp = {
  id: string;
  table: string;
  op: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  match?: Record<string, unknown>;
  ts: number;
};

export async function enqueue(op: Omit<QueuedOp, "id" | "ts">) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const item: QueuedOp = { ...op, id, ts: Date.now() };
  await set(id, item, queueStore);
  scheduleFlush();
  return item;
}

export async function pendingCount(): Promise<number> {
  return (await keys(queueStore)).length;
}

let flushing = false;
let scheduled: number | null = null;
function scheduleFlush() {
  if (scheduled) return;
  scheduled = window.setTimeout(() => {
    scheduled = null;
    flushQueue();
  }, 500);
}

export async function flushQueue() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const ks = await keys(queueStore);
    for (const k of ks) {
      const item = (await get(k, queueStore)) as QueuedOp | undefined;
      if (!item) continue;
      try {
        const tbl = (supabase as any).from(item.table);
        let res;
        if (item.op === "insert") res = await tbl.insert(item.payload);
        else if (item.op === "update")
          res = await tbl.update(item.payload).match(item.match || {});
        else res = await tbl.delete().match(item.match || {});
        if (res.error) throw res.error;
        await del(k, queueStore);
      } catch (e) {
        console.warn("Queue item failed, will retry:", e);
        // stop on first failure to preserve order
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

// Auto-flush on reconnect
if (typeof window !== "undefined") {
  window.addEventListener("online", () => flushQueue());
  // initial attempt on load
  setTimeout(() => flushQueue(), 1500);
}
