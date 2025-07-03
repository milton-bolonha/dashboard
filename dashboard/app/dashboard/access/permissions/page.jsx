"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ActivateKeyButton } from "@/components/access-keys/ActivateKeyModal";

const IconUserCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 text-gray-400"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z"
      clipRule="evenodd"
    />
  </svg>
);

const IconShieldCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export default function PermissionsPage() {
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const [permissions, setPermissions] = useState([]);
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (user && currentWorkspace) {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/access/user-permissions?workspaceId=${currentWorkspace._id}`
          );
          if (response.ok) {
            const data = await response.json();
            setPermissions(data.permissions || []);
            setLimits(data.limits || {});
          }
        } catch (error) {
          console.error("Failed to fetch permissions", error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchPermissions();
  }, [user, currentWorkspace]);

  const userRole = currentWorkspace?.members.find(
    (m) => m.userId === user?.id
  )?.role;

  return (
    <div className="p-6">
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Acessos e Permissões
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Revise suas permissões e limites atuais neste workspace.
          </p>
        </div>
        <ActivateKeyButton className="bg-blue-600 hover:bg-blue-700 font-semibold cursor-pointer" />
      </header>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-6">
          <IconUserCircle />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.fullName}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {user?.primaryEmailAddress.emailAddress}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seu Role:
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 capitalize">
                {userRole || "Carregando..."}
              </span>
              {user?.publicMetadata?.role === "superadmin" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  Super Admin
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Coluna de Permissões */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Permissões Ativas
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ações que você pode realizar no sistema.
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-gray-500 dark:text-gray-400">
              Carregando permissões...
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800 max-h-96 overflow-y-auto p-6">
              {permissions.length > 0 ? (
                permissions.sort().map((p) => (
                  <li key={p} className="py-3 flex items-center gap-3">
                    <IconShieldCheck className="text-green-500" />
                    <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                      {p}
                    </span>
                  </li>
                ))
              ) : (
                <li className="py-3 text-gray-500 dark:text-gray-400">
                  Nenhuma permissão específica encontrada.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Coluna de Limites */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Limites do Plano
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recursos disponíveis no plano atual.
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-gray-500 dark:text-gray-400">
              Carregando limites...
            </p>
          ) : (
            <dl className="divide-y divide-gray-200 dark:divide-gray-800 p-6">
              {Object.entries(limits).map(([key, value]) => (
                <div key={key} className="py-3 grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </dt>
                  <dd className="text-sm text-gray-900 dark:text-white col-span-2 font-semibold">
                    {value === -1 ? "Ilimitado" : value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
