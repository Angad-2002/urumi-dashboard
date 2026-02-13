import { Store } from "./types";

const readySteps = [
  { label: "Namespace created", completed: true },
  { label: "Secrets generated", completed: true },
  { label: "Database ready", completed: true },
  { label: "App deployed", completed: true },
  { label: "Ingress ready", completed: true },
];

const provisioningSteps = [
  { label: "Namespace created", completed: true },
  { label: "Secrets generated", completed: true },
  { label: "Database ready", completed: false },
  { label: "App deployed", completed: false },
  { label: "Ingress ready", completed: false },
];

const failedSteps = [
  { label: "Namespace created", completed: true },
  { label: "Secrets generated", completed: true },
  { label: "Database ready", completed: true },
  { label: "App deployed", completed: false, error: true },
  { label: "Ingress ready", completed: false },
];

const readyResources = [
  { kind: "Deployment", name: "app", status: "Running" as const, replicas: "2/2", age: "3d" },
  { kind: "StatefulSet", name: "postgres", status: "Running" as const, replicas: "1/1", age: "3d" },
  { kind: "Service", name: "store-svc", status: "Active" as const, age: "3d" },
  { kind: "Ingress", name: "store-ing", status: "Active" as const, age: "3d" },
  { kind: "PVC", name: "postgres-data", status: "Bound" as const, age: "3d" },
  { kind: "Secret", name: "db-credentials", status: "Active" as const, age: "3d" },
];

const readyEvents = [
  { timestamp: "12:01:03", message: "Namespace store-acme-electronics created", type: "Normal" as const },
  { timestamp: "12:01:05", message: "Secret db-credentials created", type: "Normal" as const },
  { timestamp: "12:01:12", message: "StatefulSet postgres created (1 replica)", type: "Normal" as const },
  { timestamp: "12:02:30", message: "Pod postgres-0 running", type: "Normal" as const },
  { timestamp: "12:02:45", message: "Deployment app created (2 replicas)", type: "Normal" as const },
  { timestamp: "12:03:10", message: "Pod app-7f8b9-xk2m1 running", type: "Normal" as const },
  { timestamp: "12:03:12", message: "Pod app-7f8b9-lp9z4 running", type: "Normal" as const },
  { timestamp: "12:03:20", message: "Service store-svc created", type: "Normal" as const },
  { timestamp: "12:03:25", message: "Ingress store-ing created → acme-electronics.local", type: "Normal" as const },
  { timestamp: "12:03:30", message: "Store ready", type: "Normal" as const },
];

const failedEvents = [
  { timestamp: "14:01:03", message: "Namespace store-tech-hub created", type: "Normal" as const },
  { timestamp: "14:01:05", message: "Secret db-credentials created", type: "Normal" as const },
  { timestamp: "14:01:12", message: "StatefulSet postgres created", type: "Normal" as const },
  { timestamp: "14:02:30", message: "Pod postgres-0 running", type: "Normal" as const },
  { timestamp: "14:02:45", message: "Deployment app created (2 replicas)", type: "Normal" as const },
  { timestamp: "14:03:50", message: "Pod app-3a1c9-mn8k2 CrashLoopBackOff: OOMKilled", type: "Error" as const },
  { timestamp: "14:04:10", message: "Provisioning failed: deployment not ready after 120s timeout", type: "Error" as const },
];

const makeYaml = (name: string, ns: string, engine: string) => `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/engine: ${engine}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
        - name: ${engine}
          image: ${engine === "woocommerce" ? "wordpress:6.4-php8.2-apache" : "medusajs/medusa:latest"}
          ports:
            - containerPort: ${engine === "woocommerce" ? 80 : 9000}
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: ${engine === "woocommerce" ? 80 : 9000}
            initialDelaySeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: ${engine === "woocommerce" ? 80 : 9000}
            initialDelaySeconds: 30
          envFrom:
            - secretRef:
                name: db-credentials`;

const MOCK_USER_ID = "user-demoexamplecom";

