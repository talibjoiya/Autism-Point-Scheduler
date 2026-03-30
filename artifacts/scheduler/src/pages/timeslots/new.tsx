import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListUsers, 
  useListServices, 
  useCreateTimeslot,
  getListTimeslotsQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addMinutes } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewTimeslot() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <NewTimeslotContent />
      </Layout>
    </RequireAuth>
  );
}

const timeslotSchema = z.object({
  serviceId: z.coerce.number().min(1, "Service is required"),
  professionalId: z.coerce.number().min(1, "Professional is required"),
  clientId: z.coerce.number().min(1, "Client is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

type TimeslotFormValues = z.infer<typeof timeslotSchema>;

function NewTimeslotContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [] } = useListServices();
  const { data: professionals = [] } = useListUsers({ role: "professional" });
  const { data: clients = [] } = useListUsers({ role: "client" });
  
  const createMutation = useCreateTimeslot();

  const form = useForm<TimeslotFormValues>({
    resolver: zodResolver(timeslotSchema),
    defaultValues: {
      serviceId: 0,
      professionalId: 0,
      clientId: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      time: "09:00",
      notes: "",
    },
  });

  const selectedServiceId = form.watch("serviceId");
  const selectedService = services.find(s => s.id === selectedServiceId);

  const onSubmit = async (data: TimeslotFormValues) => {
    try {
      const service = services.find(s => s.id === data.serviceId);
      if (!service) throw new Error("Service not found");

      // Combine date and time
      const startDateTime = new Date(`${data.date}T${data.time}`);
      const endDateTime = addMinutes(startDateTime, service.durationMinutes);

      await createMutation.mutateAsync({
        data: {
          serviceId: data.serviceId,
          professionalId: data.professionalId,
          clientId: data.clientId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          notes: data.notes,
        }
      });

      toast({ title: "Appointment scheduled successfully" });
      queryClient.invalidateQueries({ queryKey: getListTimeslotsQueryKey() });
      setLocation("/timeslots");
    } catch (error: any) {
      toast({
        title: "Error scheduling",
        description: error.error || "An error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/timeslots">
          <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Appointments
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Appointment</h1>
        <p className="text-muted-foreground mt-1">Book a new service timeslot</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>Select the participants, service, and timing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(Number(v))} 
                        defaultValue={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={String(client.id)}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professionalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional</FormLabel>
                      <Select 
                        onValueChange={(v) => field.onChange(Number(v))} 
                        defaultValue={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a professional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {professionals.map(prof => (
                            <SelectItem key={prof.id} value={String(prof.id)}>
                              {prof.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(Number(v))} 
                      defaultValue={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={String(service.id)}>
                            {service.name} ({service.durationMinutes} min - ${service.price || 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/50 p-4 rounded-lg border">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Clock className="w-4 h-4" /> Start Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedService && (
                  <div className="col-span-1 md:col-span-2 text-sm text-muted-foreground pt-2 border-t">
                    This appointment will run for <strong>{selectedService.durationMinutes} minutes</strong> based on the selected service.
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Any special requests or instructions..." className="resize-none" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Scheduling..." : "Schedule Appointment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
