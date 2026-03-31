import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useLogout, useHealthCheck } from "@workspace/api-client-react";
import { 
  CalendarDays, 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  Briefcase,
  LogOut,
  Menu,
  Activity,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  
  const { data: health } = useHealthCheck({
    query: {
      refetchInterval: 60000,
    }
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/login");
  };

  const navItems = [
    ...(user?.role === "admin" ? [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] : []),
    { name: "Timeslots", href: "/timeslots", icon: CalendarDays },
    ...(user?.role === "admin" ? [
      { name: "User Management", href: "/users", icon: UsersRound },
      { name: "Clients", href: "/clients", icon: Users },
      { name: "Professionals", href: "/professionals", icon: UserSquare2 },
      { name: "Services", href: "/services", icon: Briefcase },
    ] : []),
  ];

  const NavLinks = () => (
    <>
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          Scheduler
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground/80 mb-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name}</p>
            <p className="text-xs truncate capitalize opacity-80">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
        <div className="mt-4 flex items-center gap-2 px-3 text-xs text-sidebar-foreground/50">
          <Activity className="w-3 h-3" />
          System Status: {health?.status === "ok" ? "Online" : "Connecting..."}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border pt-6">
        <NavLinks />
      </aside>

      {/* Mobile Sidebar & Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold">Scheduler</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 pt-6 bg-sidebar border-sidebar-border flex flex-col">
              <NavLinks />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
