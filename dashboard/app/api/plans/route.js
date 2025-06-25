import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export async function GET() {
  try {
    const plansPath = path.resolve(process.cwd(), "config", "plans.yml");
    const file = fs.readFileSync(plansPath, "utf8");
    const data = YAML.parse(file);

    return NextResponse.json({
      plans: Object.entries(data.plans).map(([key, plan]) => ({
        id: key,
        ...plan,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load plans" },
      { status: 500 }
    );
  }
}
