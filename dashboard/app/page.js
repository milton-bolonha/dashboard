"use client";

import { useState, useEffect } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
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
  Menu,
  X,
} from "lucide-react";
import "./home.css";
import { useAuth } from "@clerk/nextjs";

export const dynamic = "force-dynamic";

// Componente principal da Landing Page
export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { isSignedIn: authIsSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="home-page min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="dark" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Header isSignedIn={isSignedIn} />
      <main>
        <HeroSection isSignedIn={isSignedIn} user={user} />
        <MonetizationSection />
        <AccessControlSection />
        <EnterpriseSection />
        <UseCasesSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

// Componente Header
const Header = ({ isSignedIn }) => {
  const { theme, systemTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoaded, user } = useUser();

  const menuItems = [
    { name: "Saiba Mais", href: "#saiba-mais" },
    { name: "Preços", href: "#planos" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className="home-header sticky top-0 z-50 pb-[75px] md:pb-0"
      style={{
        zIndex: 9,
        position: "relative",
        backgroundColor: "transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-40 sm:w-64">
              <Image
                src={`/images/logo-${
                  (theme === "system" ? systemTheme : theme) === "dark"
                    ? "dark"
                    : "light"
                }.png`}
                alt="DashMaster.PRO"
                width={256}
                height={59}
                className="object-contain"
                style={{ width: "100%", height: "auto" }}
                priority
                quality={100}
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-10">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-base font-medium text-gray-300 hover:text-white"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop User Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoaded &&
              (isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="cta-button text-sm font-semibold rounded-md cursor-pointer px-4 py-2"
                    style={{ color: "black" }}
                  >
                    Acessar Dashboard
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button className="text-sm font-semibold text-gray-300 hover:text-white cursor-pointer transition-colors font-poppins">
                      Entrar
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <button
                      className="cta-button text-sm font-semibold rounded-md cursor-pointer px-4 py-2"
                      style={{ color: "black" }}
                    >
                      Criar Conta
                    </button>
                  </SignUpButton>
                </>
              ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white border border-white/30 hover:bg-white/20"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden">
          <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-5">
              {isLoaded &&
                (isSignedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-medium text-white">
                        {user.firstName}
                      </p>
                      <UserButton afterSignOutUrl="/" />
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full px-4 py-2 text-center text-black bg-[var(--cta-color)] rounded-md font-bold"
                    >
                      Acessar Dashboard
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <SignInButton mode="modal">
                      <button className="w-full text-white font-medium p-2 rounded-md hover:bg-gray-700 text-left">
                        Entrar
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="w-full px-4 py-2 text-black bg-white rounded-md font-medium">
                        Começar grátis
                      </button>
                    </SignUpButton>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Componente Hero Section
const HeroSection = ({ isSignedIn, user }) => {
  const words = [
    "SaaS",
    "CMS",
    "WebSite",
    "ECommerce",
    "AiChatbot",
    "Landing Page",
    "Portfolio",
    "Intranet",
  ];
  const [currentWord, setCurrentWord] = useState(words[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
    }, 2000); // Muda a cada 2 segundos

    return () => clearInterval(interval); // Limpa o intervalo
  }, []);

  return (
    <section
      className="home-hero py-30 sm:py-42"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center text-white bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="font-semibold">Crie, Monetize, Escale</span>
          <span className="ml-2 inline-block bg-green-400 w-2 h-2 rounded-full"></span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-geologica brutal-heading">
          Para Agências e Devs Desenvolverem
          <br />
          <span
            className="diagonal-word"
            style={{ backgroundColor: "#A15DFF", color: "white" }}
          >
            {currentWord}
          </span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300 font-poppins">
          Acelere a entrega de projetos complexos. Crie painéis, CRMs e
          plataformas SaaS personalizadas em uma fração do tempo, com a
          flexibilidade que seu cliente precisa e a monetização que seu negócio
          merece.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="cta-button inline-flex items-center justify-center rounded-md shadow-sm text-base font-medium"
            >
              Bem-vindo, {user?.firstName}! Ir para o Dashboard
            </Link>
          ) : (
            <>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="cta-button inline-flex items-center justify-center rounded-md shadow-sm text-base font-medium cursor-pointer">
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="btn-secondary inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium cursor-pointer font-poppins">
                  Ver Documentação
                </button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// Seção de Monetização
const MonetizationSection = () => (
  <section
    id="saiba-mais"
    className="monetization-section py-20"
    style={{ backgroundColor: "var(--bg-secondary)" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ backgroundColor: "var(--accent-color-3)" }}
        >
          <DollarSign className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-geologica brutal-heading">
          <span className="text-white">Engine de</span>{" "}
          <span
            className="diagonal-word"
            style={{
              backgroundColor: "var(--accent-color-3)",
              color: "white",
            }}
          >
            Monetização
          </span>{" "}
          <span className="text-white">Completo</span>
        </h2>
        <p className="text-xl text-gray-200 max-w-3xl mx-auto font-poppins">
          Transforme seu projeto em uma plataforma SaaS lucrativa com nosso
          sistema avançado de billing e planos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{
              background: undefined,
              backgroundColor: "var(--cta-color)",
            }}
          >
            <CreditCard className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Stripe Integrado
          </h3>
          <p className="text-gray-200 mb-4 font-poppins">
            Customer Portal nativo, webhooks automáticos e sincronização em
            tempo real de assinaturas
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--cta-color)" }}
              />
              Planos recorrentes e one-time
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--cta-color)" }}
              />
              Gestão automática de billing
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--cta-color)" }}
              />
              Webhooks configurados
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{
              background: undefined,
              backgroundColor: "var(--accent-color-2)",
            }}
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Planos Dinâmicos
          </h3>
          <p className="text-gray-200 mb-4 font-poppins">
            Configure planos pelo MongoDB, não por código. Mude preços, features
            e limites sem deploy
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-2)" }}
              />
              Free, Business, Enterprise
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-2)" }}
              />
              Features por plano
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-2)" }}
              />
              Addons pagos separadamente
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{
              background: undefined,
              backgroundColor: "var(--accent-color-1)",
            }}
          >
            <Settings className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Controle Granular
          </h3>
          <p className="text-gray-300 mb-4 font-poppins">
            Limits por workspace, features condicionais e upgrade prompts
            inteligentes
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Limites automáticos
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Prompts de upgrade
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Analytics de conversão
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
          <h3 className="text-2xl font-bold mb-4 font-geologica text-white">
            Comece a Monetizar Hoje
          </h3>
          <p className="text-lg mb-6 text-gray-300 font-poppins">
            Sistema completo de billing com Stripe, planos, addons e trial. Tudo
            pronto para usar.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm font-semibold">
            <span className="pill-badge-dark text-white">
              🎯 Planos Flexíveis
            </span>
            <span className="pill-badge-dark text-white">
              📊 Portal do Cliente
            </span>
            <span className="pill-badge-dark text-white">
              🔒 Webhooks Seguros
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link
          href="#planos"
          className="cta-button cta-button-purple cta-button-yellow-hover"
        >
          Ver Planos de Monetização
        </Link>
      </div>
    </div>
  </section>
);

