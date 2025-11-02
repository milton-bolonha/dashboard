"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  PlayCircle,
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
  Brain,
  BarChart3,
  MessageSquare,
  FileText,
  Target,
  Star,
  ChevronRight,
} from "lucide-react";
import "./home.css";
import IAFormsContainer from "@/components/landing/IAFormsContainer";
import IAFormsPresenterClassic from "@/components/landing/iaforms/IAFormsPresenterClassic";
import IAFormsPresenterDynamic from "@/components/landing/iaforms/IAFormsPresenterDynamic";
import { ThemeChooser } from "@/components/landing/ThemeChooser";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const dynamic = "force-dynamic";

// Landing Page Multi-Tema
export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();

  // ⭐ ALTERNÂNCIA DE VIEWS DO HERO
  // Use URL param ?hero=classic ou ?hero=dynamic
  // Default: dynamic (interface moderna com chat e seleção de temas)
  const [heroView, setHeroView] = useState("dynamic");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const view = params.get("hero") || ""; // default: dynamic
    // ⭐ Removido: log desnecessário

    setHeroView(view);
  }, []);
  // ⭐ Removido: logs desnecessários que causavam poluição no console
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ backgroundColor: "#fcfcf9" }}
    >
      <LandingHeader isSignedIn={isSignedIn} />
      {/* <ThemeChooser /> */}
      <main className="flex-1">
        {/* ⭐ ALTERNAR ENTRE VIEWS DO HERO: */}
        {/* 
          Método 1: URL param (recomendado)
          - Acesse: /?hero=classic  (formulário tradicional)
          - Acesse: /?hero=dynamic  (chat interativo - default)
          
          Método 2: Comentário/descomentário manual
          - Comente a linha do DynamicHeroSection e descomente ClassicHero
          - Ou vice-versa para alternar
        */}

        {/* <HeroSection mode="landing" /> */}

        {heroView === "dynamic" ? (
          <IAFormsContainer
            mode="landing"
            heroType={2}
            themeId="dynamic-default"
            initialTemplateId="tpl_dynamic_default"
            initialItems={Array.from({ length: 8 }, (_v, i) => ({
              orderIndex: i,
            }))}
          >
            {(p) => <IAFormsPresenterDynamic {...p} />}
          </IAFormsContainer>
        ) : null}
        {heroView === "" || heroView === null ? (
          <IAFormsContainer
            mode="landing"
            heroType={1}
            themeId="classic-default"
            initialTemplateId="tpl_classic_default"
            initialItems={Array.from({ length: 8 }, (_v, i) => ({
              orderIndex: i,
            }))}
          >
            {(p) => <IAFormsPresenterClassic {...p} />}
          </IAFormsContainer>
        ) : null}
        {/* Outras seções comentadas temporariamente */}
        {/* <CapabilitiesSection />
        <ProblemSection />
        <SolutionSection />
        <SocialProofSection />
        <FeaturesSection />
        <BenefitsSection />
        <PricingSection />
        <CtaSection />
        <FaqSection /> */}
      </main>
      <LandingFooter />
    </div>
  );
}

// Hero Section Backup (comentado)
const HeroSectionBackup = ({ isSignedIn, user }) => {
  const words = useMemo(
    () => ["duplique", "triplique", "quadriplique", "multiplique"],
    []
  );
  const [currentWord, setCurrentWord] = useState(words[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, [words]);

  return (
    <section
      className="home-hero py-30 sm:py-42"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center text-white bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="font-semibold">🚀 What can I do for you?</span>
          <span className="ml-2 inline-block bg-green-400 w-2 h-2 rounded-full"></span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-geologica brutal-heading">
          <span className="text-green-400">Automate</span> your prospecting,
          personalize every contact and{" "}
          <span
            className="diagonal-word"
            style={{ backgroundColor: "#A15DFF", color: "white" }}
          >
            {currentWord}
          </span>{" "}
          your conversions
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300 font-poppins">
          I&apos;m your personal sales assistant that works 24/7. I research
          companies, analyze competitors, generate personalized emails and{" "}
          <strong className="text-green-400">
            turn cold leads into hot opportunities
          </strong>
          .
          <br />
          <strong className="text-green-400">
            +4x more qualified meetings in 30 days.
          </strong>
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="cta-button inline-flex items-center justify-center rounded-md shadow-sm text-base font-medium"
            >
              Welcome, {user?.firstName}! Go to Dashboard
            </Link>
          ) : (
            <>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center justify-center cursor-pointer">
                  🚀 Start Now - It&apos;s Free!
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300 inline-flex items-center justify-center cursor-pointer font-poppins">
                  <PlayCircle className="w-6 h-6 mr-2" />
                  Watch Demo
                </button>
              </SignInButton>
            </>
          )}
        </div>
        <div className="mt-6 text-sm text-gray-400">
          ✅ No credit card required • ✅ Setup in 2 minutes • ✅ 24/7 support
        </div>
      </div>
    </section>
  );
};

