import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useLogin, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const response = await loginMutation.mutateAsync({ data });
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      
      toast({
        title: "Welcome back",
        description: "You have successfully logged in.",
      });

      if (response.user.role === "admin") {
        setLocation("/dashboard");
      } else {
        setLocation("/timeslots");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.error || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 w-full h-1/2 bg-primary/5 -z-10 rounded-b-[100px] blur-3xl"></div>
      
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-3 pb-8 text-center pt-8">
          <img src="/logo.png" alt="Autism Plus" className="w-24 h-24 object-contain mx-auto mb-2 drop-shadow-md" />
          <CardTitle className="text-3xl font-bold tracking-tight">Autism Plus</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Sign in to manage your appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" className="h-11" {...field} />
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
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base font-medium mt-6" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Demo Credentials:</p>
            <p className="mt-1">admin@example.com / admin123</p>
            <p className="mt-1 text-xs">Professional: sarah@example.com / prof123</p>
            <p className="mt-1 text-xs">Client: alice@example.com / client123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
