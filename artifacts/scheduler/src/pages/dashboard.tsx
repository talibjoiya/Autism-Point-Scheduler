import { useGetStatsOverview } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CalendarDays, CalendarX, Users, UserSquare2, Briefcase } from "lucide-react";

export default function Dashboard() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <DashboardContent />
      </Layout>
    </RequireAuth>
  );
}

function DashboardContent() {
  const { data: stats, isLoading } = useGetStatsOverview();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24"></CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Upcoming Today", value: stats?.upcomingToday || 0, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { title: "Total Scheduled", value: stats?.totalScheduled || 0, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/20" },
    { title: "Completed", value: stats?.totalDone || 0, icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
    { title: "Cancelled", value: stats?.totalCancelled || 0, icon: CalendarX, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20" },
    { title: "Total Clients", value: stats?.totalClients || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/20" },
    { title: "Professionals", value: stats?.totalProfessionals || 0, icon: UserSquare2, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/20" },
    { title: "Services", value: stats?.totalServices || 0, icon: Briefcase, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/20" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Here's what's happening across the platform today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