// Seção de Controle de Acesso
const AccessControlSection = () => (
  <section
    className="access-control-section py-20"
    style={{ backgroundColor: "var(--bg-primary)" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ backgroundColor: "var(--accent-color-1)" }}
        >
          <Lock className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-geologica brutal-heading">
          Acesso <span className="diagonal-word accent-1">Granular</span> e{" "}
          <span className="diagonal-word accent-1">Seguro</span>
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto font-poppins">
          Controle total sobre quem acessa o quê. Workspaces, permissões de
          usuário e chaves de acesso para integrações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="feature-card-dark">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--accent-color-1)" }}
          >
            <Users className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Workspaces Multi-Tenant
          </h3>
          <p className="text-gray-300 mb-4 font-poppins">
            Isole dados e configurações de clientes em workspaces dedicados,
            garantindo segurança e organização.
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Isolamento de dados por cliente
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Múltiplos usuários por workspace
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Fácil troca entre workspaces
            </li>
          </ul>
        </div>

        <div className="feature-card-dark">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--accent-color-1)" }}
          >
            <Shield className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Permissões Configuráveis
          </h3>
          <p className="text-gray-300 mb-4 font-poppins">
            Defina papéis e permissões para controlar o acesso de cada usuário
            às funcionalidades do sistema.
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Papéis (Admin, Editor, Viewer)
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Controle de acesso por feature
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              API de verificação de acesso
            </li>
          </ul>
        </div>

        <div className="feature-card-dark">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--accent-color-1)" }}
          >
            <Key className="w-6 h-6 text-black" />
          </div>
          <h3 className="text-xl font-bold text-white mb-4 font-geologica">
            Chaves de API Seguras
          </h3>
          <p className="text-gray-300 mb-4 font-poppins">
            Crie chaves de API para integrar com sistemas externos, definindo
            escopos e limites de uso para cada chave.
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Chaves para leitura ou escrita
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Expiração automática de chaves
            </li>
            <li className="flex items-center">
              <CheckCircle
                className="w-4 h-4 mr-2"
                style={{ color: "var(--accent-color-1)" }}
              />
              Logs de uso por chave
            </li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-12">
        <Link
          href="#planos"
          className="cta-button cta-button-purple cta-button-yellow-hover"
        >
          Ver Planos e Preços
        </Link>
      </div>
    </div>
  </section>
);

