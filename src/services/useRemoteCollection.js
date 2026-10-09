import { useEffect, useMemo, useRef, useState } from "react";
import { apiCollection } from "./api.js";

const clone = (value) => JSON.parse(JSON.stringify(value));
const asArray = (value) => (Array.isArray(value) ? value : []);
const sameRecord = (left, right) => JSON.stringify(left) === JSON.stringify(right);

export function useRemoteCollection(resource, records, setRecords, { enabled = true } = {}) {
  const [ready, setReady] = useState(false);
  const localRecordsRef = useRef(asArray(records));
  const loadInProgressRef = useRef(false);
  const lastSyncedRef = useRef(null);
  const queueRef = useRef(Promise.resolve());
  const collection = useMemo(() => apiCollection(resource), [resource]);

  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    let retryTimer;

    const load = async () => {
      if (disposed) return;
      if (loadInProgressRef.current) {
        retryTimer = window.setTimeout(load, 100);
        return;
      }
      loadInProgressRef.current = true;
      try {
        const remote = await collection.list();
        if (disposed) return;
        const rows = asArray(remote);
        if (rows.length === 0 && localRecordsRef.current.length > 0) {
          const migrated = [];
          for (const record of localRecordsRef.current) {
            migrated.push(await collection.create(record));
          }
          if (disposed) return;
          lastSyncedRef.current = clone(migrated);
          localRecordsRef.current = [];
          setRecords(migrated);
        } else {
          lastSyncedRef.current = clone(rows);
          localRecordsRef.current = [];
          setRecords(rows);
        }
        setReady(true);
      } catch {
        if (!disposed) retryTimer = window.setTimeout(load, 20_000);
      } finally {
        loadInProgressRef.current = false;
      }
    };

    load();
    window.addEventListener("studyos-data-changed", load);
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener("studyos-data-changed", load);
    };
  }, [collection, enabled, resource, setRecords]);

  useEffect(() => {
    if (!ready || !enabled || !lastSyncedRef.current) return;
    const nextRecords = clone(asArray(records));
    queueRef.current = queueRef.current
      .then(async () => {
        const previous = lastSyncedRef.current || [];
        const before = new Map(previous.map((record) => [String(record.id), record]));
        const after = new Map(nextRecords.map((record) => [String(record.id), record]));

        for (const [id] of before) {
          if (!after.has(id)) await collection.remove(id);
        }
        for (const [id, record] of after) {
          const oldRecord = before.get(id);
          if (!oldRecord) await collection.create(record);
          else if (!sameRecord(oldRecord, record)) await collection.update(id, record);
        }
        lastSyncedRef.current = nextRecords;
      })
      .catch(() => {
        // The API layer reports failures to the application shell; later state changes retry the diff.
      });
  }, [collection, records, ready, enabled, resource, setRecords]);

  return { ready };
}
