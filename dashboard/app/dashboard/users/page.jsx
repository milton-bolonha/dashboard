import { UsersList } from "../../../components/users/UsersList";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">👥 Gerenciar Usuários</h1>
            <p className="text-blue-100">
              Visualize usuários, planos ativos, transações e triangulação
              completa Clerk + Stripe
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold">🔺</div>
              <div className="text-sm text-blue-100">Triangulação</div>
              <div className="text-xs text-blue-200">Clerk↔Stripe↔DB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <UsersList />
    </div>
  );
}