// Seção Enterprise
const EnterpriseSection = () => (
  <section
    className="py-20 enterprise-section"
    style={{
      backgroundColor: "var(--bg-secondary)",
      color: "var(--text-primary)",
      position: "relative",
      overflow: "hidden",
      borderTop: "2px solid var(--border-color)",
      borderBottom: "2px solid var(--border-color)",
    }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <div
          className="pill-badge-dark inline-flex items-center justify-center mx-auto mb-6 px-4 py-2 text-base"
          style={{ color: "var(--highlight-yellow)" }}
        >
          <Crown
            className="w-6 h-6 mr-3"
            style={{ color: "var(--highlight-yellow)" }}
          />
          <span>Enterprise-Ready</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-geologica brutal-heading">
          Pronto para Escalar. Seguro por Design.
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto font-poppins">
          Funcionalidades de nível enterprise para garantir que seu SaaS atenda
          os clientes mais exigentes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center">
                <Globe
                  className="w-6 h-6"
                  style={{ color: "var(--highlight-yellow)" }}
                />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold text-white font-geologica">
                CMS Headless Dinâmico
              </h4>
              <p className="mt-1 text-gray-300 font-poppins">
                Crie e gerencie tipos de conteúdo, seções e itens diretamente da
                interface. Uma base flexível para qualquer projeto.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center">
                <Zap
                  className="w-6 h-6"
                  style={{ color: "var(--highlight-yellow)" }}
                />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold text-white font-geologica">
                Performance Otimizada
              </h4>
              <p className="mt-1 text-gray-300 font-poppins">
                APIs rápidas construídas com Next.js, Vercel e MongoDB Atlas
                para garantir a melhor performance e escalabilidade.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-tertiary flex items-center justify-center">
                <Settings
                  className="w-6 h-6"
                  style={{ color: "var(--highlight-yellow)" }}
                />
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold text-white font-geologica">
                Altamente Customizável
              </h4>
              <p className="mt-1 text-gray-300 font-poppins">
                O código é seu. Adapte, extenda e modifique a plataforma para
                atender as necessidades específicas do seu negócio.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 md:mt-0">
          <div
            className="p-8 rounded-2xl"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "2px solid var(--border-color)",
            }}
          >
            <h4 className="text-lg font-bold text-white mb-4 font-geologica">
              Disponível em todos os planos:
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-300 font-poppins">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Workspaces ilimitados</span>
              </li>
              <li className="flex items-center text-gray-300 font-poppins">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Tipos de Conteúdo ilimitados</span>
              </li>
              <li className="flex items-center text-gray-300 font-poppins">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Usuários ilimitados</span>
              </li>
              <li className="flex items-center text-gray-300 font-poppins">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Acesso total à API</span>
              </li>
              <li className="flex items-center text-gray-300 font-poppins">
                <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                <span>Suporte da Comunidade</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center mt-16">
        <Link
          href="#planos"
          className="cta-button cta-button-purple cta-button-yellow-hover"
        >
          Explorar Planos
        </Link>
      </div>
    </div>
  </section>
);

