"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { UserDashboard } from "@/components/UserDashboard";

// Esta é a página principal que os usuários veem após o login,
// dentro do layout do dashboard.
export default function DashboardPage() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    // O layout já mostra um spinner, mas podemos ter um aqui também
    return <div>Carregando...</div>;
  }

  if (!isSignedIn) {
    // Isso não deve acontecer devido ao middleware, mas é uma proteção
    return (
      <div>
        <p>Você precisa estar logado para ver esta página.</p>
        <Link href="/">Voltar para a Home</Link>
      </div>
    );
  }

  // Passamos o objeto do usuário para o componente de dashboard principal
  return <UserDashboard user={user} />;
}
