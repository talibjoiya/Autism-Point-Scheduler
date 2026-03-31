import { useMemo } from "react";
import { Link } from "wouter";
import { formatFullDate, formatDateShort, formatDayOfWeek, formatDateTime, isSamePKTDay, subDaysPKT } from "@/lib/locale";
import {
  useGetStatsOverview,
  useListTimeslots,
  useListUsers,
  useListServices,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth, useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Users,
  UserSquare2,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

export default function Dashboard() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <DashboardContent />
      </Layout>
    </RequireAuth>
  );
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3b82f6",
  done: "#10b981",
  cancelled: "#ef4444",
};

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  delta,
  link,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  delta?: string;
  link?: string;
}) {
  const inner = (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 border border-border cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
            {delta && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                {delta}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 ${iconBg} opacity-60`} />
      </CardContent>
    </Card>
  );
  return link ? <Link href={link}>{inner}</Link> : inner;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.stroke }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function DashboardContent() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetStatsOverview({
    query: { refetchInterval: 30000 },
  });
  const { data: timeslots = [], isLoading: slotsLoading } = useListTimeslots(undefined, {
    query: { refetchInterval: 30000 },
  });
  const { data: users = [] } = useListUsers();
  const { data: services = [] } = useListServices();

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDaysPKT(new Date(), 6 - i);
      const daySlots = timeslots.filter((s) => isSamePKTDay(new Date(s.startTime), day));
      return {
        day: formatDayOfWeek(day),
        date: formatDateShort(day),
        scheduled: daySlots.filter((s) => s.status === "scheduled").length,
        done: daySlots.filter((s) => s.status === "done").length,
        cancelled: daySlots.filter((s) => s.status === "cancelled").length,
        total: daySlots.length,
      };
    });
  }, [timeslots]);

  const statusDistribution = useMemo(() => {
    const total = timeslots.length || 1;
    return [
      { name: "Scheduled", value: timeslots.filter((s) => s.status === "scheduled").length, color: STATUS_COLORS.scheduled },
      { name: "Done", value: timeslots.filter((s) => s.status === "done").length, color: STATUS_COLORS.done },
      { name: "Cancelled", value: timeslots.filter((s) => s.status === "cancelled").length, color: STATUS_COLORS.cancelled },
    ];
  }, [timeslots]);

  const professionalLoad = useMemo(() => {
    const profMap: Record<string, { name: string; scheduled: number; done: number; cancelled: number }> = {};
    timeslots.forEach((s) => {
      if (!profMap[s.professionalId]) {
        profMap[s.professionalId] = { name: s.professionalName, scheduled: 0, done: 0, cancelled: 0 };
      }
      if (s.status === "scheduled") profMap[s.professionalId].scheduled++;
      else if (s.status === "done") profMap[s.professionalId].done++;
      else if (s.status === "cancelled") profMap[s.professionalId].cancelled++;
    });
    return Object.values(profMap).sort((a, b) => (b.scheduled + b.done) - (a.scheduled + a.done));
  }, [timeslots]);

  const recentSlots = useMemo(
    () => [...timeslots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [timeslots]
  );

  const isLoading = statsLoading || slotsLoading;

  const statCards = [
    {
      title: "Upcoming Today",
      value: stats?.upcomingToday ?? 0,
      icon: CalendarDays,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      delta: "Active appointments",
      link: "/timeslots",
    },
    {
      title: "Total Scheduled",
      value: stats?.totalScheduled ?? 0,
      icon: Clock,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      link: "/timeslots",
    },
    {
      title: "Completed",
      value: stats?.totalDone ?? 0,
      icon: CalendarCheck,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Cancelled",
      value: stats?.totalCancelled ?? 0,
      icon: CalendarX,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Clients",
      value: stats?.totalClients ?? 0,
      icon: Users,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      link: "/clients",
    },
    {
      title: "Professionals",
      value: stats?.totalProfessionals ?? 0,
      icon: UserSquare2,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      link: "/professionals",
    },
    {
      title: "Services",
      value: stats?.totalServices ?? 0,
      icon: Briefcase,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      link: "/services",
    },
    {
      title: "Total Appointments",
      value: timeslots.length,
      icon: Activity,
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      link: "/timeslots",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatFullDate(new Date())} — Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/timeslots/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Appointments This Week</CardTitle>
                <CardDescription>Daily breakdown for the last 7 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7Days} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="scheduled" name="Scheduled" fill={STATUS_COLORS.scheduled} radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="Done" fill={STATUS_COLORS.done} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill={STATUS_COLORS.cancelled} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
            <CardDescription>All-time distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {timeslots.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value, entry: any) => (
                      <span style={{ color: "hsl(var(--foreground))" }}>
                        {value} ({entry.payload.value})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Appointments + Professional Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Appointments</CardTitle>
                <CardDescription>Latest scheduled activity</CardDescription>
              </div>
              <Link href="/timeslots">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs">
                  View all <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {slotsLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : recentSlots.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No appointments yet.{" "}
                <Link href="/timeslots/new" className="text-primary underline">
                  Schedule one
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                        {slot.clientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{slot.clientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {slot.serviceName} — {slot.professionalName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {formatDateTime(slot.startTime)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          slot.status === "scheduled"
                            ? "bg-blue-100 text-blue-700"
                            : slot.status === "done"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {slot.status.charAt(0).toUpperCase() + slot.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Workload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Professional Workload</CardTitle>
            <CardDescription>Appointments by professional</CardDescription>
          </CardHeader>
          <CardContent>
            {professionalLoad.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No data</div>
            ) : (
              <div className="space-y-4">
                {professionalLoad.map((prof, i) => {
                  const total = prof.scheduled + prof.done + prof.cancelled;
                  const maxTotal = Math.max(...professionalLoad.map((p) => p.scheduled + p.done + p.cancelled), 1);
                  const pct = Math.round((total / maxTotal) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {prof.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                            {prof.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{total} total</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full flex rounded-full overflow-hidden">
                          {prof.scheduled > 0 && (
                            <div
                              style={{ width: `${(prof.scheduled / total) * pct}%`, background: STATUS_COLORS.scheduled }}
                            />
                          )}
                          {prof.done > 0 && (
                            <div
                              style={{ width: `${(prof.done / total) * pct}%`, background: STATUS_COLORS.done }}
                            />
                          )}
                          {prof.cancelled > 0 && (
                            <div
                              style={{ width: `${(prof.cancelled / total) * pct}%`, background: STATUS_COLORS.cancelled }}
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-blue-600">{prof.scheduled} scheduled</span>
                        <span className="text-xs text-emerald-600">{prof.done} done</span>
                        {prof.cancelled > 0 && <span className="text-xs text-red-500">{prof.cancelled} cancelled</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Schedule Appointment", href: "/timeslots/new", icon: CalendarDays, color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200" },
              { label: "Add Client", href: "/clients", icon: Users, color: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200" },
              { label: "Add Professional", href: "/professionals", icon: UserSquare2, color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200" },
              { label: "Manage Services", href: "/services", icon: Briefcase, color: "bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <button
                  className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-150 text-sm font-medium ${action.color}`}
                >
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
