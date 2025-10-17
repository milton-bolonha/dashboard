import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { fetchPublicContent } from "@/lib/public-api";

export const revalidate = 60;

export default async function Page() {
  let content: any = null;
  try {
    content = await fetchPublicContent();
  } catch (e) {
    console.error("Conteúdo público indisponível", e);
  }

  return (
    <div className="dark" style={{ backgroundColor: "var(--bg-primary)" }}>
      <header
        className="home-header sticky top-0 z-50 pb-[75px] md:pb-0"
        style={{ position: "relative", backgroundColor: "transparent" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-40 sm:w-64">
                <Image
                  src="/images/logo-light.png"
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
          </div>
        </div>
      </header>

      <main>
        <section
          className="home-hero py-30 sm:py-42"
          style={{ backgroundColor: "var(--bg-primary)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-geologica brutal-heading">
              Construa seu{" "}
              <span
                className="diagonal-word"
                style={{ backgroundColor: "#A15DFF", color: "white" }}
              >
                Produto
              </span>{" "}
              em minutos
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300 font-poppins">
              Você ainda depende de devs pra lançar seu MVP? DashMaster.PRO é o
              criador mais rápido do mundo.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="https://dashmaster.pro/dashboard"
                className="cta-button inline-flex items-center justify-center rounded-md shadow-sm text-base font-medium"
              >
                Ir para o Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer
        className="border-t border-color"
        style={{ background: "#191919" }}
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-6">
            <Link
              href="#faq"
              className="text-sm text-gray-400 hover:text-white font-poppins transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="https://dashmaster.pro/dashboard"
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
    </div>
  );
}