// HeroSection agora é compartilhado via @/components/landing/HeroSection

// Nova Seção: O que posso fazer por você
const CapabilitiesSection = () => {
  const capabilities = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Intelligent Company Research",
      description:
        "I analyze competitors, funding, expansions and challenges of any company in seconds",
      color: "text-blue-400",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Personalized Bulk Emails",
      description:
        "I generate unique emails for each lead based on company context and contact profile",
      color: "text-green-400",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Contextual Call Scripts",
      description:
        "I create personalized scripts for each call based on company research",
      color: "text-purple-400",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Interactive Dashboards",
      description:
        "I organize all information in customizable and reusable dashboards",
      color: "text-orange-400",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Smart Contact Management",
      description:
        "I identify and analyze decision-maker profiles with automatic insights",
      color: "text-pink-400",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Complete Automation",
      description:
        "I integrate with your CRM and automate the entire prospecting process",
      color: "text-yellow-400",
    },
  ];

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            🎯 What can I do for you?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            I&apos;m your personal sales assistant that works 24/7. Here are the
            main capabilities I bring to life for your team:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:transform hover:-translate-y-2"
            >
              <div className={`${capability.color} mb-4`}>
                {capability.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {capability.title}
              </h3>
              <p className="text-gray-300">{capability.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg text-green-300 font-semibold">
              💡 <strong>Result:</strong> Your team focuses 100% on what matters
              - closing deals. I handle all research, personalization and
              automatic follow-up.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Seção do Problema (Situação + Problema do SPIN)
const ProblemSection = () => {
  return (
    <section id="problema" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Tired of wasting precious hours on manual research?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Sales reps spend{" "}
            <strong className="text-red-400">70% of their time</strong> on
            administrative tasks, leaving only{" "}
            <strong className="text-green-400">30% for selling</strong>. Generic
            approaches fail in up to{" "}
            <strong className="text-red-400">95% of cases</strong>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <div className="text-red-400 text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Administrative Tasks
            </h3>
            <p className="text-gray-300">
              <strong>70% of time</strong> spent on research, spreadsheets and
              manual follow-ups. Only 30% dedicated to what really matters:
              selling.
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <div className="text-red-400 text-4xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Generic Outreach
            </h3>
            <p className="text-gray-300">
              &quot;Copy and paste&quot; campaigns fail in{" "}
              <strong>95% of cases</strong>. Manual personalization is
              impossible at scale.
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <div className="text-red-400 text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Cold Leads
            </h3>
            <p className="text-gray-300">
              Wasting time with unqualified leads while real opportunities go
              unnoticed in your pipeline.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg text-red-300 font-semibold">
              💸 <strong>Result:</strong> Your team is working in the wrong
              direction. Without intelligent automation, you lose real
              opportunities every day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Seção da Solução (Implicações + Necessidades do SPIN)
const SolutionSection = () => {
  return (
    <section id="solucao" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your personal research assistant that works 24/7
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            <strong className="text-green-400">
              Connect CRM → Upload CSV → Ask WebApp
            </strong>{" "}
            research your whole territory for you. Interactive dashboards with
            instant insights and intelligent templates for tailored messages.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Intelligent Company Management
                  </h3>
                  <p className="text-gray-300">
                    Add companies manually, via CSV or connect your CRM.
                    Automatic dashboards with AI tiles for competitors, funding,
                    expansions and challenges.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Customizable Dashboards
                  </h3>
                  <p className="text-gray-300">
                    Draggable and resizable tiles, customizable backgrounds,
                    notes and files. Clone dashboards and apply to new companies
                    with one click.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Automated Outreach
                  </h3>
                  <p className="text-gray-300">
                    Generate personalized emails, call scripts and LinkedIn DMs.
                    Upload examples for AI to learn your writing style and
                    replicate automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-white">
                Typical Result:
              </h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Time saved:</span>
                <span className="text-green-400 font-semibold">-70%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Qualified meetings:</span>
                <span className="text-green-400 font-semibold">+4x to 5x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Response rate:</span>
                <span className="text-green-400 font-semibold">+300%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Monthly ROI:</span>
                <span className="text-green-400 font-semibold">1,200%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Social Proof
const SocialProofSection = () => {
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Proven results from users
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
            </div>
            <blockquote className="text-gray-300 mb-4">
              &quot;With AI Sales Dashboard, our team focused only on what
              matters: selling. We saw meetings with major companies like
              L&apos;Oreal and 99, thanks to automated prospecting.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                C
              </div>
              <div className="ml-3">
                <div className="text-white font-semibold">Chimeni</div>
                <div className="text-gray-400 text-sm">Girassol Incentiva</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
            </div>
            <blockquote className="text-gray-300 mb-4">
              &quot;Before we saw hundreds of leads, now we only talk to those
              with real potential. The difference was huge.&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div className="ml-3">
                <div className="text-white font-semibold">Sandra</div>
                <div className="text-gray-400 text-sm">
                  COO, Immaginare Experiências
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
            </div>
            <blockquote className="text-gray-300 mb-4">
              &quot;The number of qualified meetings doubled after we started
              using AI, and now we talk to the right people!&quot;
            </blockquote>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                R
              </div>
              <div className="ml-3">
                <div className="text-white font-semibold">Rafael</div>
                <div className="text-gray-400 text-sm">Gestor de Fintech</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features (Benefícios específicos)
const FeaturesSection = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything you need to master sales work
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <Brain size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Company Management
            </h3>
            <p className="text-gray-300">
              Add companies manually, via CSV or connect your CRM. Automatic
              dashboards with AI tiles for each company.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Customizable Dashboards
            </h3>
            <p className="text-gray-300">
              Draggable and resizable tiles, customizable backgrounds. Clone
              dashboards and apply to new companies with one click.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <Target size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Automated Outreach
            </h3>
            <p className="text-gray-300">
              Generate personalized emails, call scripts and LinkedIn DMs.
              Upload examples for AI to learn your writing style.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <BarChart3 size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Credit System
            </h3>
            <p className="text-gray-300">
              Pay only for what you use. Each content generation consumes
              credits. Scalable and no budget waste.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              CRM Integration
            </h3>
            <p className="text-gray-300">
              Connect Salesforce, HubSpot and other CRMs in seconds. Automatic
              synchronization of customer data and activities.
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-green-400 mb-4">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Referral System
            </h3>
            <p className="text-gray-300">
              Invite others via link or email. Both earn credits when a
              registration is completed. Automatic tracking system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Benefícios (ROI e vantagens competitivas)
const BenefitsSection = () => {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Results that speak for themselves
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6">
              Unique Competitive Advantages
            </h3>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2 mt-1">
                  <CheckCircle className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Multi-tenant with Total Isolation
                  </h4>
                  <p className="text-gray-300">
                    Each company has its isolated workspace. Secure data, no
                    leaks between clients. Compliance guaranteed.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2 mt-1">
                  <CheckCircle className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Integration with Existing CRM
                  </h4>
                  <p className="text-gray-300">
                    Connect with HubSpot, Pipedrive, Salesforce. Automatic
                    synchronization of contacts and opportunities.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-600 rounded-full p-2 mt-1">
                  <CheckCircle className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Reusable Templates
                  </h4>
                  <p className="text-gray-300">
                    Save prompts that work and reuse them in new companies.
                    Growing library of tested templates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg">
            <h3 className="text-2xl font-semibold text-white mb-6">
              Proven ROI
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-300">Time saved/day:</span>
                <span className="text-green-400 font-semibold">4 hours</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-300">Response rate:</span>
                <span className="text-green-400 font-semibold">+700%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-300">Extra sales/month:</span>
                <span className="text-green-400 font-semibold">+300%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-700">
                <span className="text-gray-300">Average ROI:</span>
                <span className="text-green-400 font-semibold">1,200%</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-300">Payback:</span>
                <span className="text-green-400 font-semibold">3 days</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">
                💰 <strong>Typical result:</strong> Sales rep who makes
                $50k/month now makes $150k/month with the same client base.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Pricing
const PricingSection = () => {
  return (
    <section id="precos" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Plans that pay for themselves
          </h2>
          <p className="text-xl text-gray-300">
            Start free, pay only when you&apos;re selling more
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-4">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$97</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                50 companies/month
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />5
                personalized templates
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Unlimited emails
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Email support
              </li>
            </ul>
            <button className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg">
              🚀 Start Free
            </button>
          </div>

          <div className="bg-green-900/20 border-2 border-green-500 p-8 rounded-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Professional
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$297</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                500 companies/month
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Unlimited templates
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Bulk research
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                CRM integration
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Priority support
              </li>
            </ul>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
              🚀 Start Now
            </button>
          </div>

          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Enterprise
            </h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$997</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Unlimited companies
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Multiple users
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Custom API
              </li>
              <li className="flex items-center text-gray-300">
                <CheckCircle className="text-green-400 mr-2" size={20} />
                Dedicated support
              </li>
            </ul>
            <button className="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg">
              💼 Talk to Sales
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400">
            ✅ 7 days free • ✅ Cancel anytime • ✅ No hidden fees
          </p>
        </div>
      </div>
    </section>
  );
};

// CTA Final
const CtaSection = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to boost your sales?
        </h2>
        <p className="text-xl text-gray-300 mb-8">
          Don&apos;t let your team get bogged down in manual tasks. Try AI Sales
          Dashboard and transform your sales process into a conversion machine.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignUpButton mode="modal">
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              🚀 Start Now - It&apos;s Free!
            </button>
          </SignUpButton>
          <button className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl">
            📅 Schedule Demo
          </button>
        </div>

        <div className="mt-8 text-gray-400">
          <p>🚀 Setup in 2 minutes • 💰 Guaranteed ROI • 🛡️ Secure data</p>
        </div>
      </div>
    </section>
  );
};

// FAQ
const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How does AI Sales Dashboard differ from traditional tools?",
      a: "Our exclusive features – interactive tile dashboards, AI-powered copy generation, CRM context-based personalization and credit systems – enable much more robust automation. Instead of just scheduling tasks, our AI researches, filters and suggests the best actions for each lead.",
    },
    {
      q: "Is it hard to implement? Do I need technical knowledge?",
      a: "Not at all. The platform was designed to be used by any sales team member. No programming or complex configuration required: just connect your CRM (Salesforce, HubSpot etc.) and use our web interface.",
    },
    {
      q: "How does the credit system work?",
      a: "AI Sales Dashboard is based on a pay-as-you-go model. Each AI interaction – whether an email generated, lead research or document analysis – consumes credits. You buy credit packages according to your operation size.",
    },
    {
      q: "What results can I expect?",
      a: "Market data indicates up to 10-20% increase in sales ROI, and our customers see 4x to 5x improvement in qualified meetings. You'll be able to redirect saved time to high-impact strategies.",
    },
    {
      q: "Is my data secure?",
      a: "Yes! We use end-to-end encryption and total isolation between workspaces. Your data is never shared between clients.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-lg">
              <button
                className="w-full text-left p-6 flex justify-between items-center"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="text-white font-semibold">{faq.q}</span>
                <ChevronRight
                  className={`text-gray-400 transition-transform ${
                    openFaq === index ? "rotate-90" : ""
                  }`}
                  size={20}
                />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-300">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
