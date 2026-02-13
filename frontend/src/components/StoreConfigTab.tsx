import { Store } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

function defaultManifest(store: Store): string {
  const name = store.namespace.replace(/^store-/, "") || store.name?.toLowerCase().replace(/\s+/g, "-") || "store";
  const ns = store.namespace;
  const engine = store.engine;
  const image = engine === "woocommerce" ? "wordpress:6.4-php8.2-apache" : "medusajs/medusa:latest";
  const port = engine === "woocommerce" ? 80 : 9000;
  return `# Store: ${store.name || name}
# Namespace: ${ns}
# Engine: ${engine}

apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  namespace: ${ns}
  labels:
    app.kubernetes.io/name: ${name}
    app.kubernetes.io/engine: ${engine}
spec:
  replicas: ${store.replicas ?? 2}
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
          image: ${image}
          ports:
            - containerPort: ${port}
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
              port: ${port}
            initialDelaySeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: ${port}
            initialDelaySeconds: 30
          envFrom:
            - secretRef:
                name: db-credentials
`;
}

export function StoreConfigTab({ store }: { store: Store }) {
  const [copied, setCopied] = useState(false);
  const yaml = store.configYaml ?? defaultManifest(store);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Kubernetes Manifest</h4>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="scrollbar-thin max-h-[400px] overflow-auto rounded-md border border-border bg-secondary/50 p-4">
        <pre className="font-mono text-xs leading-relaxed text-foreground/80 whitespace-pre">{yaml}</pre>
      </div>
    </div>
  );
}
