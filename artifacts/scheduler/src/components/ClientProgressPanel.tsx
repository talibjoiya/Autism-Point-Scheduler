import { useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useCreateClientProgress,
  useCreateClientProgressForAll,
  useDeleteClientProgress,
  useGetClientProgress,
  useUpdateClientProgress,
  getGetClientProgressQueryKey,
} from "@workspace/api-client-react";
import type { ClientProgress, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

function errorMessage(error: unknown, fallback: string) {
  const candidate = error as { data?: { error?: string }; message?: string } | null;
  return candidate?.data?.error ?? candidate?.message ?? fallback;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-sky-600";
}

export function ClientProgressSummaryCell({ client }: { client: User }) {
  const { data, isLoading } = useGetClientProgress(client.id);

  if (isLoading) {
    return <div className="h-2 w-24 rounded-full bg-muted animate-pulse" />;
  }

  const score = data?.overallProgress ?? 0;
  return (
    <div className="min-w-[150px] space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {data?.items.length ?? 0} {data?.items.length === 1 ? "item" : "items"}
        </span>
        <span className={`font-bold ${scoreTone(score)}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}

function ProgressItemEditor({
  item,
  clientId,
  onDone,
}: {
  item: ClientProgress;
  clientId: number;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateClientProgress();
  const [itemName, setItemName] = useState(item.itemName);
  const [progress, setProgress] = useState(String(item.progress));
  const [notes, setNotes] = useState(item.notes ?? "");

  const save = async () => {
    const numericProgress = Number(progress);
    if (!itemName.trim() || !Number.isInteger(numericProgress) || numericProgress < 0 || numericProgress > 100) {
      toast({
        title: "Check the progress item",
        description: "Add a name and a whole-number score from 0 to 100.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: clientId,
        progressId: item.id,
        data: { itemName: itemName.trim(), progress: numericProgress, notes: notes.trim() || null },
      });
      await queryClient.invalidateQueries({ queryKey: getGetClientProgressQueryKey(clientId) });
      toast({ title: "Progress updated" });
      onDone();
    } catch (error) {
      toast({ title: "Could not update progress", description: errorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:grid-cols-[1fr_100px_1fr_auto] sm:items-end">
      <label className="space-y-1.5 text-sm font-medium">
        Item name
        <Input value={itemName} onChange={(event) => setItemName(event.target.value)} maxLength={80} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        Score
        <Input type="number" min={0} max={100} value={progress} onChange={(event) => setProgress(event.target.value)} />
      </label>
      <label className="space-y-1.5 text-sm font-medium">
        Notes
        <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note" />
      </label>
      <div className="flex gap-2">
        <Button size="icon" onClick={save} disabled={updateMutation.isPending} aria-label="Save progress item">
          <Save className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDone} aria-label="Cancel editing">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ClientProgressPanel({ client }: { client: User }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetClientProgress(client.id);
  const createMutation = useCreateClientProgress();
  const bulkCreateMutation = useCreateClientProgressForAll();
  const deleteMutation = useDeleteClientProgress();
  const [itemName, setItemName] = useState("");
  const [progress, setProgress] = useState("0");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const getNewItemData = () => {
    const numericProgress = Number(progress);
    if (!itemName.trim() || !Number.isInteger(numericProgress) || numericProgress < 0 || numericProgress > 100) {
      toast({
        title: "Check the new progress item",
        description: "Add a name and a whole-number score from 0 to 100.",
        variant: "destructive",
      });
      return null;
    }
    return { itemName: itemName.trim(), progress: numericProgress, notes: notes.trim() || undefined };
  };

  const addItem = async () => {
    const data = getNewItemData();
    if (!data) return;
    try {
      await createMutation.mutateAsync({
        id: client.id,
        data,
      });
      await queryClient.invalidateQueries({ queryKey: getGetClientProgressQueryKey(client.id) });
      setItemName("");
      setProgress("0");
      setNotes("");
      toast({ title: "Progress item added" });
    } catch (error) {
      toast({ title: "Could not add progress item", description: errorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  const addItemForAllClients = async () => {
    const data = getNewItemData();
    if (!data) return;
    try {
      const result = await bulkCreateMutation.mutateAsync({ data });
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/users/") && key.endsWith("/progress");
        },
      });
      setItemName("");
      setProgress("0");
      setNotes("");
      toast({
        title: "Progress area added for all clients",
        description: `${result.created} added${result.skipped ? `, ${result.skipped} already had it` : ""}.`,
      });
    } catch (error) {
      toast({ title: "Could not add for all clients", description: errorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  const removeItem = async (item: ClientProgress) => {
    if (!window.confirm(`Remove ${item.itemName} from ${client.name}'s progress?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: client.id, progressId: item.id });
      await queryClient.invalidateQueries({ queryKey: getGetClientProgressQueryKey(client.id) });
      toast({ title: "Progress item removed" });
    } catch (error) {
      toast({ title: "Could not remove progress item", description: errorMessage(error, "Please try again."), variant: "destructive" });
    }
  };

  const overall = data?.overallProgress ?? 0;

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-5 md:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Overall progress</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Average across {data?.items.length ?? 0} tracked {data?.items.length === 1 ? "area" : "areas"}
            </p>
          </div>
          <div className="flex min-w-[220px] items-center gap-3">
            <Progress value={overall} className="h-3" />
            <span className={`text-2xl font-bold tabular-nums ${scoreTone(overall)}`}>{overall}<span className="text-sm font-medium">/100</span></span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : (
          <div className="space-y-2">
            {data?.items.map((item) =>
              editingId === item.id ? (
                <ProgressItemEditor key={item.id} item={item} clientId={client.id} onDone={() => setEditingId(null)} />
              ) : (
                <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">{item.itemName}</p>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                    {item.notes ? <p className="mt-1.5 text-xs text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingId(item.id)} aria-label={`Edit ${item.itemName}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeItem(item)} disabled={deleteMutation.isPending} aria-label={`Remove ${item.itemName}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ),
            )}
            {!data?.items.length ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No progress areas yet. Add the first one below.
              </div>
            ) : null}
          </div>
        )}

        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Add progress area</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_100px_1fr_auto] sm:items-end">
            <label className="space-y-1.5 text-sm font-medium">
              Item name
              <Input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="e.g. Command following" maxLength={80} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Score
              <Input type="number" min={0} max={100} value={progress} onChange={(event) => setProgress(event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              Notes
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note" />
            </label>
            <div className="flex flex-col gap-2">
              <Button onClick={addItem} disabled={createMutation.isPending || bulkCreateMutation.isPending} className="gap-2">
                <Check className="h-4 w-4" />
                {createMutation.isPending ? "Adding..." : "Add for this client"}
              </Button>
              <Button onClick={addItemForAllClients} disabled={createMutation.isPending || bulkCreateMutation.isPending} variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                {bulkCreateMutation.isPending ? "Adding..." : "Add for all clients"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClientProgressToggle({
  client,
  open,
  onToggle,
}: {
  client: User;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={onToggle} aria-expanded={open}>
      <Activity className="h-4 w-4" />
      Progress
      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
  );
}