export const mockStores: Store[] = [
  {
    id: "store-1",
    name: "Acme Electronics",
    engine: "woocommerce",
    status: "ready",
    url: "http://acme-electronics.local",
    adminUrl: "http://acme-electronics.local/wp-admin",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    namespace: "store-acme-electronics",
    engineVersion: "6.4.2",
    replicas: 2,
    podsRunning: 2,
    podRestarts: 0,
    provisioningSteps: readySteps,
    resources: readyResources,
    events: readyEvents,
    quotas: { cpuUsed: "120m", cpuLimit: "500m", memUsed: "180Mi", memLimit: "512Mi", pvcUsed: "2Gi", pvcLimit: "5Gi" },
    configYaml: makeYaml("acme-electronics", "store-acme-electronics", "woocommerce"),
    userId: MOCK_USER_ID,
  },
  {
    id: "store-2",
    name: "Urban Threads",
    engine: "medusa",
    status: "ready",
    url: "http://urban-threads.local",
    adminUrl: "http://urban-threads.local:9000/app",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    namespace: "store-urban-threads",
    engineVersion: "1.20.0",
    replicas: 2,
    podsRunning: 2,
    podRestarts: 1,
    provisioningSteps: readySteps,
    resources: readyResources.map((r) => ({ ...r, age: "1d" })),
    events: readyEvents.map((e) => ({ ...e, message: e.message.replace("acme-electronics", "urban-threads") })),
    quotas: { cpuUsed: "90m", cpuLimit: "500m", memUsed: "210Mi", memLimit: "512Mi", pvcUsed: "1Gi", pvcLimit: "5Gi" },
    configYaml: makeYaml("urban-threads", "store-urban-threads", "medusa"),
    userId: MOCK_USER_ID,
  },
  {
    id: "store-3",
    name: "Fresh Grocers",
    engine: "woocommerce",
    status: "provisioning",
    createdAt: new Date(Date.now() - 120000).toISOString(),
    namespace: "store-fresh-grocers",
    engineVersion: "6.4.2",
    replicas: 2,
    podsRunning: 0,
    podRestarts: 0,
    provisioningSteps: provisioningSteps,
    resources: [
      { kind: "Deployment", name: "app", status: "Pending" as const, replicas: "0/2", age: "2m" },
      { kind: "StatefulSet", name: "postgres", status: "Pending" as const, replicas: "0/1", age: "2m" },
    ],
    events: [
      { timestamp: "15:30:03", message: "Namespace store-fresh-grocers created", type: "Normal" as const },
      { timestamp: "15:30:05", message: "Secret db-credentials created", type: "Normal" as const },
      { timestamp: "15:30:12", message: "Waiting for database to be ready...", type: "Normal" as const },
    ],
    quotas: { cpuUsed: "0m", cpuLimit: "500m", memUsed: "0Mi", memLimit: "512Mi", pvcUsed: "0Gi", pvcLimit: "5Gi" },
    configYaml: makeYaml("fresh-grocers", "store-fresh-grocers", "woocommerce"),
    userId: MOCK_USER_ID,
  },
  {
    id: "store-4",
    name: "Tech Hub",
    engine: "medusa",
    status: "failed",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    namespace: "store-tech-hub",
    engineVersion: "1.20.0",
    replicas: 2,
    podsRunning: 0,
    podRestarts: 5,
    provisioningSteps: failedSteps,
    resources: [
      { kind: "Deployment", name: "app", status: "Error" as const, replicas: "0/2", age: "1h" },
      { kind: "StatefulSet", name: "postgres", status: "Running" as const, replicas: "1/1", age: "1h" },
      { kind: "Service", name: "store-svc", status: "Active" as const, age: "1h" },
      { kind: "PVC", name: "postgres-data", status: "Bound" as const, age: "1h" },
      { kind: "Secret", name: "db-credentials", status: "Active" as const, age: "1h" },
    ],
    events: failedEvents,
    quotas: { cpuUsed: "50m", cpuLimit: "500m", memUsed: "90Mi", memLimit: "512Mi", pvcUsed: "1Gi", pvcLimit: "5Gi" },
    configYaml: makeYaml("tech-hub", "store-tech-hub", "medusa"),
    errorMessage: "Postgres readiness probe timeout — pod app-3a1c9-mn8k2 OOMKilled after 120s",
    userId: MOCK_USER_ID,
  },
];

// Generate more stores for pagination demo
const extraEngines: Array<"woocommerce" | "medusa"> = ["woocommerce", "medusa"];
const extraNames = [
  "Pixel Market", "Cloud Cart", "Nova Shop", "Byte Store", "Flux Commerce",
  "Edge Retail", "Prime Goods", "Meta Mart", "Nexus Trade", "Core Supply",
  "Drift Shop", "Apex Store", "Lunar Market", "Helix Commerce", "Vault Goods",
  "Prism Retail", "Atlas Mart", "Sigma Shop", "Zenith Store", "Orbit Market",
];

for (let i = 0; i < extraNames.length; i++) {
  const name = extraNames[i];
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const engine = extraEngines[i % 2];
  const status = i < 16 ? "ready" : i < 18 ? "provisioning" : "failed";
  mockStores.push({
    id: `store-extra-${i}`,
    name,
    engine,
    status: status as any,
    url: status === "ready" ? `http://${slug}.local` : undefined,
    adminUrl: status === "ready" ? `http://${slug}.local/admin` : undefined,
    createdAt: new Date(Date.now() - 86400000 * (i + 1)).toISOString(),
    namespace: `store-${slug}`,
    engineVersion: engine === "woocommerce" ? "6.4.2" : "1.20.0",
    replicas: 2,
    podsRunning: status === "ready" ? 2 : 0,
    podRestarts: status === "failed" ? 3 : 0,
    provisioningSteps: status === "ready" ? readySteps : status === "provisioning" ? provisioningSteps : failedSteps,
    resources: status === "ready" ? readyResources : [],
    events: status === "ready" ? readyEvents : [],
    quotas: { cpuUsed: "100m", cpuLimit: "500m", memUsed: "150Mi", memLimit: "512Mi", pvcUsed: "1Gi", pvcLimit: "5Gi" },
    configYaml: makeYaml(slug, `store-${slug}`, engine),
    errorMessage: status === "failed" ? "Image pull backoff — registry rate limit exceeded" : undefined,
    userId: MOCK_USER_ID,
  });
}
