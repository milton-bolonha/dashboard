"use client";

import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import Button from "../ui/Button";
import { Input } from "../ui/Input";

export function UsersList() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [viewMode, setViewMode] = useState("cards"); // cards | table

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/users/list?limit=200`);

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats);
    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error);
      setUsers([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(filter.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(filter.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(filter.toLowerCase());

    const matchesPlan =
      planFilter === "all" ||
      (planFilter === "active" && user.isActiveCustomer) ||
      (planFilter === "inactive" && !user.isActiveCustomer) ||
      user.currentPlans?.includes(planFilter);

    return matchesSearch && matchesPlan;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "totalSpent":
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      case "email":
        return a.email?.localeCompare(b.email) || 0;
      case "planCount":
        return (b.planCount || 0) - (a.planCount || 0);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getPlanBadgeColor = (plan) => {
    const colors = {
      cupido: "bg-pink-100 text-pink-800 border-pink-200",
      afrodite: "bg-purple-100 text-purple-800 border-purple-200",
      zeus: "bg-yellow-100 text-yellow-800 border-yellow-200",
      premium: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return colors[plan] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando usuários...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
                <p className="text-sm text-gray-600">Total Usuários</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeCustomers}
                </p>
                <p className="text-sm text-gray-600">Com Planos</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600">Revenue Total</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversionRate}
                </p>
                <p className="text-sm text-gray-600">Conversão</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="🔍 Buscar por nome ou email..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full"
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">📋 Todos os Status</option>
            <option value="active">✅ Com Planos Ativos</option>
            <option value="inactive">❌ Sem Planos</option>
            <option value="cupido">💖 Plano Cupido</option>
            <option value="afrodite">💜 Plano Afrodite</option>
            <option value="zeus">⚡ Plano Zeus</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">📅 Mais Recentes</option>
            <option value="totalSpent">💰 Maior Gasto</option>
            <option value="email">📧 Por Email</option>
            <option value="planCount">📊 Mais Planos</option>
          </select>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "cards"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🎴 Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded text-sm font-medium ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📊 Tabela
            </button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Mostrando {sortedUsers.length} de {users.length} usuários
        </p>
        <Button onClick={loadUsers} variant="secondary" className="text-sm">
          🔄 Atualizar
        </Button>
      </div>

      {/* Users List */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedUsers.map((user) => (
            <Card
              key={user.clerkId}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              {/* User Header */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email?.split("@")[0]}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    user.isActiveCustomer ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              </div>

              {/* Plans */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Planos Ativos:
                </p>
                {user.currentPlans && user.currentPlans.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.currentPlans.map((plan) => (
                      <span
                        key={plan}
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadgeColor(
                          plan
                        )}`}
                      >
                        {plan}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    Nenhum plano ativo
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(user.totalSpent)}
                  </p>
                  <p className="text-xs text-gray-600">Total Gasto</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {user.planCount || 0}
                  </p>
                  <p className="text-xs text-gray-600">Planos</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Criado: {formatDate(user.createdAt)}</span>
                  <span>Login: {formatDate(user.lastSignInAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Planos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gasto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr key={user.clerkId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {user.firstName?.[0] ||
                            user.email?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email?.split("@")[0]}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.currentPlans && user.currentPlans.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.currentPlans.map((plan) => (
                            <span
                              key={plan}
                              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadgeColor(
                                plan
                              )}`}
                            >
                              {plan}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActiveCustomer
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isActiveCustomer ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastSignInAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {sortedUsers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou adicionar novos usuários ao sistema.
            </p>
            <Button
              onClick={() => {
                setFilter("");
                setPlanFilter("all");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
