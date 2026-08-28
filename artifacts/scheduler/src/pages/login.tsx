import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, ArrowRight, Heart, Puzzle } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const features = [
  { icon: "📅", text: "Smart appointment scheduling" },
  { icon: "👥", text: "Client & professional management" },
  { icon: "📊", text: "Real-time analytics dashboard" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      const response = await loginMutation.mutateAsync({ data });
      queryClient.setQueryData(getGetMeQueryKey(), response.user);
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      setLocation(response.user.role === "admin" || response.user.role === "client" ? "/dashboard" : "/timeslots");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error?.error || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand & features */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a6b8a 50%, #0f8b8d 100%)" }}>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #7dd3fc 0%, transparent 70%)" }} />
          {/* Puzzle piece decorative dots */}
          <div className="absolute top-1/3 right-10 grid grid-cols-4 gap-3 opacity-20">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* Logo & brand */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
            <img src="/logo.png" alt="Autism Point" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold leading-tight">Autism Point</h1>
            <p className="text-blue-200 text-xs font-medium tracking-wide uppercase">Care Scheduling Platform</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold leading-snug mb-4">
            Streamline care.<br />
            <span className="text-sky-300">Connect people.</span>
          </h2>
          <p className="text-blue-100/80 text-lg leading-relaxed mb-10 max-w-sm">
            A complete scheduling platform designed for therapy and care providers.
          </p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-base backdrop-blur-sm flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-blue-50 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-blue-300/60 text-xs">
          <Heart className="w-3 h-3" />
          <span>Built with care for care providers</span>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-2">
          <img src="/logo.png" alt="Autism Point" className="w-16 h-16 object-contain" />
          <h1 className="text-xl font-bold text-gray-900">Autism Point</h1>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Email address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="you@example.com"
                            className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            autoComplete="email"
                            {...field}
                          />
                        </div>
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
                      <FormLabel className="text-sm font-semibold text-gray-700">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            autoComplete="current-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a6b8a 100%)" }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Autism Point · Appointment Scheduling Platform
          </p>
        </div>
      </div>
    </div>
  );
}
