"use client";

import { useState } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  Book,
  CheckCircle,
  Code,
  HelpCircle,
  Users,
  DollarSign,
  Shield,
  Key,
  Zap,
  CreditCard,
  Lock,
  TrendingUp,
  Globe,
  Settings,
  Crown,
} from "lucide-react";
import "./home.css";

// Componente principal da Landing Page
export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="home-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Header isSignedIn={isSignedIn} />
      <main>
        <HeroSection isSignedIn={isSignedIn} user={user} />
        <MonetizationSection />
        <AccessControlSection />
        <EnterpriseSection />
        <UseCasesSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

// Componente Header
const Header = ({ isSignedIn }) => (
  <header className="home-header sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Book className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary">DashMaster.PRO</span>
        </Link>
        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="btn-primary hidden sm:inline-block px-4 py-2 rounded-md text-sm font-semibold cursor-pointer"
              >
                Acessar Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="text-sm font-semibold text-secondary hover:text-blue-600 cursor-pointer">
                  Entrar
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="btn-primary px-4 py-2 rounded-md text-sm font-semibold cursor-pointer">
                  Criar Conta
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </div>
  </header>
);

// Componente Hero Section
const HeroSection = ({ isSignedIn, user }) => (
  <section className="home-hero py-20 sm:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight">
        Uma Plataforma para Construir seu SaaS.
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-secondary">
        O DashMaster.PRO é o motor para criar Workspaces, monetizar com Planos e
        Features, e controlar tudo com um sistema de acesso de nível enterprise.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        {isSignedIn ? (
          <Link
            href="/dashboard"
            className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md shadow-sm text-base font-medium"
          >
            Bem-vindo, {user?.firstName}! Ir para o Dashboard
          </Link>
        ) : (
          <>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md shadow-sm text-base font-medium cursor-pointer">
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </SignUpButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn-secondary inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium cursor-pointer">
                Ver Documentação
              </button>
            </SignInButton>
          </>
        )}
      </div>
    </div>
  </section>
);

