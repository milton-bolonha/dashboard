import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/cookies-store";
import { getAuth } from "@/lib/auth/get-auth";
import {
  loadCompaniesWithDashboardsFromMongo,
  saveCompanyToMongo,
} from "@/lib/storage/mongodb-store";
import { loadCompaniesWithDashboards, saveCompaniesWithDashboards } from "@/lib/storage/dashboards-store";
import type { CompanyWithDashboards } from "@/lib/types/dashboard";

/**
 * GET /api/dashboards
 * Load companies with dashboards
 * Security: Members load from MongoDB (scoped by userId), Guests load from localStorage only
 */
export async function GET() {
  try {
    const { userId } = await getAuth();
    const { sessionId } = await getCurrentSession();
    
    // Members: Load from MongoDB (scoped by userId for security)
    if (userId) {
      try {
        // Convert null to undefined for TypeScript compatibility
        const companies = await loadCompaniesWithDashboardsFromMongo(sessionId || undefined, userId);
        if (companies.length > 0) {
          return NextResponse.json({ companies });
        }
      } catch (mongoError) {
        const errorCode = (mongoError as Error & { code?: string }).code;
        if (errorCode === "MONGODB_CIRCUIT_OPEN") {
          console.log("[API] /api/dashboards - MongoDB circuit breaker aberto, usando fallback localStorage");
        } else {
          console.warn("[API] /api/dashboards - Erro ao ler do MongoDB, usando fallback localStorage:", mongoError);
        }
      }
    }

    // Guests: Load from localStorage only (never MongoDB)
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
 * Save company
 * Security: Members save to MongoDB (scoped by userId), Guests save to localStorage only
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

    const { userId } = await getAuth();

    // Always save to localStorage (for guests and as cache for members)
    const companies = loadCompaniesWithDashboards();
    const existingIndex = companies.findIndex((c) => c.id === company.id);
    if (existingIndex >= 0) {
      companies[existingIndex] = company;
    } else {
      companies.push(company);
    }
    saveCompaniesWithDashboards(companies);

    // Security: Only save to MongoDB if user is authenticated (member, not guest)
    if (userId) {
      // Member: Save to MongoDB (non-blocking)
      try {
        await saveCompanyToMongo(company, userId);
        console.log("[API] /api/dashboards - ✅ Company também salva no MongoDB (member)");
      } catch (mongoError) {
        const errorMessage = mongoError instanceof Error ? mongoError.message : String(mongoError);
        console.warn("[API] /api/dashboards - ⚠️ Falha ao salvar no MongoDB (não crítico):", errorMessage);
      }
    } else {
      // Guest: Only localStorage, never MongoDB
      console.log("[API] /api/dashboards - ℹ️ Guest mode: Company salva apenas em localStorage (não MongoDB)");
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

