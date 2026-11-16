"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input, Notice, Segmented } from "@/components/ui";
import { frenchError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg({
            tone: "info",
            text: "Compte créé. Si la confirmation par e-mail est activée, cliquez sur le lien reçu puis connectez-vous ici.",
          });
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMsg({ tone: "error", text: frenchError(err instanceof Error ? err.message : String(err)) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="text-5xl">💶</div>
        <h1 className="mt-3 text-3xl font-bold">Notre Budget</h1>
        <p className="mt-1 text-muted">Le budget du couple, à jour sur les deux téléphones.</p>
      </div>

      <Card className="space-y-4">
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: "login", label: "Connexion" },
            { value: "signup", label: "Créer un compte" },
          ]}
        />
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" ? (
            <Field label="Prénom">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoCapitalize="words" autoComplete="given-name" />
            </Field>
          ) : null}
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
          </Field>
          <Field label="Mot de passe" hint={mode === "signup" ? "6 caractères minimum." : undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </Field>
          {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
