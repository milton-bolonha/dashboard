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
} from "lucide-react";
import "./home.css";

// Componente principal da Página
export default function Home() {
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
                className="btn-primary hidden sm:inline-block px-4 py-2 rounded-md text-sm font-semibold"
              >
                Acessar Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold text-secondary hover:text-blue-600">
                  Entrar
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn-primary px-4 py-2 rounded-md text-sm font-semibold">
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
        Um CMS para construir outros CMSs.
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-secondary">
        O DashMaster.PRO é a plataforma modular para criar Workspaces, Tipos de
        Conteúdo, Addons e Lógicas de Negócio com agilidade e profundidade.
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
            <SignUpButton mode="modal">
              <button className="btn-primary inline-flex items-center justify-center px-6 py-3 rounded-md shadow-sm text-base font-medium">
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="btn-secondary inline-flex items-center justify-center px-6 py-3 rounded-md text-base font-medium">
                Ver Documentação
              </button>
            </SignInButton>
          </>
        )}
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

            {/* Empresa Média */}
            <div className="home-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Empresa</h3>
                  <p className="text-green-600 font-medium">
                    Multi-Departamento
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-secondary">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>RH:</strong> Funcionários, Avaliações, Benefícios
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Vendas:</strong> Leads, Oportunidades, Propostas
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Marketing:</strong> Campanhas, Conteúdo, Analytics
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700 font-medium">
                  "Unificamos todos os departamentos em uma única plataforma.
                  ROI de 400% no primeiro ano."
                </p>
              </div>
            </div>

            {/* Startup */}
            <div className="home-card rounded-3xl p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">Startup</h3>
                  <p className="text-orange-600 font-medium">Growth Hacking</p>
                </div>
              </div>
              <div className="space-y-4 text-secondary">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Produto:</strong> Features, Bugs, Roadmap
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Growth:</strong> Experiments, Metrics, Funnels
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>
                    <strong>Investidores:</strong> Reports, KPIs, Updates
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                <p className="text-sm text-orange-700 font-medium">
                  "Conseguimos escalar de 0 a 10k usuários organizando todos os
                  dados de growth em um lugar só."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="home-card rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Setup em Minutos
            </h3>
            <p className="text-secondary">
              Crie Content Types, configure Sections com ícones personalizados e
              comece a trabalhar em menos de 5 minutos.
            </p>
          </div>

          <div className="home-card rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Multi-Workspace
            </h3>
            <p className="text-secondary">
              Gerencie múltiplos projetos ou clientes com isolamento completo,
              controle de acesso granular e billing separado.
            </p>
          </div>

          <div className="home-card rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-3">
              Enterprise Ready
            </h3>
            <p className="text-secondary">
              Stripe + Clerk integrados, API completa, roles avançados e
              escalabilidade automática para qualquer tamanho.
            </p>
          </div>
        </div>
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
              <SignUpButton mode="modal">
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
