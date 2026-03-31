import { useState } from "react";
import {
  useListUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { User } from "@workspace/api-client-react/src/generated/api.schemas";
import { Layout } from "@/components/layout";
import { RequireAuth } from "@/lib/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  Edit,
  Mail,
  Phone,
  Search,
  Shield,
  Stethoscope,
  User as UserIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").or(z.literal("")),
  role: z.enum(["admin", "professional", "client"], { required_error: "Role is required" }),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

type RoleFilter = "all" | "admin" | "professional" | "client";

const ROLE_TABS: { label: string; value: RoleFilter }[] = [
  { label: "All Users", value: "all" },
  { label: "Admins", value: "admin" },
  { label: "Professionals", value: "professional" },
  { label: "Clients", value: "client" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-800 border-violet-200",
  professional: "bg-teal-100 text-teal-800 border-teal-200",
  client: "bg-sky-100 text-sky-800 border-sky-200",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  professional: <Stethoscope className="w-3 h-3" />,
  client: <UserIcon className="w-3 h-3" />,
};

export default function UsersPage() {
  return (
    <RequireAuth allowedRoles={["admin"]}>
      <Layout>
        <UsersContent />
      </Layout>
    </RequireAuth>
  );
}

function UsersContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useListUsers(
    roleFilter !== "all" ? { role: roleFilter } : undefined
  );

  const createMutation = useCreateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "admin" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "client" }) });
        toast({ title: "User created", description: "The user has been added successfully." });
        setIsFormOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.error || "Failed to create user.",
          variant: "destructive",
        });
      },
    },
  });

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "admin" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "client" }) });
        toast({ title: "User updated", description: "The user has been updated successfully." });
        setIsFormOpen(false);
        setEditingUser(null);
        form.reset();
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.error || "Failed to update user.",
          variant: "destructive",
        });
      },
    },
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "admin" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "professional" }) });
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey({ role: "client" }) });
        toast({ title: "User deleted", description: "The user has been removed." });
        setDeletingUser(null);
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err?.error || "Failed to delete user.",
          variant: "destructive",
        });
      },
    },
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", role: "client", phone: "" },
  });

  const openAdd = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", password: "", role: "client", phone: "" });
    setIsFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role as "admin" | "professional" | "client",
      phone: user.phone ?? "",
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: UserFormValues) => {
    if (editingUser) {
      const payload: any = { name: values.name, email: values.email, role: values.role, phone: values.phone };
      if (values.password) payload.password = values.password;
      updateMutation.mutate({ id: editingUser.id, data: payload });
    } else {
      if (!values.password) {
        form.setError("password", { message: "Password is required for new users" });
        return;
      }
      createMutation.mutate({
        data: {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          phone: values.phone,
        },
      });
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone?.toLowerCase().includes(q) ?? false);
  });

  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    professional: users.filter((u) => u.role === "professional").length,
    client: users.filter((u) => u.role === "client").length,
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all users — admins, professionals, and clients.
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setRoleFilter(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              roleFilter === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${
              roleFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {roleFilter === "all" ? roleCounts.all : roleCounts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Joined</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {search
                    ? `No users matching "${search}"`
                    : `No ${roleFilter === "all" ? "" : roleFilter + " "}users found`}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.phone ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {user.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role] || ""}`}
                    >
                      {ROLE_ICONS[user.role]}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(user)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} {filtered.length === 1 ? "user" : "users"}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) { setIsFormOpen(false); setEditingUser(null); form.reset(); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update the user's details below."
                : "Fill in the details to register a new user."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password{" "}
                      {editingUser && (
                        <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1-555-0100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsFormOpen(false); setEditingUser(null); form.reset(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be
              undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deletingUser && deleteMutation.mutate({ id: deletingUser.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
