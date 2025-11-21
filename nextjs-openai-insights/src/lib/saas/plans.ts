export type PlanType = "FREE" | "PRO" | "PRO_PLUS";

export interface PlanLimits {
  monthlyTokens: number;
  maxCompanies: number;
  maxContactsPerCompany: number | "UNLIMITED";
  maxTilesPerCompany: number | "UNLIMITED";
  maxFilesPerCompany: number | "UNLIMITED";
  canCloneDashboard: boolean;
  canShareWebpage: boolean;
  teamCollaboration: boolean;
}

export const PLANS: Record<PlanType, PlanLimits> = {
  FREE: {
    monthlyTokens: 3000,
    maxCompanies: 3,
    maxContactsPerCompany: 5,
    maxTilesPerCompany: 10,
    maxFilesPerCompany: 2,
    canCloneDashboard: false,
    canShareWebpage: true, // Limited to 3/month in logic
    teamCollaboration: false,
  },
  PRO: {
    monthlyTokens: 20000,
    maxCompanies: 25,
    maxContactsPerCompany: 75,
    maxTilesPerCompany: 25,
    maxFilesPerCompany: 10,
    canCloneDashboard: true,
    canShareWebpage: true,
    teamCollaboration: false,
  },
  PRO_PLUS: {
    monthlyTokens: 75000,
    maxCompanies: 300,
    maxContactsPerCompany: "UNLIMITED",
    maxTilesPerCompany: "UNLIMITED",
    maxFilesPerCompany: "UNLIMITED",
    canCloneDashboard: true,
    canShareWebpage: true,
    teamCollaboration: true,
  },
};

export const STRIPE_PRICE_IDS = {
  "price_1SVLzlFTSyvO26ktr6SPtI90": "PRO",
  "price_1SVM05FTSyvO26ktY1qgOMqv": "PRO_PLUS",
} as const;

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLANS[plan] || PLANS.FREE;
}

export function getPlanFromPriceId(priceId: string): PlanType {
  return (STRIPE_PRICE_IDS as any)[priceId] || "FREE";
}
