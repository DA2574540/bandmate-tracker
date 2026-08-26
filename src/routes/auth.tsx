import { createFileRoute, useRouter, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Drum, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const authSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type AuthForm = z.infer<typeof authSchema>;

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Provost Band" },
      { name: "description", content: "Masuk ke aplikasi Provost Band." },
      { property: "og:title", content: "Masuk — Provost Band" },
      { property: "og:description", content: "Masuk ke aplikasi Provost Band." },
    ],
  }),
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const search = useSearch({ from: "/auth" });
  const redirect = typeof search.redirect === "string" ? search.redirect : "/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (values: AuthForm) => {
    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast.success("Berhasil masuk");
        await router.navigate({ to: redirect as "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        toast.success("Akun dibuat. Silakan periksa email untuk konfirmasi.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (!result.redirected) {
        toast.success("Berhasil masuk dengan Google");
        await router.navigate({ to: redirect as "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk dengan Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Drum className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Provost Band
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Masuk untuk melanjutkan" : "Buat akun provost baru"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition-all focus:ring-2"
              placeholder="anda@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              {...register("password")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-ring transition-all focus:ring-2"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">atau</span>
          </div>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isGoogleLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Masuk dengan Google
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-medium text-primary hover:underline"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}
