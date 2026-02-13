import type { Store, StoreEngine } from "./types";

const getBaseUrl = () => import.meta.env.VITE_API_URL?.trim() || "";

function headers(userId?: string | null): HeadersInit {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (userId) h["X-User-Id"] = userId;
  return h;
}

/** Map API store (camelCase) to frontend Store type */
function toStore(raw: Record<string, unknown>): Store {
  return {
    id: String(raw.id),
    name: String(raw.name ?? ""),
    engine: (raw.engine as StoreEngine) || "woocommerce",
    status: (raw.status as Store["status"]) || "provisioning",
    url: raw.url != null ? String(raw.url) : undefined,
    adminUrl: raw.adminUrl != null ? String(raw.adminUrl) : undefined,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : new Date().toISOString(),
    namespace: String(raw.namespace ?? ""),
    engineVersion: raw.engineVersion != null ? String(raw.engineVersion) : undefined,
    replicas: typeof raw.replicas === "number" ? raw.replicas : undefined,
    podsRunning: typeof raw.podsRunning === "number" ? raw.podsRunning : undefined,
    podRestarts: typeof raw.podRestarts === "number" ? raw.podRestarts : undefined,
    resources: Array.isArray(raw.resources) ? (raw.resources as Store["resources"]) : undefined,
    events: Array.isArray(raw.events) ? (raw.events as Store["events"]) : undefined,
    quotas: (raw.quotas as Store["quotas"]) ?? undefined,
    provisioningSteps: Array.isArray(raw.provisioningSteps) ? (raw.provisioningSteps as Store["provisioningSteps"]) : undefined,
    configYaml: raw.configYaml != null ? String(raw.configYaml) : undefined,
    errorMessage: raw.errorMessage != null ? String(raw.errorMessage) : undefined,
    provisioningStartedAt: raw.provisioningStartedAt != null ? String(raw.provisioningStartedAt) : undefined,
    userId: raw.userId != null ? String(raw.userId) : "",
  };
}

export async function fetchStores(userId?: string | null): Promise<Store[]> {
  const base = getBaseUrl();
  if (!base) return [];
  const res = await fetch(`${base}/api/stores`, { headers: headers(userId) });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const data = (await res.json()) as { stores?: Record<string, unknown>[] };
  const list = data.stores ?? [];
  return list.map((s) => toStore(s));
}

export async function createStore(
  name: string,
  engine: StoreEngine,
  userId?: string | null
): Promise<Store> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL not configured");
  const res = await fetch(`${base}/api/stores`, {
    method: "POST",
    headers: headers(userId),
    body: JSON.stringify({ name, engine }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Create failed: ${res.status}`);
  }
  const data = (await res.json()) as { store?: Record<string, unknown> };
  return toStore(data.store ?? {});
}

export async function fetchStore(id: string, userId?: string | null): Promise<Store | null> {
  const base = getBaseUrl();
  if (!base) return null;
  const res = await fetch(`${base}/api/stores/${id}`, { headers: headers(userId) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  const data = (await res.json()) as { store?: Record<string, unknown> };
  return toStore(data.store ?? {});
}

export async function retryStore(
  id: string,
  userId?: string | null
): Promise<Store> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL not configured");
  const res = await fetch(`${base}/api/stores/${id}/retry`, {
    method: "POST",
    headers: headers(userId),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Retry failed: ${res.status}`);
  }
  const data = (await res.json()) as { store?: Record<string, unknown> };
  return toStore(data.store ?? {});
}

export async function deleteStore(
  id: string,
  userId?: string | null
): Promise<void> {
  const base = getBaseUrl();
  if (!base) throw new Error("API URL not configured");
  const res = await fetch(`${base}/api/stores/${id}`, {
    method: "DELETE",
    headers: headers(userId),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Delete failed: ${res.status}`);
  }
}

export function isApiConfigured(): boolean {
  return !!getBaseUrl();
}
