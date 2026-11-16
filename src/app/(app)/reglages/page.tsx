"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Card, Field, Input, Notice, PageTitle, Segmented } from "@/components/ui";
import { parseAmountInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { SplitMode } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, couple, partner, email } = useApp();
  const [name, setName] = useState(profile.display_name);
  const [income, setIncome] = useState(profile.monthly_income ? String(profile.monthly_income).replace(".", ",") : "");
  const [coupleName, setCoupleName] = useState(couple.name);
  const [splitMode, setSplitMode] = useState<SplitMode>(couple.split_mode);
  const [inviteCode, setInviteCode] = useState(couple.invite_code);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() || profile.display_name, monthly_income: parseAmountInput(income) })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return setMsg({ tone: "error", text: error.message });
    setMsg({ tone: "success", text: "Profil enregistré." });
    router.refresh();
  };

  const saveCouple = async () => {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("couples")
      .update({ name: coupleName.trim() || couple.name, split_mode: splitMode })
      .eq("id", couple.id);
    setBusy(false);
    if (error) return setMsg({ tone: "error", text: error.message });
    setMsg({ tone: "success", text: "Espace couple enregistré." });
    router.refresh();
  };

  const share = async () => {
    const text = `Rejoins notre budget : ouvre ${window.location.origin}/bienvenue et saisis le code ${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* annulé */
      }
    } else {
      await navigator.clipboard.writeText(text);
      setMsg({ tone: "success", text: "Invitation copiée dans le presse-papiers." });
    }
  };

  const regenerate = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("regenerate_invite_code");
    if (error) return setMsg({ tone: "error", text: error.message });
    setInviteCode(data as string);
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/connexion");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <PageTitle>Réglages</PageTitle>
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}

      <Card className="space-y-3">
        <div className="font-semibold">Mon profil</div>
        <div className="text-xs text-muted">{email}</div>
        <Field label="Prénom">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoCapitalize="words" />
        </Field>
        <Field label="Revenu net mensuel" hint="Sert uniquement à la répartition au prorata des revenus.">
          <Input inputMode="decimal" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="0" />
        </Field>
        <Button variant="secondary" className="w-full" disabled={busy} onClick={saveProfile}>
          Enregistrer le profil
        </Button>
      </Card>

      <Card className="space-y-3">
        <div className="font-semibold">Notre espace couple</div>
        <Field label="Nom">
          <Input value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
        </Field>
        <Field label="Répartition des dépenses communes">
          <Segmented
            value={splitMode}
            onChange={setSplitMode}
            options={[
              { value: "equal", label: "50 / 50" },
              { value: "income", label: "Prorata des revenus" },
            ]}
          />
        </Field>
        <Button variant="secondary" className="w-full" disabled={busy} onClick={saveCouple}>
          Enregistrer l&apos;espace couple
        </Button>

        <div className="border-t border-border pt-3">
          <div className="text-sm font-medium text-muted">Partenaire</div>
          {partner ? (
            <div className="mt-1 font-semibold">{partner.display_name} ✅</div>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm">
                Personne n&apos;a encore rejoint. Transmettez ce code à votre partenaire : il ou elle crée un compte puis
                choisit « Rejoindre avec un code ».
              </p>
              <div className="rounded-2xl bg-surface-2 py-3 text-center text-2xl font-bold tracking-[0.3em]">
                {inviteCode}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={share}>
                  Partager l&apos;invitation
                </Button>
                <Button variant="secondary" onClick={regenerate}>
                  Nouveau code
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <Link href="/reglages/categories" className="flex items-center justify-between font-semibold">
          <span>🏷️ Catégories et enveloppes par défaut</span>
          <span className="text-muted">›</span>
        </Link>
      </Card>

      <Card>
        <div className="font-semibold"> Apple Pay</div>
        <p className="mt-1 text-sm text-muted">La saisie automatique des paiements arrive à l&apos;étape 2.</p>
      </Card>

      <Button variant="danger" className="w-full" onClick={logout}>
        Se déconnecter
      </Button>
    </div>
  );
}
