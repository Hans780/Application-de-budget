"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input, Notice } from "@/components/ui";
import { frenchError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export function OnboardingForm({
  hasProfile,
  fallbackName,
  userId,
}: {
  hasProfile: boolean;
  fallbackName: string;
  userId: string;
}) {
  const router = useRouter();
  const [coupleName, setCoupleName] = useState("Notre budget");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureProfile = async () => {
    if (hasProfile) return;
    const supabase = createClient();
    await supabase.from("profiles").insert({ id: userId, display_name: fallbackName });
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await ensureProfile();
      await fn();
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(frenchError(e instanceof Error ? e.message : String(e)));
      setBusy(false);
    }
  };

  const create = () =>
    run(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_couple", { p_name: coupleName });
      if (error) throw error;
    });

  const join = () =>
    run(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("join_couple", { p_code: code });
      if (error) throw error;
    });

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/connexion");
    router.refresh();
  };

  return (
    <main className="safe-top mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Bienvenue {fallbackName} 👋</h1>
        <p className="mt-1 text-muted">Dernière étape : créez votre espace couple ou rejoignez celui de votre partenaire.</p>
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <Card className="space-y-3">
        <div className="font-semibold">Créer notre espace</div>
        <Field label="Nom de l'espace">
          <Input value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
        </Field>
        <Button className="w-full" disabled={busy} onClick={create}>
          Créer et inviter mon/ma partenaire ensuite
        </Button>
      </Card>

      <Card className="space-y-3">
        <div className="font-semibold">Rejoindre avec un code</div>
        <Field label="Code d'invitation (8 caractères)">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AB12CD34"
            autoCapitalize="characters"
            className="text-center text-xl tracking-[0.3em]"
          />
        </Field>
        <Button variant="secondary" className="w-full" disabled={busy || code.replace(/[^A-Z0-9]/g, "").length < 8} onClick={join}>
          Rejoindre
        </Button>
      </Card>

      <button type="button" onClick={logout} className="text-sm text-muted underline">
        Se déconnecter
      </button>
    </main>
  );
}
