import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const PLANS_PATH = path.resolve(process.cwd(), "config", "plans.yml");

let cache = null;

function loadPlans() {
  if (cache) return cache;
  const file = fs.readFileSync(PLANS_PATH, "utf8");
  cache = YAML.parse(file);
  return cache;
}

export function getMetadata() {
  return loadPlans().metadata;
}

export function getPlan(slug) {
  return loadPlans().plans?.[slug] ?? null;
}

export function getAddon(slug) {
  return loadPlans().addons?.[slug] ?? null;
}

// Aplica features do plano ao perfil Clerk (unsafeMetadata)
export function applyPlanFeatures(userMetadata) {
  const plan = getPlan(userMetadata.currentPlan);
  if (!plan) return userMetadata;
  const includes = plan.includes || {};
  return {
    ...userMetadata,
    ...includes,
  };
}
