"use client";

import { useState } from "react";

export function IconPicker({ selectedIcon, onIconSelect, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);

  // 🎨 BIBLIOTECA DE ÍCONES SVG PROFISSIONAIS
  const iconLibrary = [
    // Conteúdo
    {
      icon: "document-text",
      name: "Posts/Artigos",
      category: "content",
      svg: (
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "newspaper",
      name: "Notícias",
      category: "content",
      svg: (
        <path
          fillRule="evenodd"
          d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "book-open",
      name: "Documentos",
      category: "content",
      svg: (
        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V4.804z" />
      ),
    },
    {
      icon: "photograph",
      name: "Galeria",
      category: "content",
      svg: (
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      ),
    },

    // E-commerce
    {
      icon: "shopping-bag",
      name: "Produtos",
      category: "ecommerce",
      svg: (
        <path
          fillRule="evenodd"
          d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V5a2 2 0 114 0v1H8zm-1 3a1 1 0 112 0 1 1 0 01-2 0zm7 0a1 1 0 01-2 0 1 1 0 112 0z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "tag",
      name: "Categorias",
      category: "ecommerce",
      svg: (
        <path
          fillRule="evenodd"
          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "shopping-cart",
      name: "Carrinho",
      category: "ecommerce",
      svg: (
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      ),
    },
    {
      icon: "credit-card",
      name: "Pagamentos",
      category: "ecommerce",
      svg: <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />,
    },

    // Pessoas
    {
      icon: "user",
      name: "Usuários",
      category: "people",
      svg: (
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "user-group",
      name: "Equipe",
      category: "people",
      svg: (
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
      ),
    },
    {
      icon: "users",
      name: "Clientes",
      category: "people",
      svg: (
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      ),
    },

    // Projetos
    {
      icon: "clipboard-list",
      name: "Projetos",
      category: "projects",
      svg: (
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "check-circle",
      name: "Tarefas",
      category: "projects",
      svg: (
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "chart-bar",
      name: "Relatórios",
      category: "projects",
      svg: (
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      ),
    },

    // Comunicação
    {
      icon: "chat",
      name: "Mensagens",
      category: "communication",
      svg: (
        <path
          fillRule="evenodd"
          d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "mail",
      name: "Email",
      category: "communication",
      svg: (
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      ),
    },

    // Outros
    {
      icon: "star",
      name: "Favoritos",
      category: "other",
      svg: (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      ),
    },
    {
      icon: "lock-closed",
      name: "Privado",
      category: "other",
      svg: (
        <path
          fillRule="evenodd"
          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "cog",
      name: "Configurações",
      category: "other",
      svg: (
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      ),
    },
    {
      icon: "folder",
      name: "Pasta",
      category: "other",
      svg: (
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      ),
    },
  ];

  const categories = {
    content: "Conteúdo",
    ecommerce: "E-commerce",
    people: "Pessoas",
    projects: "Projetos",
    communication: "Comunicação",
    other: "Outros",
  };

  const handleIconSelect = (iconKey) => {
    onIconSelect(iconKey);
    setIsOpen(false);
  };

  const getCurrentIcon = () => {
    const found = iconLibrary.find((item) => item.icon === selectedIcon);
    return found || iconLibrary.find((item) => item.icon === "folder");
  };

  const currentIcon = getCurrentIcon();

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Ícone da Section
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {currentIcon.svg}
          </svg>
          <span className="text-sm">{currentIcon.name}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {Object.entries(categories).map(([categoryKey, categoryName]) => {
            const categoryIcons = iconLibrary.filter(
              (item) => item.category === categoryKey
            );

            if (categoryIcons.length === 0) return null;

            return (
              <div key={categoryKey} className="p-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                  {categoryName}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {categoryIcons.map((item) => (
                    <button
                      key={item.icon}
                      type="button"
                      onClick={() => handleIconSelect(item.icon)}
                      className={`p-3 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center ${
                        selectedIcon === item.icon
                          ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                          : ""
                      }`}
                      title={item.name}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {item.svg}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
