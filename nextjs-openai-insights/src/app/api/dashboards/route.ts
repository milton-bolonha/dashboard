import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/cookies-store";
import {
  loadCompaniesWithDashboardsFromMongo,
  saveCompanyToMongo,
} from "@/lib/storage/mongodb-store";
import { loadCompaniesWithDashboards, saveCompaniesWithDashboards } from "@/lib/storage/dashboards-store";
import type { CompanyWithDashboards } from "@/lib/types/dashboard";

/**
 * GET /api/dashboards
 * Load companies with dashboards (MongoDB first, fallback localStorage)
 */
export async function GET() {
  try {
    const { sessionId } = await getCurrentSession();
    
    // Try MongoDB first
    try {
      if (sessionId) {
        const companies = await loadCompaniesWithDashboardsFromMongo(sessionId);
        if (companies.length > 0) {
          return NextResponse.json({ companies });
        }
      }
    } catch (mongoError) {
      const errorCode = (mongoError as Error & { code?: string }).code;
      if (errorCode === "MONGODB_CIRCUIT_OPEN") {
        console.log("[API] /api/dashboards - MongoDB circuit breaker aberto, usando fallback localStorage");
      } else {
        console.warn("[API] /api/dashboards - Erro ao ler do MongoDB, usando fallback localStorage:", mongoError);
      }
    }

    // Fallback to localStorage (server-side read)
    const companies = loadCompaniesWithDashboards();
    return NextResponse.json({ companies });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/dashboards - Erro ao carregar companies:", errorMessage);
    return NextResponse.json(
      { error: "Failed to load companies", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboards
 * Save company (dual-write: MongoDB + localStorage)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const company = body?.company as CompanyWithDashboards | undefined;

    if (!company) {
      return NextResponse.json(
        { error: "Company data is required" },
        { status: 400 }
      );
    }

    // Save to localStorage (server-side write)
    const companies = loadCompaniesWithDashboards();
    const existingIndex = companies.findIndex((c) => c.id === company.id);
    if (existingIndex >= 0) {
      companies[existingIndex] = company;
    } else {
      companies.push(company);
    }
    saveCompaniesWithDashboards(companies);

    // Dual-write: Save to MongoDB if available (non-blocking)
    try {
      await saveCompanyToMongo(company);
      console.log("[API] /api/dashboards - ✅ Company também salva no MongoDB");
    } catch (mongoError) {
      const errorMessage = mongoError instanceof Error ? mongoError.message : String(mongoError);
      console.warn("[API] /api/dashboards - ⚠️ Falha ao salvar no MongoDB (não crítico):", errorMessage);
    }

    return NextResponse.json({ success: true, company });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/dashboards - Erro ao salvar company:", errorMessage);
    return NextResponse.json(
      { error: "Failed to save company", details: errorMessage },
      { status: 500 }
    );
  }
}

