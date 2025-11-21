import { db } from "@/lib/db/mongodb";
import { UserDocument } from "@/lib/db/models/User";
import { getPlanLimits, PlanType } from "./plans";

export async function getUserUsage(userId: string) {
  const user = await db.findOne<UserDocument>("users", { clerkUserId: userId });
  if (!user) throw new Error("User not found");

  // Initialize usage if missing
  if (!user.usage) {
    const initialUsage = {
      tokensUsed: 0,
      companiesCount: 0,
      contactsCount: 0,
      filesUploaded: 0,
      lastResetDate: new Date(),
    };
    await db.updateOne("users", { clerkUserId: userId }, { $set: { usage: initialUsage, plan: user.plan || "FREE" } });
    return { usage: initialUsage, plan: user.plan || "FREE" };
  }

  return { usage: user.usage, plan: user.plan };
}

export async function checkLimit(
  userId: string,
  limitType: "companies" | "contacts" | "tokens" | "files",
  amount = 1
): Promise<{ allowed: boolean; reason?: string }> {
  const { usage, plan } = await getUserUsage(userId);
  const limits = getPlanLimits(plan as PlanType);

  if (limitType === "companies") {
    if (usage.companiesCount + amount > limits.maxCompanies) {
      return { allowed: false, reason: `Company limit reached (${limits.maxCompanies})` };
    }
  }

  if (limitType === "contacts") {
    if (limits.maxContactsPerCompany !== "UNLIMITED" && usage.contactsCount + amount > limits.maxContactsPerCompany) {
       // Note: This is a simplification. Realistically we might want to check per-company or total contacts depending on interpretation.
       // The requirement says "5 contacts per company". This logic might need adjustment if we track total contacts vs per company.
       // For now, let's assume the usage.contactsCount is global and the limit is global for simplicity, OR we check per workspace.
       // Actually, the requirement says "5 contacts per company".
       // We should probably check this at the workspace level, but here we are checking global usage?
       // Let's stick to the plan: "Contacts Included: 5 contacts per company".
       // So this check might be better placed in the route handler where we have the company context.
       // However, for "Unlimited contacts" in Pro Plus, we can return true.
       return { allowed: true }; // Defer to route handler for specific company check
    }
  }

  if (limitType === "tokens") {
    if (usage.tokensUsed + amount > limits.monthlyTokens) {
      return { allowed: false, reason: `Monthly token limit reached (${limits.monthlyTokens})` };
    }
  }

  return { allowed: true };
}

export async function incrementUsage(
  userId: string,
  metric: "tokensUsed" | "companiesCount" | "contactsCount" | "filesUploaded",
  amount = 1
) {
  await db.updateOne(
    "users",
    { clerkUserId: userId },
    { $inc: { [`usage.${metric}`]: amount } }
  );
}
