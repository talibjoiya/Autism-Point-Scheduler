import { Activity, Target } from "lucide-react";
import { useGetClientProgress } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";

function scoreTone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-sky-600";
}

export function ClientProgressDashboard({ client }: { client: User }) {
  const { data, isLoading } = useGetClientProgress(client.id);
  const overall = data?.overallProgress ?? 0;

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">My progress</h2>
          <p className="text-sm text-muted-foreground">Your current progress across tracked areas</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">OVERALL PROGRESS</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average of {data?.items.length ?? 0} tracked {data?.items.length === 1 ? "area" : "areas"}
            </p>
          </div>
          <span className={`text-3xl font-bold tabular-nums ${scoreTone(overall)}`}>
            {isLoading ? "—" : overall}
            <span className="text-sm font-medium text-muted-foreground">/100</span>
          </span>
        </div>
        <Progress value={isLoading ? 0 : overall} className="mt-4 h-3" />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : data?.items.length ? (
        <div className="space-y-2">
          {data.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{item.itemName}</p>
                <span className={`font-semibold tabular-nums ${scoreTone(item.progress)}`}>{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-2" />
              {item.notes ? <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <Target className="mx-auto mb-2 h-5 w-5" />
          No progress areas yet.
        </div>
      )}
    </section>
  );
}