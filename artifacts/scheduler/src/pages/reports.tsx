import { useMemo, useState } from "react";
import { useListTimeslots, useListUsers, useListServices } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  CalendarCheck, CalendarX, Clock, TrendingUp, Users, UserSquare2, Briefcase, BarChart2,
} from "lucide-react";
import { formatDateShort } from "@/lib/locale";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  done: "#10b981",
  cancelled: "#ef4444",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: number | string; icon: any; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

export default function Reports() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <ReportsContent />
      </Layout>
    </RequireAuth>
  );
}

function ReportsContent() {
  const [range, setRange] = useState("30");

  const { data: allTimeslots = [] } = useListTimeslots();
  const { data: allUsers = [] } = useListUsers();
  const { data: allServices = [] } = useListServices();

  const professionals = allUsers.filter((u) => u.role === "professional");
  const clients = allUsers.filter((u) => u.role === "client");

  const timeslots = useMemo(() => {
    if (range === "all") return allTimeslots;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(range));
    return allTimeslots.filter((s) => new Date(s.startTime) >= cutoff);
  }, [allTimeslots, range]);

  const scheduled = timeslots.filter((s) => s.status === "scheduled").length;
  const done = timeslots.filter((s) => s.status === "done").length;
  const cancelled = timeslots.filter((s) => s.status === "cancelled").length;
  const completionRate = timeslots.length > 0 ? Math.round((done / timeslots.length) * 100) : 0;

  const statusPieData = [
    { name: "Scheduled", value: scheduled, color: STATUS_COLORS.scheduled },
    { name: "Completed", value: done, color: STATUS_COLORS.done },
    { name: "Cancelled", value: cancelled, color: STATUS_COLORS.cancelled },
  ].filter((d) => d.value > 0);

  const byProfessional = useMemo(() => {
    const map: Record<number, { name: string; scheduled: number; done: number; cancelled: number }> = {};
    for (const p of professionals) {
      map[p.id] = { name: p.name.split(" ")[0], scheduled: 0, done: 0, cancelled: 0 };
    }
    for (const s of timeslots) {
      if (map[s.professionalId]) {
        map[s.professionalId][s.status as "scheduled" | "done" | "cancelled"]++;
      }
    }
    return Object.values(map)
      .map((r) => ({ ...r, total: r.scheduled + r.done + r.cancelled }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [timeslots, professionals]);

  const byService = useMemo(() => {
    const map: Record<number, { name: string; count: number }> = {};
    for (const svc of allServices) {
      map[svc.id] = { name: svc.name, count: 0 };
    }
    for (const s of timeslots) {
      if (map[s.serviceId]) map[s.serviceId].count++;
    }
    return Object.values(map)
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [timeslots, allServices]);

  const dailyTrend = useMemo(() => {
    const days = range === "all" ? 30 : Number(range);
    const buckets: Record<string, { date: string; scheduled: number; done: number; cancelled: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: formatDateShort(new Date(key)), scheduled: 0, done: 0, cancelled: 0 };
    }
    for (const s of timeslots) {
      const key = new Date(s.startTime).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key][s.status as "scheduled" | "done" | "cancelled"]++;
      }
    }
    return Object.values(buckets);
  }, [timeslots, range]);

  const byClient = useMemo(() => {
    const map: Record<number, { name: string; count: number }> = {};
    for (const c of clients) map[c.id] = { name: c.name, count: 0 };
    for (const s of timeslots) {
      if (map[s.clientId]) map[s.clientId].count++;
    }
    return Object.values(map)
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [timeslots, clients]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-6 h-6" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Insights across appointments, professionals, and services.
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={timeslots.length} icon={CalendarCheck}
          color="bg-blue-100 text-blue-600" />
        <StatCard label="Completed" value={done} icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600" sub={`${completionRate}% completion rate`} />
        <StatCard label="Scheduled" value={scheduled} icon={Clock}
          color="bg-sky-100 text-sky-600" />
        <StatCard label="Cancelled" value={cancelled} icon={CalendarX}
          color="bg-red-100 text-red-600" />
      </div>

      {/* Row: Status pie + Daily trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Appointment Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, "appointments"]} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Appointment Trend</CardTitle>
            <CardDescription>Appointments per day in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconSize={8} />
                <Line type="monotone" dataKey="done" name="Completed" stroke={STATUS_COLORS.done} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="scheduled" name="Scheduled" stroke={STATUS_COLORS.scheduled} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke={STATUS_COLORS.cancelled} strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row: By professional + By service */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserSquare2 className="w-4 h-4" /> Appointments by Professional
            </CardTitle>
            <CardDescription>Breakdown per professional</CardDescription>
          </CardHeader>
          <CardContent>
            {byProfessional.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, byProfessional.length * 46)}>
                <BarChart data={byProfessional} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={72} />
                  <Tooltip />
                  <Legend iconSize={8} />
                  <Bar dataKey="done" name="Completed" stackId="a" fill={STATUS_COLORS.done} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill={STATUS_COLORS.scheduled} />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Appointments by Service
            </CardTitle>
            <CardDescription>Most booked services</CardDescription>
          </CardHeader>
          <CardContent>
            {byService.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, byService.length * 46)}>
                <BarChart data={byService} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  {byService.map((_, i) => (
                    <Bar key={i} dataKey="count" name="Appointments" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clients table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Top Clients by Appointments
          </CardTitle>
          <CardDescription>Clients with the most appointments in this period</CardDescription>
        </CardHeader>
        <CardContent>
          {byClient.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No appointment data for this period.</p>
          ) : (
            <div className="space-y-3">
              {byClient.map((c, i) => {
                const pct = timeslots.length > 0 ? Math.round((c.count / timeslots.length) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {c.count} appt{c.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">{pct}%</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <UserSquare2 className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{professionals.length}</p>
              <p className="text-sm text-muted-foreground">Professionals on platform</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Clients on platform</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{allServices.length}</p>
              <p className="text-sm text-muted-foreground">Services available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
