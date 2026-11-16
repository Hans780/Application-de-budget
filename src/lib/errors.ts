/** Traduit les messages d'erreur Supabase les plus courants. */
export function frenchError(message: string | undefined | null): string {
  if (!message) return "Une erreur est survenue.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirmez votre e-mail avant de vous connecter.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("password should be at least")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Adresse e-mail invalide.";
  if (m.includes("rate limit")) return "Trop de tentatives, réessayez dans une minute.";
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed"))
    return "Pas de connexion réseau.";
  return message;
}
