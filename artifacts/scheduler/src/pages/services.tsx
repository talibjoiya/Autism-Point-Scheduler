import { useState, useEffect } from "react";
import { 
  useListServices, 
  useCreateService, 
  useDeleteService, 
  useGetService,
  useUpdateService,
  getListServicesQueryKey,
  getGetServiceQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Clock, Edit } from "lucide-react";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/locale";

import { Button } from "@/components/ui/button";
import { Table, TableBody as Body, TableCell as Cell, TableHead as Head, TableHeader as Header, TableRow as Row } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  price: z.coerce.number().min(0, "Price must be positive").optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function Services() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <ServicesContent />
      </Layout>
    </RequireAuth>
  );
}

function EditServiceDialog({ id, open, onOpenChange }: { id: number, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: service, isLoading } = useGetService(id, { query: { enabled: open, queryKey: getGetServiceQueryKey(id) } });
  const updateMutation = useUpdateService();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", durationMinutes: 30, price: 0 },
  });

  useEffect(() => {
    if (service && open) {
      form.reset({ 
        name: service.name, 
        description: service.description || "", 
        durationMinutes: service.durationMinutes, 
        price: service.price || 0 
      });
    }
  }, [service, open, form]);

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      await updateMutation.mutateAsync({ id, data });
      toast({ title: "Service updated successfully" });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    } catch (error: any) {
      toast({ title: "Error updating service", description: error.error || "An error occurred", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        {isLoading ? <div className="py-8 text-center text-muted-foreground">Loading details...</div> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                  <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price ({CURRENCY_SYMBOL})</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Service"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServicesContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: services = [], isLoading } = useListServices();
  const createMutation = useCreateService();
  const deleteMutation = useDeleteService();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", durationMinutes: 30, price: 0 },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    try {
      await createMutation.mutateAsync({ data });
      toast({ title: "Service added successfully" });
      setIsAddOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    } catch (error: any) {
      toast({ title: "Error adding service", description: error.error || "An error occurred", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this service?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Service removed" });
      queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    } catch (error: any) {
      toast({ title: "Error", description: error.error || "Failed to remove", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">Manage offered services and pricing</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Service</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                    <FormItem><FormLabel>Duration (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem><FormLabel>Price ({CURRENCY_SYMBOL})</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Service"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {editingId !== null && (
        <EditServiceDialog id={editingId} open={true} onOpenChange={(open) => !open && setEditingId(null)} />
      )}

      <div className="border rounded-lg bg-card">
        <Table>
          <Header>
            <Row>
              <Head>Service</Head>
              <Head>Duration</Head>
              <Head>Price</Head>
              <Head className="text-right">Actions</Head>
            </Row>
          </Header>
          <Body>
            {isLoading ? (
              <Row><Cell colSpan={4} className="text-center py-8">Loading...</Cell></Row>
            ) : services.length === 0 ? (
              <Row><Cell colSpan={4} className="text-center py-12 text-muted-foreground">No services found.</Cell></Row>
            ) : (
              services.map(service => (
                <Row key={service.id}>
                  <Cell>
                    <div className="font-medium">{service.name}</div>
                    {service.description && <div className="text-sm text-muted-foreground truncate max-w-xs mt-1">{service.description}</div>}
                  </Cell>
                  <Cell>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {service.durationMinutes} min
                    </div>
                  </Cell>
                  <Cell>
                    <div className="text-sm font-medium">
                      {formatCurrency(service.price)}
                    </div>
                  </Cell>
                  <Cell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingId(service.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Cell>
                </Row>
              ))
            )}
          </Body>
        </Table>
      </div>
    </div>
  );
}
