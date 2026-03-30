import { useState, useEffect } from "react";
import { 
  useListUsers, 
  useCreateUser, 
  useDeleteUser, 
  useGetUser, 
  useUpdateUser,
  getListUsersQueryKey,
  getGetUserQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Plus, Trash2, Mail, Phone, Calendar, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody as Body, TableCell as Cell, TableHead as Head, TableHeader as Header, TableRow as Row } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const professionalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type ProfessionalFormValues = z.infer<typeof professionalSchema>;

export default function Professionals() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <ProfessionalsContent />
      </Layout>
    </RequireAuth>
  );
}

function EditProfessionalDialog({ id, open, onOpenChange }: { id: number, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetUser(id, { query: { enabled: open, queryKey: getGetUserQueryKey(id) } });
  const updateMutation = useUpdateUser();

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", email: "", phone: "", password: "" },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({ name: user.name, email: user.email, phone: user.phone || "", password: "" });
    }
  }, [user, open, form]);

  const onSubmit = async (data: ProfessionalFormValues) => {
    try {
      const payload: any = { name: data.name, email: data.email, phone: data.phone, role: "professional" };
      await updateMutation.mutateAsync({ id, data: payload });
      toast({ title: "Professional updated successfully" });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
    } catch (error: any) {
      toast({ title: "Error updating", description: error.error || "An error occurred", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Professional</DialogTitle>
        </DialogHeader>
        {isLoading ? <div className="py-8 text-center text-muted-foreground">Loading details...</div> : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full mt-4" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Updating..." : "Update Professional"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfessionalsContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: professionals = [], isLoading } = useListUsers({ role: "professional" });
  const createMutation = useCreateUser();
  const deleteMutation = useDeleteUser();

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onSubmit = async (data: ProfessionalFormValues) => {
    try {
      if (!data.password) {
        form.setError("password", { message: "Password is required for new professionals" });
        return;
      }
      await createMutation.mutateAsync({ data: { ...data, password: data.password, role: "professional" } });
      toast({ title: "Professional added successfully" });
      setIsAddOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
    } catch (error: any) {
      toast({ title: "Error adding professional", description: error.error || "An error occurred", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this professional?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Professional removed" });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
    } catch (error: any) {
      toast({ title: "Error", description: error.error || "Failed to remove", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Professionals</h1>
          <p className="text-muted-foreground mt-1">Manage service providers</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Professional</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Professional</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Temporary Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Adding..." : "Add Professional"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {editingId !== null && (
        <EditProfessionalDialog id={editingId} open={true} onOpenChange={(open) => !open && setEditingId(null)} />
      )}

      <div className="border rounded-lg bg-card">
        <Table>
          <Header>
            <Row>
              <Head>Name</Head>
              <Head>Contact Info</Head>
              <Head>Joined</Head>
              <Head className="text-right">Actions</Head>
            </Row>
          </Header>
          <Body>
            {isLoading ? (
              <Row><Cell colSpan={4} className="text-center py-8">Loading...</Cell></Row>
            ) : professionals.length === 0 ? (
              <Row><Cell colSpan={4} className="text-center py-12 text-muted-foreground">No professionals found.</Cell></Row>
            ) : (
              professionals.map(prof => (
                <Row key={prof.id}>
                  <Cell className="font-medium">{prof.name}</Cell>
                  <Cell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-muted-foreground" /> {prof.email}</div>
                      {prof.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" /> {prof.phone}</div>}
                    </div>
                  </Cell>
                  <Cell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(prof.createdAt), "MMM d, yyyy")}
                    </div>
                  </Cell>
                  <Cell className="text-right">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setEditingId(prof.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(prof.id)}>
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
