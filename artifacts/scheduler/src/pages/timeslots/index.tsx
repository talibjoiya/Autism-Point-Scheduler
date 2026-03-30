import { useState } from "react";
import { 
  useListTimeslots, 
  useUpdateTimeslotStatus, 
  useDeleteTimeslot,
  getListTimeslotsQueryKey 
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useAuth, RequireAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Timeslots() {
  return (
    <RequireAuth>
      <Layout>
        <TimeslotsContent />
      </Layout>
    </RequireAuth>
  );
}

function TimeslotsContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = user?.role === "professional" 
    ? { professionalId: user.id } 
    : user?.role === "client" 
      ? { clientId: user.id } 
      : {};

  const { data: timeslots = [], isLoading } = useListTimeslots(queryParams);
  const updateStatusMutation = useUpdateTimeslotStatus();
  const deleteTimeslotMutation = useDeleteTimeslot();

  const handleStatusUpdate = async (id: number, status: "scheduled" | "done" | "cancelled") => {
    try {
      await updateStatusMutation.mutateAsync({
        id,
        data: { status }
      });
      toast({ title: `Timeslot marked as ${status}` });
      queryClient.invalidateQueries({ queryKey: getListTimeslotsQueryKey(queryParams) });
    } catch (error: any) {
      toast({ title: "Error", description: error.error || "Failed to update", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to completely delete this appointment?")) return;
    try {
      await deleteTimeslotMutation.mutateAsync({ id });
      toast({ title: "Appointment deleted" });
      queryClient.invalidateQueries({ queryKey: getListTimeslotsQueryKey(queryParams) });
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.error || "Failed to delete", variant: "destructive" });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "scheduled": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">Scheduled</Badge>;
      case "done": return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">Done</Badge>;
      case "cancelled": return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === "admin" && "Manage all schedules across the platform"}
            {user?.role === "professional" && "View and manage your upcoming schedule"}
            {user?.role === "client" && "View your scheduled appointments"}
          </p>
        </div>
        
        {user?.role === "admin" && (
          <Link href="/timeslots/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-card border rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : timeslots.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-card">
            <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No appointments</h3>
            <p className="text-muted-foreground mt-1">There are no timeslots scheduled yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {timeslots.map((slot) => {
              const start = new Date(slot.startTime);
              const end = new Date(slot.endTime);
              
              return (
                <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary shrink-0 hidden sm:flex">
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">{slot.serviceName}</div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <Clock className="w-4 h-4" />
                        {format(start, "MMM d, yyyy")} • {format(start, "h:mm a")} - {format(end, "h:mm a")}
                      </div>
                    </div>
                    
                    <div className="space-y-1 md:border-l md:pl-6 border-border">
                      <div className="text-sm font-medium">
                        {user?.role === "client" ? "Professional" : "Client"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user?.role === "client" ? slot.professionalName : slot.clientName}
                      </div>
                    </div>

                    <div className="space-y-1 md:border-l md:pl-6 border-border">
                      <div className="text-sm font-medium">
                        {user?.role !== "client" && user?.role !== "professional" && "Professional"}
                        {user?.role === "professional" && "Notes"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {user?.role === "admin" && slot.professionalName}
                        {(user?.role === "professional" || user?.role === "client") && (slot.notes || "No notes")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-3 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border">
                    <StatusBadge status={slot.status} />
                    
                    {(user?.role === "admin" || user?.role === "professional") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {slot.status === "scheduled" && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusUpdate(slot.id, "done")} className="text-emerald-600">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark as Done
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusUpdate(slot.id, "cancelled")} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Appointment
                              </DropdownMenuItem>
                            </>
                          )}
                          {user?.role === "admin" && (
                            <>
                              {slot.status === "scheduled" && <DropdownMenuSeparator />}
                              <DropdownMenuItem onClick={() => handleDelete(slot.id)} className="text-red-600 font-medium">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Completely
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
