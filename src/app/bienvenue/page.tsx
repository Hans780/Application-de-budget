import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profile?.couple_id) redirect("/");

  const fallbackName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Moi";

  return <OnboardingForm hasProfile={Boolean(profile)} fallbackName={fallbackName} userId={user.id} />;
}
