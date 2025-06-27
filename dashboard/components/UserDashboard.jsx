"use client";

import { useUser } from "@clerk/nextjs";
import { useUserPlanVerification } from "../hooks/useUserPlanVerification";
import Button from "./ui/Button";
import { Card } from "./ui/Card";
import Link from "next/link";

export function UserDashboard() {
  const { user } = useUser();
  const {
    plans,
    isVerifying,
    lastVerified,
    source,
    error,
    billing,
    manualVerify,
    hasActivePlans,
    needsVerification,
  } = useUserPlanVerification();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Olá,{" "}
          {user?.firstName ||
            user?.emailAddresses[0].emailAddress.split("@")[0]}
          ! 👋
        </h1>
        <p className="text-pink-100">
          Bem-vindo ao seu Dashboard Engine. Gerencie seu conteúdo de forma
          simples e poderosa.
        </p>
      </div>

      {/* Status dos Planos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Status dos Planos
          </h2>
          <Button
            onClick={() => manualVerify()}
            variant="secondary"
            loading={isVerifying}
            disabled={isVerifying}
            className="text-sm"
          >
            {isVerifying ? "Verificando..." : "Verificar Agora"}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-sm">
                ❌ Erro na verificação: {error}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600 mb-1">
              {plans.active?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Planos Ativos</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              R$ {billing.totalSpent?.toFixed(2) || "0,00"}
            </div>
            <div className="text-sm text-gray-600">Total Investido</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {needsVerification() ? "❗" : "✅"}
            </div>
            <div className="text-sm text-gray-600">
              {needsVerification() ? "Precisa Verificar" : "Atualizado"}
            </div>
          </div>
        </div>

        {/* Planos Ativos */}
        {plans.active && plans.active.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Planos Ativos:</h3>
            <div className="flex flex-wrap gap-2">
              {plans.active.map((planId) => (
                <span
                  key={planId}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {planId.charAt(0).toUpperCase() + planId.slice(1)}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum Plano Ativo
            </h3>
            <p className="text-gray-600 mb-4">
              Adquira um plano para desbloquear todas as funcionalidades.
            </p>
            <Link href="/dashboard/billing">
              <Button variant="primary">Ver Planos Disponíveis</Button>
            </Link>
          </div>
        )}

        {/* Metadados da Verificação */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {lastVerified ? (
                <span>
                  Última verificação:{" "}
                  {new Date(lastVerified).toLocaleString("pt-BR")}
                </span>
              ) : (
                <span>Nunca verificado</span>
              )}
            </div>
            {source && (
              <div className="flex items-center space-x-2">
                <span>Fonte:</span>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    source === "stripe_sync"
                      ? "bg-green-100 text-green-800"
                      : source === "cache"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {source === "stripe_sync"
                    ? "Stripe Sync"
                    : source === "cache"
                    ? "Cache"
                    : source === "no_stripe"
                    ? "Sem Stripe"
                    : source}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/content-types">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Content Types
              </h3>
              <p className="text-gray-600 text-sm">
                Gerencie os tipos de conteúdo do seu sistema
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/sections">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📂</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sections
              </h3>
              <p className="text-gray-600 text-sm">
                Organize seu conteúdo em seções
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/billing">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Billing
              </h3>
              <p className="text-gray-600 text-sm">
                Gerencie seus planos e pagamentos
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Debug Info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Debug Info</h3>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(
              {
                plans,
                billing,
                lastVerified,
                source,
                userMetadata: user?.unsafeMetadata,
              },
              null,
              2
            )}
          </pre>
        </Card>
      )}
    </div>
  );
}
