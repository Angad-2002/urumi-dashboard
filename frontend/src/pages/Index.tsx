import { useState, useMemo, useEffect } from "react";
import { Store, StoreEngine, StoreStatus } from "@/lib/types";
import { mockStores } from "@/lib/mock-data";
import * as api from "@/lib/api";
import { StoreRow } from "@/components/StoreRow";
import { StatsBar } from "@/components/StatsBar";
import { CreateStoreDialog } from "@/components/CreateStoreDialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { StoreSidePanel } from "@/components/StoreSidePanel";
import { SearchAndFilterBar, SortOption } from "@/components/SearchAndFilterBar";
import { PaginationControls } from "@/components/PaginationControls";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { AuthDialog } from "@/components/AuthDialog";
import { ProfilePopover } from "@/components/ProfilePopover";
import { Button } from "@/components/ui/button";
import { Plus, Hexagon, Rocket, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MAX_STORES_PER_USER = 100;

const Index = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const useBackend = api.isApiConfigured();
  const [stores, setStores] = useState<Store[]>(useBackend ? [] : mockStores);
  const [storesLoading, setStoresLoading] = useState(useBackend);
  const [createOpen, setCreateOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<Store | null>(null);
  const [panelStoreDetail, setPanelStoreDetail] = useState<Store | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ names: string[]; ids: string[] } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const POLL_INTERVAL_MS = 4000;

  // Search, filter, sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StoreStatus[]>([]);
  const [engineFilter, setEngineFilter] = useState<StoreEngine[]>([]);
  const [sort, setSort] = useState<SortOption>("newest");
  const [statsFilter, setStatsFilter] = useState<StoreStatus | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Per-user store count
  const userStoreCount = user ? stores.filter((s) => s.userId === user.id && s.status !== "deleting").length : 0;
  const limitReached = userStoreCount >= MAX_STORES_PER_USER;

  // Load stores from backend when API is configured and user is set
  useEffect(() => {
    if (!useBackend || !user) {
      if (!useBackend) setStoresLoading(false);
      return;
    }
    let cancelled = false;
    setStoresLoading(true);
    api.fetchStores(user.id).then((list) => {
      if (!cancelled) {
        setStores(list);
        setStoresLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setStoresLoading(false);
    });
    return () => { cancelled = true; };
  }, [useBackend, user?.id]);

  // Fetch store detail when side panel opens; poll for real-time updates (resources, events, status)
  useEffect(() => {
    if (!selectedPanel || !useBackend || !user) {
      setPanelStoreDetail(null);
      return;
    }
    const id = selectedPanel.id;
    let cancelled = false;

    const fetchDetail = () => {
      api.fetchStore(id, user.id).then((store) => {
        if (!cancelled && selectedPanel?.id === id) {
          setPanelStoreDetail(store);
          setStores((prev) => prev.map((s) => (s.id === store.id ? store : s)));
        }
      }).catch(() => { /* keep previous data on error */ });
    };

    fetchDetail();
    const interval = setInterval(fetchDetail, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      setPanelStoreDetail(null);
    };
  }, [selectedPanel?.id, useBackend, user?.id]);

  const handleCreate = async (name: string, engine: StoreEngine) => {
    if (!user || limitReached) return;
    if (useBackend) {
      try {
        const newStore = await api.createStore(name, engine, user.id);
        setStores((prev) => [newStore, ...prev]);
        toast({ title: "Store queued", description: `${name} is being provisioned.` });
      } catch (e) {
        toast({ title: "Create failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      }
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newStore: Store = {
      id: `store-${Date.now()}`,
      name,
      engine,
      status: "provisioning",
      createdAt: new Date().toISOString(),
      namespace: `store-${slug}`,
      provisioningStartedAt: new Date().toISOString(),
      provisioningSteps: [
        { label: "Namespace created", completed: false },
        { label: "Secrets generated", completed: false },
        { label: "Database ready", completed: false },
        { label: "App deployed", completed: false },
        { label: "Ingress ready", completed: false },
      ],
      resources: [],
      events: [{ timestamp: new Date().toLocaleTimeString().slice(0, 5), message: "Store creation initiated", type: "Normal" }],
      quotas: { cpuUsed: "0m", cpuLimit: "500m", memUsed: "0Mi", memLimit: "512Mi", pvcUsed: "0Gi", pvcLimit: "5Gi" },
      userId: user.id,
    };
    setStores((prev) => [newStore, ...prev]);
    toast({ title: "Store queued", description: `${name} is being provisioned.` });
    setTimeout(() => {
      setStores((prev) =>
        prev.map((s) =>
          s.id === newStore.id
            ? { ...s, status: "ready", url: `http://${slug}.local`, adminUrl: `http://${slug}.local/admin` }
            : s
        )
      );
    }, 5000);
  };

  const handleRetry = async (id: string) => {
    if (useBackend) {
      try {
        const updated = await api.retryStore(id, user?.id ?? null);
        setStores((prev) => prev.map((s) => (s.id === id ? updated : s)));
        toast({ title: "Retry triggered", description: "Re-provisioning store..." });
      } catch (e) {
        toast({ title: "Retry failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      }
      return;
    }
    setStores((prev) =>
      prev.map((s) => {
        if (s.id !== id || s.status !== "failed") return s;
        return {
          ...s,
          status: "provisioning" as const,
          errorMessage: undefined,
          provisioningStartedAt: new Date().toISOString(),
          provisioningSteps: s.provisioningSteps?.map((step) => ({ ...step, completed: false, error: false })),
          events: [...(s.events ?? []), { timestamp: new Date().toLocaleTimeString().slice(0, 5), message: "Retry initiated", type: "Normal" as const }],
        };
      })
    );
    toast({ title: "Retry triggered", description: "Re-provisioning store..." });
    setTimeout(() => {
      setStores((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const slug = s.namespace.replace("store-", "");
          return {
            ...s,
            status: "ready" as const,
            url: `http://${slug}.local`,
            adminUrl: `http://${slug}.local/admin`,
            provisioningSteps: s.provisioningSteps?.map((step) => ({ ...step, completed: true, error: false })),
          };
        })
      );
    }, 4000);
  };

  const handleDeleteRequest = (id: string) => {
    const store = stores.find((s) => s.id === id);
    if (store) setDeleteTarget({ names: [store.name], ids: [store.id] });
  };

  const handleBulkDelete = () => {
    const selected = stores.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return;
    setDeleteTarget({ names: selected.map((s) => s.name), ids: selected.map((s) => s.id) });
  };

  const handleBulkRetry = () => {
    const failedSelected = stores.filter((s) => selectedIds.has(s.id) && s.status === "failed");
    failedSelected.forEach((s) => handleRetry(s.id));
    toast({ title: `Retry triggered for ${failedSelected.length} failed store(s)` });
    setSelectedIds(new Set());
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const ids = deleteTarget.ids;
    setStores((prev) => prev.map((s) => (ids.includes(s.id) ? { ...s, status: "deleting" as const } : s)));
    toast({ title: `${ids.length} store(s) deleting`, description: "Resources are being cleaned up." });
    if (selectedPanel && ids.includes(selectedPanel.id)) setSelectedPanel(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setDeleteTarget(null);
    if (useBackend) {
      await Promise.allSettled(ids.map((id) => api.deleteStore(id, user?.id ?? null)));
      setStores((prev) => prev.filter((s) => !ids.includes(s.id)));
    } else {
      setTimeout(() => {
        setStores((prev) => prev.filter((s) => !ids.includes(s.id)));
      }, 2000);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Combine stats filter with filter bar
  const effectiveStatusFilter = statsFilter ? [statsFilter] : statusFilter;

  const filtered = useMemo(() => {
    let result = stores;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.namespace.toLowerCase().includes(q) ||
          s.engine.includes(q) ||
          s.status.includes(q)
      );
    }
    if (effectiveStatusFilter.length > 0) {
      result = result.filter((s) => effectiveStatusFilter.includes(s.status));
    }
    if (engineFilter.length > 0) {
      result = result.filter((s) => engineFilter.includes(s.engine));
    }
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name": return a.name.localeCompare(b.name);
        case "status": return a.status.localeCompare(b.status);
        default: return 0;
      }
    });
    return result;
  }, [stores, search, effectiveStatusFilter, engineFilter, sort]);

  const totalFiltered = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const panelStore = selectedPanel
    ? (useBackend && panelStoreDetail != null ? panelStoreDetail : stores.find((s) => s.id === selectedPanel.id) ?? null)
    : null;

  const hasFailedInSelection = stores.some((s) => selectedIds.has(s.id) && s.status === "failed");

  // If not logged in, show auth prompt
  const failedInPage = paginated.filter((s) => s.status === "failed").length;
  const failedTotal = filtered.filter((s) => s.status === "failed").length;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Hexagon className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Store Orchestrator</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            Sign in to manage your ecommerce stores on Kubernetes.
          </p>
          <Button onClick={() => setAuthOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            Sign In
          </Button>
        </div>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuth={signIn} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Hexagon className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Store Orchestrator</h1>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={() => setCreateOpen(true)}
                    size="sm"
                    disabled={limitReached}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Store
                  </Button>
                </span>
              </TooltipTrigger>
              {limitReached && (
                <TooltipContent className="border-border bg-card text-foreground">
                  <p className="text-xs">Store limit reached ({userStoreCount}/{MAX_STORES_PER_USER}). Delete a store to create another.</p>
                </TooltipContent>
              )}
            </Tooltip>
            <ProfilePopover storeCount={userStoreCount} maxStores={MAX_STORES_PER_USER} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {storesLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading stores…
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <StatsBar stores={stores} activeFilter={statsFilter} onFilterClick={(f) => { setStatsFilter(f); setPage(1); }} />
        </motion.div>

        <div className="mt-6">
          <SearchAndFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            statusFilter={statusFilter}
            onStatusFilterChange={(v) => { setStatusFilter(v); setStatsFilter(null); setPage(1); }}
            engineFilter={engineFilter}
            onEngineFilterChange={(v) => { setEngineFilter(v); setPage(1); }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        <div className="mt-4">
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <div className="mb-3">
                <BulkActionsToolbar
                  count={selectedIds.size}
                  pageCount={paginated.length}
                  totalCount={filtered.length}
                  hasFailedInSelection={hasFailedInSelection}
                  failedInPageCount={failedInPage}
                  failedTotalCount={failedTotal}
                  onDeleteSelected={handleBulkDelete}
                  onRetryFailed={handleBulkRetry}
                  onClearSelection={() => setSelectedIds(new Set())}
                  onSelectAllInPage={() => {
                    setSelectedIds(new Set(paginated.map((s) => s.id)));
                  }}
                  onSelectAllAcrossPages={() => {
                    setSelectedIds(new Set(filtered.map((s) => s.id)));
                  }}
                  onRetryAllInPage={() => {
                    paginated.filter((s) => s.status === "failed").forEach((s) => handleRetry(s.id));
                    toast({ title: `Retry triggered for ${failedInPage} failed store(s) in page` });
                    setSelectedIds(new Set());
                  }}
                  onRetryAllAcrossPages={() => {
                    filtered.filter((s) => s.status === "failed").forEach((s) => handleRetry(s.id));
                    toast({ title: `Retry triggered for ${failedTotal} failed store(s)` });
                    setSelectedIds(new Set());
                  }}
                />
              </div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {paginated.map((store) => (
                <StoreRow
                  key={store.id}
                  store={store}
                  selected={selectedIds.has(store.id)}
                  onSelect={toggleSelect}
                  onClick={() => setSelectedPanel(store)}
                  onDelete={handleDeleteRequest}
                  onRetry={handleRetry}
                />
              ))}
            </AnimatePresence>
            {totalFiltered === 0 && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
                  <Rocket className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No stores yet</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Create your first store to provision an ecommerce engine on Kubernetes.
                </p>
                <Button onClick={() => setCreateOpen(true)} size="sm" className="mt-4 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-3.5 w-3.5" />
                  New Store
                </Button>
              </div>
            )}
          </div>

          {totalFiltered > 0 && (
            <PaginationControls page={page} pageSize={pageSize} total={totalFiltered} onPageChange={setPage} onPageSizeChange={setPageSize} />
          )}
        </div>
      </main>

      {/* Dialogs & Panels */}
      <CreateStoreDialog open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
      <StoreSidePanel
        store={panelStore}
        isLive={!!(useBackend && selectedPanel)}
        onClose={() => setSelectedPanel(null)}
        onDelete={handleDeleteRequest}
        onRetry={handleRetry}
      />
      {deleteTarget && (
        <DeleteConfirmationModal
          storeName={deleteTarget.names.length === 1 ? deleteTarget.names[0] : `${deleteTarget.names.length} stores`}
          open={!!deleteTarget}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuth={signIn} />
    </div>
  );
};

export default Index;
