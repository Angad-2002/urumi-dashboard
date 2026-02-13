export type StoreEngine = "woocommerce" | "medusa";
export type StoreStatus = "provisioning" | "ready" | "failed" | "deleting";

export interface User {
  id: string;
  email: string;
}

export interface StoreResource {
  kind: string;
  name: string;
  status: "Running" | "Pending" | "Error" | "Bound" | "Active";
  replicas?: string;
  age: string;
}

export interface StoreEvent {
  timestamp: string;
  message: string;
  type: "Normal" | "Warning" | "Error";
}

export interface StoreQuotas {
  cpuUsed: string;
  cpuLimit: string;
  memUsed: string;
  memLimit: string;
  pvcUsed: string;
  pvcLimit: string;
}

export interface ProvisioningStep {
  label: string;
  completed: boolean;
  error?: boolean;
}

export interface Store {
  id: string;
  name: string;
  engine: StoreEngine;
  status: StoreStatus;
  url?: string;
  adminUrl?: string;
  createdAt: string;
  namespace: string;
  engineVersion?: string;
  replicas?: number;
  podsRunning?: number;
  podRestarts?: number;
  resources?: StoreResource[];
  events?: StoreEvent[];
  quotas?: StoreQuotas;
  provisioningSteps?: ProvisioningStep[];
  configYaml?: string;
  errorMessage?: string;
  provisioningStartedAt?: string;
  userId: string;
}
