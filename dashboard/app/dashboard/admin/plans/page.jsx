"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

// Ícones
const IconPlus = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const IconEdit = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5l12.232-12.232z"
    />
  </svg>
);

const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const IconSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default function PlansAdminPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperAdmin = user?.publicMetadata?.role === "superadmin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadPlans();
    }
  }, [isSuperAdmin]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/plans");
      if (response.ok) {
        setPlans(await response.json());
      } else {
        throw new Error("Falha ao carregar os planos.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (planId) => {
    // Lógica para abrir modal de edição
    console.log("Editar plano:", planId);
  };

  const handleDelete = async (planId) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    // Lógica para exclusão
    console.log("Excluir plano:", planId);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Acesso Restrito
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta área é restrita apenas para super administradores.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <IconSpinner />
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Carregando planos...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Planos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Crie e gerencie os planos de assinatura do sistema.
          </p>
        </div>
        <button
          onClick={() => console.log("Adicionar novo plano")}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconPlus />
          Novo Plano
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p>
            <strong>Erro:</strong> {error}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome do Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price ID (Mensal)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hierarquia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {plans.map((plan) => (
                <tr
                  key={plan._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">
                    {plan.stripePriceIds?.monthly || "Não definido"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {plan.hierarchy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleEdit(plan._id)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        title="Editar Plano"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        title="Excluir Plano"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && !loading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nenhum plano encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Comece adicionando um novo plano para o seu sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
