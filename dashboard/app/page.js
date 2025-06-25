"use client";

import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                💖 Dashboard Engine
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                  >
                    Acessar Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="text-gray-700 hover:text-pink-600 transition-colors duration-200">
                      Entrar
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg">
                      Criar Conta
                    </button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Crie
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Dashboards{" "}
            </span>
            Incríveis
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Plataforma completa para criar dashboards, CRMs, ERPs e CMSs de
            forma simples e poderosa. Simplicidade por padrão, poder como opção.
          </p>

          {isSignedIn ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Olá,{" "}
                <span className="font-semibold text-pink-600">
                  {user.firstName || user.emailAddresses[0].emailAddress}
                </span>
                ! 👋
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Acessar Meu Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <SignUpButton mode="modal">
                <button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1">
                  Começar Agora - Grátis
                </button>
              </SignUpButton>

              <SignInButton mode="modal">
                <button className="border-2 border-pink-500 text-pink-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-pink-50 transition-all duration-200">
                  Já Tenho Conta
                </button>
              </SignInButton>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-pink-100 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Deploy Rápido
            </h3>
            <p className="text-gray-600">
              Configure seu dashboard em minutos, não em dias. Interface
              intuitiva e fluxo simplificado.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-purple-100 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Super Flexível
            </h3>
            <p className="text-gray-600">
              Crie Content Types, Sections e Items customizados para qualquer
              tipo de negócio.
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all duration-300">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Billing Integrado
            </h3>
            <p className="text-gray-600">
              Stripe + Clerk integrados nativamente com verificação automática
              de planos.
            </p>
          </div>
        </div>

        {/* Status do Sistema */}
        {isSignedIn && (
          <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status da Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">
                  {user.emailAddresses[0].emailAddress}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Membro desde:</span>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Planos Ativos:</span>
                <p className="font-medium">
                  {user.unsafeMetadata?.plans?.active?.length || 0} plano(s)
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