// Componente de Casos de Uso
const UseCasesSection = () => {
  const [activeTab, setActiveTab] = useState("reais");

  const realUseCases = {
    autores: {
      title: "Autores Apaixonados",
      subtitle: "Cliente Real em Produção",
      description:
        "Plataforma para casais criarem histórias personalizadas, transformadas em livros digitais ou físicos.",
      features: [
        {
          icon: <Users className="w-5 h-5 text-accent-color-1" />,
          name: "Workspace",
          value: '"Autores Apaixonados"',
        },
        {
          icon: <Book className="w-5 h-5 text-accent-color-1" />,
          name: "Estrutura",
          value: "Sections de Casais, Histórias e Pedidos",
        },
        {
          icon: <DollarSign className="w-5 h-5 text-accent-color-1" />,
          name: "Monetização",
          value: "Formulários multi-step com campos pagos",
        },
        {
          icon: <Zap className="w-5 h-5 text-accent-color-1" />,
          name: "Diferencial",
          value: "Geração de texto com IA para capítulos",
        },
      ],
    },
    blog: {
      title: "Blog com Taxonomia",
      subtitle: "Exemplo Nativo no MVP",
      description:
        "Demonstração padrão de um blog funcional com posts, categorias e tags.",
      features: [
        {
          icon: <Code className="w-5 h-5 text-accent-color-2" />,
          name: "Workspace",
          value: '"Meu Blog"',
        },
        {
          icon: <Book className="w-5 h-5 text-accent-color-2" />,
          name: "Estrutura",
          value: "Sections de Posts, Categorias e Tags",
        },
        {
          icon: <Key className="w-5 h-5 text-accent-color-2" />,
          name: "Lógica",
          value: "Relacionamento entre posts e suas taxonomias",
        },
        {
          icon: <Shield className="w-5 h-5 text-accent-color-2" />,
          name: "Controle",
          value: "Acesso restrito à publicação via Roles",
        },
      ],
    },
  };

  const exampleUseCases = {
    agencia: {
      title: "Painel White-Label para Agências",
      subtitle: "Gestão Unificada de Clientes",
      description:
        "Um painel central para agências gerenciarem múltiplos projetos de clientes com segurança e eficiência.",
      features: [
        {
          icon: <Users className="w-5 h-5 text-cta-color" />,
          name: "Workspace",
          value: "Um por cliente (ex: Nike, Coca-Cola)",
        },
        {
          icon: <Book className="w-5 h-5 text-cta-color" />,
          name: "Estrutura",
          value: "Content Types para Banners, Posts, Landing Pages",
        },
        {
          icon: <Shield className="w-5 h-5 text-cta-color" />,
          name: "Controle",
          value: "Users da agência são Admins, clientes são Editores",
        },
        {
          icon: <Zap className="w-5 h-5 text-cta-color" />,
          name: "Diferencial",
          value: "Addons pagos por cliente",
        },
      ],
    },
    cursos: {
      title: "Plataforma de Cursos Online",
      subtitle: "Monetização de Conteúdo Educacional",
      description:
        "Uma plataforma EAD completa para vender cursos, gerenciar alunos e acompanhar o progresso.",
      features: [
        {
          icon: <Users className="w-5 h-5 text-accent-color-2" />,
          name: "Workspace",
          value: "Um por instrutor ou escola",
        },
        {
          icon: <Book className="w-5 h-5 text-accent-color-2" />,
          name: "Estrutura",
          value: "Sections para Cursos, Módulos, Aulas e Alunos",
        },
        {
          icon: <Key className="w-5 h-5 text-accent-color-2" />,
          name: "Lógica",
          value: "Relacionamento entre Alunos e progresso nas Aulas",
        },
        {
          icon: <DollarSign className="w-5 h-5 text-accent-color-2" />,
          name: "Monetização",
          value: "Planos de acesso (Básico, Premium) via Stripe",
        },
      ],
    },
  };

  return (
    <section
      className="use-cases-section py-20"
      style={{ backgroundColor: "var(--bg-secondary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="pill-badge-dark inline-flex items-center justify-center mx-auto mb-6 px-4 py-2 text-base text-white">
            <Book className="w-6 h-6 mr-3 text-white" />
            <span>Casos de Uso</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-geologica brutal-heading">
            SaaS, Plataformas, Portais e Mais
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-poppins">
            DashMaster.PRO é a base flexível para uma variedade de aplicações
            web de alta performance.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex justify-center bg-tertiary rounded-full p-1">
            <button
              onClick={() => setActiveTab("reais")}
              className={`w-full py-2 px-4 rounded-full text-base font-semibold transition-colors ${
                activeTab === "reais"
                  ? "bg-secondary text-white shadow-lg"
                  : "bg-transparent text-gray-400"
              }`}
            >
              Clientes Reais
            </button>
            <button
              onClick={() => setActiveTab("exemplos")}
              className={`w-full py-2 px-4 rounded-full text-base font-semibold transition-colors ${
                activeTab === "exemplos"
                  ? "bg-secondary text-white shadow-lg"
                  : "bg-transparent text-gray-400"
              }`}
            >
              Exemplos
            </button>
          </div>
        </div>

        <div className="mt-12">
          {activeTab === "reais" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.values(realUseCases).map((useCase, index) => (
                <div key={index} className="p-8 rounded-2xl feature-card-dark">
                  <h4 className="text-xl font-bold text-white mb-4 font-geologica">
                    {useCase.title}
                  </h4>
                  <p className="text-gray-300 mb-6 font-poppins">
                    {useCase.description}
                  </p>
                  <div
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                  >
                    <h5 className="text-lg font-bold text-white mb-2">
                      {useCase.subtitle}
                    </h5>
                    <ul className="space-y-3 text-sm text-gray-300 font-poppins">
                      {useCase.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start">
                          {feature.icon}
                          <div className="ml-3">
                            <strong className="font-geologica mr-2">
                              {feature.name}:
                            </strong>
                            <span>{feature.value}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "exemplos" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Object.values(exampleUseCases).map((useCase, index) => (
                <div key={index} className="p-8 rounded-2xl feature-card-dark">
                  <h4 className="text-xl font-bold text-white mb-4 font-geologica">
                    {useCase.title}
                  </h4>
                  <p className="text-gray-300 mb-6 font-poppins">
                    {useCase.description}
                  </p>
                  <div
                    className="p-6 rounded-lg"
                    style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                  >
                    <h5 className="text-lg font-bold text-white mb-2">
                      {useCase.subtitle}
                    </h5>
                    <ul className="space-y-3 text-sm text-gray-300 font-poppins">
                      {useCase.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start">
                          {feature.icon}
                          <div className="ml-3">
                            <strong className="font-geologica mr-2">
                              {feature.name}:
                            </strong>
                            <span>{feature.value}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Seção de Planos
const PricingSection = () => (
  <section
    id="planos"
    className="pricing-section py-20"
    style={{ backgroundColor: "var(--bg-primary)" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-extrabold text-white sm:text-5xl font-geologica brutal-heading">
          Planos para cada Estágio do seu Negócio
        </h2>
        <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto font-poppins">
          Comece de graça e escale conforme sua necessidade. Sem surpresas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Plano Starter */}
        <div
          className="rounded-2xl p-8 flex flex-col"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "2px solid var(--border-color)",
          }}
        >
          <h3 className="text-2xl font-bold text-white font-geologica">
            Starter
          </h3>
          <p className="text-gray-400 mt-2">Para começar a construir</p>
          <div className="mt-6">
            <span className="text-5xl font-bold text-white">$49</span>
            <span className="text-lg text-gray-400">/mês</span>
          </div>
          <ul className="space-y-4 mt-8 text-gray-300 flex-grow">
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> 3 Usuários
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> 5
              Workspaces
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> 10 GB de
              Armazenamento
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> Suporte
              via Comunidade
            </li>
          </ul>
          <div className="mt-8">
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="w-full cta-button cta-button-purple">
                Teste Por 7 Dias Grátis
              </button>
            </SignUpButton>
          </div>
        </div>

        {/* Plano Business */}
        <div
          className="rounded-2xl p-8 flex flex-col"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "2px solid var(--highlight-yellow)",
          }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white font-geologica">
              Business
            </h3>
            <span
              className="px-3 py-1 text-sm font-semibold rounded-full"
              style={{
                backgroundColor: "var(--highlight-yellow)",
                color: "black",
              }}
            >
              MAIS POPULAR
            </span>
          </div>
          <p className="text-gray-400 mt-2">Para negócios em crescimento</p>
          <div className="mt-6">
            <span className="text-5xl font-bold text-white">$99</span>
            <span className="text-lg text-gray-400">/mês</span>
          </div>
          <ul className="space-y-4 mt-8 text-gray-300 flex-grow">
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> 10
              Usuários
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> Workspaces
              Ilimitados
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> 50 GB de
              Armazenamento
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> Acesso a
              Addons
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> Suporte
              Prioritário por Email
            </li>
          </ul>
          <div className="mt-8">
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="w-full cta-button cta-button-yellow-hover">
                Escolher Business
              </button>
            </SignUpButton>
          </div>
        </div>

        {/* Plano Enterprise */}
        <div
          className="rounded-2xl p-8 flex flex-col"
          style={{ backgroundColor: "#A15DFF" }}
        >
          <h3 className="text-2xl font-bold text-white font-geologica">
            Enterprise
          </h3>
          <p className="text-purple-200 mt-2">Para operações em escala</p>
          <div className="mt-6">
            <span className="text-4xl font-bold text-white">Sob Consulta</span>
          </div>
          <ul className="space-y-4 mt-8 text-purple-100 flex-grow">
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-3" /> Usuários
              Ilimitados
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-3" /> Infraestrutura
              Dedicada
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-3" /> SLAs de Uptime
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-3" /> Suporte
              Dedicado e Onboarding
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-white mr-3" /> Customizações
              e Integrações
            </li>
          </ul>
          <div className="mt-8">
            <button
              className="w-full text-lg font-bold py-3 rounded-lg"
              style={{ backgroundColor: "white", color: "black" }}
            >
              Falar com Vendas
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

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
      className="home-section py-20 sm:py-32 faq-section"
      style={{
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl font-geologica">
            Perguntas que Todo{" "}
            <span className="diagonal-word accent-2">Profissional</span> Faz
          </h2>
          <p className="mt-4 text-lg text-gray-300 font-poppins">
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
                  <dt className="faq-question text-lg font-semibold flex items-start font-geologica">
                    <HelpCircle className="w-6 h-6 mr-3 text-green-500 flex-shrink-0 mt-0.5" />
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
                    <div className="ml-9 text-base faq-answer leading-relaxed font-poppins">
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
          <div
            className="rounded-2xl p-8 text-white"
            style={{
              backgroundColor: "#A15DFF",
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-geologica">
              Pronto para Revolucionar Seus Projetos?
            </h2>
            <p className="mt-6 text-xl text-purple-200 max-w-3xl mx-auto font-poppins">
              Comece a construir seu SaaS hoje mesmo. Sem compromisso, sem
              cartão de crédito.
            </p>
            <div className="mt-8 flex flex-col md:flex-row justify-center gap-4">
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="cta-button cta-button-yellow-hover">
                  Começar Grátis Agora
                </button>
              </SignUpButton>
              <button
                className="inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-bold cursor-pointer transition-colors"
                style={{
                  backgroundColor: "#F2EFFF",
                  color: "#374151",
                  border: "2px solid #374151",
                }}
              >
                Ver Demonstração
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Componente Footer
const Footer = () => (
  <footer className="border-t border-color" style={{ background: "#191919" }}>
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center space-x-6">
        <Link
          href="#use-cases"
          className="text-sm text-gray-400 hover:text-white font-poppins transition-colors"
        >
          Casos de Uso
        </Link>
        <Link
          href="#faq"
          className="text-sm text-gray-400 hover:text-white font-poppins transition-colors"
        >
          FAQ
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white font-poppins transition-colors"
        >
          Dashboard
        </Link>
      </div>
      <p className="mt-8 text-center text-sm text-gray-500 font-poppins">
        &copy; {new Date().getFullYear()} DashMaster.PRO. Todos os direitos
        reservados.
      </p>
    </div>
  </footer>
);
