"use client";

import { UserButton } from "@clerk/nextjs";
import { useUserPlanVerification } from "../../hooks/useUserPlanVerification";

function UserPlansDropdown({ plans }) {
  const activePlans = plans?.active || [];

  if (activePlans.length === 0) {
    return (
      <div className="relative group">
        <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <span>🆓 Plano Gratuito</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              Nenhum plano ativo
            </div>
            <a
              href="/#pricing"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              🛒 Ver Planos Disponíveis
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors bg-green-50 rounded-md">
        <span>
          ✨{" "}
          {activePlans.length === 1
            ? activePlans[0]
            : `${activePlans.length} planos`}
        </span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2">
          <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
            Seus Planos Ativos
          </div>

          {activePlans.map((plan, index) => (
            <div
              key={index}
              className="px-4 py-2 text-sm text-gray-600 bg-green-50"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  {plan}
                </span>
                <span className="text-xs text-green-600 font-medium">
                  ATIVO
                </span>
              </div>
            </div>
          ))}

          <div className="border-t mt-2 pt-2">
            <a
              href={`https://billing.stripe.com/p/login/test_your_customer_portal_link`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
            >
              ⚙️ Gerenciar Assinatura
            </a>
            <a
              href="/#pricing"
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              🛒 Ver Outros Planos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ user, children }) {
  const { plans, isVerifying } = useUserPlanVerification();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Center - Children content */}
        <div className="flex-1 flex items-center justify-center">
          {children}
        </div>

        {/* Right side - User info & plans */}
        <div className="flex items-center space-x-4">
          {/* Planos do usuário */}
          {user && !isVerifying && <UserPlansDropdown plans={plans} />}

          {/* Loading state para planos */}
          {isVerifying && (
            <div className="flex items-center space-x-2 px-3 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Verificando...</span>
            </div>
          )}

          {/* User menu */}
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">
                Olá, {user.firstName || "Usuário"}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
