import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppProvider } from "@/components/AppProvider";
import { BottomNav } from "@/components/BottomNav";
import type { Couple, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile || !profile.couple_id) redirect("/bienvenue");

  const [{ data: couple }, { data: members }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", profile.couple_id).single(),
    supabase.from("profiles").select("*").eq("couple_id", profile.couple_id).order("created_at"),
  ]);
  if (!couple) redirect("/bienvenue");

  const list = (members ?? []) as Profile[];
  const partner = list.find((m) => m.id !== user.id) ?? null;

  return (
    <AppProvider
      value={{
        userId: user.id,
        email: user.email ?? "",
        profile: profile as Profile,
        couple: couple as Couple,
        members: list,
        partner,
      }}
    >
      <main className="safe-top mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-4">{children}</main>
      <BottomNav />
    </AppProvider>
  );
}