// Seção de Monetização
const MonetizationSection = () => (
  <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Engine de Monetização Completo
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Transforme seu projeto em uma plataforma SaaS lucrativa com nosso
          sistema avançado de billing e planos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Stripe Integrado
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Customer Portal nativo, webhooks automáticos e sincronização em
            tempo real de assinaturas
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Planos recorrentes e one-time
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Gestão automática de billing
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Webhooks configurados
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Planos Dinâmicos
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Configure planos pelo MongoDB, não por código. Mude preços, features
            e limites sem deploy
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Free, Business, Enterprise
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Features por plano
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Addons pagos separadamente
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Controle Granular
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Limits por workspace, features condicionais e upgrade prompts
            inteligentes
          </p>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Limites automáticos
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Prompts de upgrade
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Analytics de conversão
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <div className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            💰 Comece a Monetizar Hoje
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Nosso sistema de billing está pronto para receber pagamentos desde o
            primeiro dia
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <span className="bg-green-500 text-white px-4 py-2 rounded-full">
              🎯 Free → Paid Conversion
            </span>
            <span className="bg-blue-500 text-white px-4 py-2 rounded-full">
              📊 Revenue Analytics
            </span>
            <span className="bg-purple-500 text-white px-4 py-2 rounded-full">
              🚀 Upsell Automation
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Seção de Controle de Acesso
const AccessControlSection = () => (
  <section className="py-20 bg-white dark:bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-6">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Sistema de Chaves & Beta Testing
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Gerencie beta testers, demos e campanhas promocionais com nosso
          sistema avançado de chaves de acesso
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🔑 Libere Acessos sem Pagamento
          </h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Crown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Chaves de Plano
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    PLAN2024-ABC123
                  </code>{" "}
                  - Libera acesso completo ao plano Business por 30 dias
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Chaves de Feature
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    FEAT2024-XYZ789
                  </code>{" "}
                  - Ativa Analytics Premium + Export PDF
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Chaves Customizadas
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    CUST2024-DEF456
                  </code>{" "}
                  - Permissões específicas + bonus de limites
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            📋 Casos de Uso Práticos
          </h4>
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-600 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                🧪 Beta Testers
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                50 chaves para beta testers com acesso Business por 60 dias
              </p>
            </div>

            <div className="bg-white dark:bg-gray-600 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                💼 Demos de Vendas
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Chaves específicas por email para demonstrações com prospects
              </p>
            </div>

            <div className="bg-white dark:bg-gray-600 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                🎁 Campanhas Promocionais
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Black Friday: 1000 chaves com 6 meses grátis
              </p>
            </div>

            <div className="bg-white dark:bg-gray-600 rounded-xl p-4">
              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                🎓 Programa Educacional
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Acesso gratuito para domínios .edu por 1 ano
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-8 text-center text-white">
        <h3 className="text-2xl font-bold mb-4">🚀 Acelere sua Adoção</h3>
        <p className="text-lg mb-6 opacity-90">
          Sistema completo de chaves com restrições por email, domínio, tempo e
          uso
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            🎯 Targeting Avançado
          </span>
          <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            📊 Analytics Detalhados
          </span>
          <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
            🔒 Controle Total
          </span>
        </div>
      </div>
    </div>
  </section>
);

// Seção Enterprise
const EnterpriseSection = () => (
  <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Enterprise-Ready Features
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Recursos de nível corporativo prontos para escalar seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Controle de Acesso Granular
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sistema multi-dimensional de permissões por workspace, section, role
            e plano
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Role-Based Access:</strong> Owner, Admin, Editor, Viewer
                com permissões específicas
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Visibilidade Configurável:</strong> Public, Private,
                Authenticated, Plan-based
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Access Rules:</strong> Regras customizadas em JavaScript
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-6">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Autenticação Enterprise (Clerk)
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Integração nativa com Clerk para autenticação profissional e Stripe
            para pagamentos
          </p>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Clerk SSO:</strong> Google, GitHub, Microsoft, SAML
                enterprise
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Stripe Portal:</strong> Webhooks automáticos, sync em
                tempo real
              </span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Multi-Factor Auth:</strong> SMS, TOTP, backup codes
                integrados
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          🎯 Sistema de Monetização Flexível
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Planos Recorrentes
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Free, Business, Enterprise com features e limites configuráveis
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Addons Pagos
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Features vendidas separadamente: Analytics, Exports, Integrações
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Usage-Based
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Cobrança por uso: API calls, storage, export credits
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">🚀 Pronto para Escalar</h3>
          <p className="text-lg mb-6 opacity-90">
            Toda a infraestrutura enterprise que você precisa, desde o primeiro
            dia
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
              🔒 Multi-tenant Security
            </span>
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
              📊 Revenue Analytics
            </span>
            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
              ⚡ Auto-scaling
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Componente de Casos de Uso
const UseCasesSection = () => {
  const [activeTab, setActiveTab] = useState("reais");

  const realUseCases = {
    autores: {
      icon: <Users className="w-6 h-6 text-pink-500" />,
      title: "Autores Apaixonados",
      subtitle: "Cliente Real em Produção",
      description:
        "Plataforma para casais criarem histórias personalizadas, transformadas em livros digitais ou físicos.",
      features: [
        { name: "Workspace", value: '"Autores Apaixonados"' },
        { name: "Estrutura", value: "Sections de Casais, Histórias e Pedidos" },
        {
          name: "Monetização",
          value: "Formulários multi-step com campos pagos",
        },
        {
          name: "Diferencial",
          value: "Geração de texto com IA para capítulos",
        },
      ],
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      buttonColor: "bg-pink-500 hover:bg-pink-600",
    },
    blog: {
      icon: <Code className="w-6 h-6 text-teal-500" />,
      title: "Blog com Taxonomia",
      subtitle: "Exemplo Nativo no MVP",
      description:
        "Demonstração padrão de um blog funcional com posts, categorias e tags.",
      features: [
        { name: "Workspace", value: '"Meu Blog"' },
        { name: "Estrutura", value: "Sections de Posts, Categorias e Tags" },
        {
          name: "Lógica",
          value: "Relacionamento entre posts e suas taxonomias",
        },
        { name: "Controle", value: "Acesso restrito à publicação via Roles" },
      ],
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      buttonColor: "bg-teal-500 hover:bg-teal-600",
    },
  };

  return (
    <section id="use-cases" className="home-section py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
            Casos de Uso Reais e Práticos
          </h2>
          <p className="mt-4 text-lg text-secondary">
            Veja como profissionais estão revolucionando seus negócios com o
            DashMaster.PRO
          </p>
        </div>

        <div className="mt-12 max-w-lg mx-auto flex justify-center bg-accent rounded-full p-1">
          <button
            onClick={() => setActiveTab("reais")}
            className={`tab-button w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "reais"
                ? "bg-primary text-gray-900 shadow"
                : "text-muted"
            }`}
          >
            Clientes Reais
          </button>
          <button
            onClick={() => setActiveTab("exemplos")}
            className={`tab-button w-full py-2 px-4 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "exemplos"
                ? "bg-primary text-gray-900 shadow"
                : "text-muted"
            }`}
          >
            Casos de Uso
          </button>
        </div>

        {activeTab === "reais" && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.values(realUseCases).map((useCase, index) => (
              <div
                key={index}
                className={`use-case-card rounded-2xl ${useCase.bgColor} p-8 transition-all duration-300 hover:shadow-lg`}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
                    {useCase.icon}
                  </div>
                  <div className="flex-1">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${useCase.buttonColor} text-white`}
                    >
                      {useCase.subtitle}
                    </span>
                    <h3 className="mt-3 text-2xl font-bold feature-name">
                      {useCase.title}
                    </h3>
                    <p className="mt-2 feature-value">{useCase.description}</p>

                    <ul className="mt-6 space-y-3">
                      {useCase.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle
                            className={`flex-shrink-0 w-5 h-5 mt-0.5 ${useCase.buttonColor.replace(
                              "bg-",
                              "text-"
                            )}`}
                          />
                          <div className="ml-3">
                            <p className="font-semibold feature-name">
                              {feature.name}:
                            </p>
                            <p className="feature-value">{feature.value}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "exemplos" && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Agência Digital */}
            <div className="home-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">
                    Agência Digital
                  </h3>
                  <p className="text-purple-600 font-medium">
                    Gestão Multi-Cliente
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-secondary">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Cliente A - E-commerce:</strong> Produtos,
                    Categorias, Pedidos com 3 editores
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Cliente B - Blog:</strong> Posts, Autores, SEO com 2
                    editores
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Projeto Interno:</strong> Leads, Propostas,
                    Contratos apenas admin
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-700 font-medium">
                  "Conseguimos organizar 12 clientes em workspaces separados.
                  Cada cliente vê apenas seus dados, e faturamos 300% mais por
                  conta da eficiência."
                </p>
              </div>
            </div>

            {/* Desenvolvedor Freelancer */}
            <div className="home-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">
                    Freelancer
                  </h3>
                  <p className="text-blue-600 font-medium">Multi-Projeto</p>
                </div>
              </div>
              <div className="space-y-4 text-secondary">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Blog Pessoal:</strong> Artigos, Tutoriais, Portfolio
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Cliente - Restaurante:</strong> Cardápio, Pedidos,
                    Avaliações
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>SaaS Side Project:</strong> Users, Features,
                    Feedback
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700 font-medium">
                  "Organizei todos meus projetos em um lugar só. Não preciso
                  mais ficar alternando entre 5 ferramentas diferentes."
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Componente FAQ
const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "Como o DashMaster.PRO é diferente de outras ferramentas?",
      answer:
        "Enquanto outras ferramentas te dão um CMS pronto, o DashMaster.PRO te permite CONSTRUIR CMSs personalizados. É como ter um WordPress que você pode redesenhar completamente para cada cliente, com estruturas de dados únicas, workflows personalizados e monetização integrada.",
    },
    {
      question: "Quanto tempo levo para criar um projeto completo?",
      answer:
        "Para projetos simples (como um blog ou catálogo), você pode ter algo funcionando em 15-30 minutos. Para sistemas mais complexos (CRM multi-departamental), geralmente leva 2-4 horas para configurar toda a estrutura. Compare isso com semanas de desenvolvimento tradicional.",
    },
    {
      question: "Posso cobrar mais dos meus clientes usando isso?",
      answer:
        "Absolutamente. Nossos usuários relatam aumentos de 200-400% no valor cobrado por projeto. Você entrega soluções personalizadas que antes exigiriam uma equipe de desenvolvimento, mas com a agilidade de uma ferramenta no-code.",
    },
    {
      question: "E se eu quiser funcionalidades muito específicas?",
      answer:
        "O sistema de Addons permite extensões ilimitadas. Você pode criar campos personalizados, automações específicas e integrações únicas. Para desenvolvedores, oferecemos APIs completas e hooks para customizações avançadas.",
    },
    {
      question: "Como funciona o modelo de negócio para agências?",
      answer:
        "Você pode criar Workspaces isolados para cada cliente, configurar diferentes níveis de acesso, e até mesmo implementar cobrança por funcionalidades específicas. Cada cliente vê apenas seus dados, mas você gerencia tudo de um painel central.",
    },
    {
      question: "Preciso migrar meus projetos atuais?",
      answer:
        "Não necessariamente. O DashMaster.PRO funciona perfeitamente como complemento aos seus projetos existentes. Muitos usuários começam usando para novos clientes e gradualmente migram projetos antigos conforme veem os benefícios.",
    },
  ];

  return (
    <section
      id="faq"
      className="home-section py-20 sm:py-32"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">
            Perguntas que Todo Profissional Faz
          </h2>
          <p className="mt-4 text-lg text-secondary">
            Respostas diretas para você decidir se o DashMaster.PRO é a
            ferramenta que vai transformar seu negócio.
          </p>
        </div>
        <div className="mt-12 max-w-4xl mx-auto">
          <dl className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="faq-item rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-accent transition-colors"
                >
                  <dt className="faq-question text-lg font-semibold flex items-start">
                    <HelpCircle className="w-6 h-6 mr-3 text-blue-500 flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </dt>
                  <div className="ml-6 flex-shrink-0">
                    <ArrowRight
                      className={`w-5 h-5 text-muted transition-transform duration-200 ${
                        openFaq === index ? "transform rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>
                {openFaq === index && (
                  <dd className="px-6 pb-6">
                    <div className="ml-9 text-base faq-answer leading-relaxed">
                      {faq.answer}
                    </div>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para Revolucionar Seus Projetos?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Junte-se a centenas de profissionais que já estão entregando
              soluções mais sofisticadas em menos tempo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors">
                  Começar Gratuitamente
                </button>
              </SignUpButton>
              <Link
                href="/dashboard"
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
              >
                Ver Demonstração
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente Footer
const Footer = () => (
  <footer className="home-header border-t border-color">
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center space-x-6">
        <Link
          href="#use-cases"
          className="text-sm text-muted hover:text-primary"
        >
          Casos de Uso
        </Link>
        <Link href="#faq" className="text-sm text-muted hover:text-primary">
          FAQ
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-muted hover:text-primary"
        >
          Dashboard
        </Link>
      </div>
      <p className="mt-8 text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} DashMaster.PRO. Todos os direitos
        reservados.
      </p>
    </div>
  </footer>
);
