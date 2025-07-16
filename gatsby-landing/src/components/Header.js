import React, { useState, useEffect } from "react";
import { Link } from "gatsby";
import {
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Header = ({ menu = {}, contact = {}, logo = {} }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: menuData = {} } = menu;
  const { data: contactData = [] } = contact;
  const { data: logoData = {} } = logo;

  // Fecha o menu se a janela for redimensionada para uma largura maior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContactInfo = (isMobile = false) => (
    <div
      className={`flex ${
        isMobile
          ? "flex-col space-y-4 text-left"
          : "flex-wrap justify-end gap-5"
      }`}
    >
      {contactData.map((item, index) => {
        const IconComponent =
          { phone: PhoneIcon, email: EnvelopeIcon, clock: ClockIcon }[
            item.icon
          ] || PhoneIcon;
        return (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <IconComponent
              className={`h-5 w-5 ${
                isMobile ? "text-white" : "text-blue-500"
              } flex-shrink-0`}
            />
            <span className={isMobile ? "text-white" : "text-gray-600"}>
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full max-w-8xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logoData.src && (
              <Link to="/" aria-label="Voltar para a página inicial">
                <img
                  src={logoData.src}
                  alt={logoData.alt || "Logo"}
                  className="h-16 w-auto"
                />
              </Link>
            )}
          </div>

          {/* Menu Desktop */}
          <nav className="hidden md:flex justify-center">
            {menuData.items && (
              <ul className="flex items-center gap-x-6">
                {menuData.items.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.link}
                      className="text-gray-600 hover:text-blue-600 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </nav>

          {/* Contato Desktop */}
          <div className="hidden md:flex justify-end">
            {renderContactInfo()}
          </div>

          {/* Botão Hambúrguer */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Abrir menu"
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Móvel */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-blue-600 text-white p-4 animate-fade-in-down overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 80px)" }} // 80px é uma estimativa da altura do header
        >
          <nav className="mb-4">
            <ul className="flex flex-col space-y-2">
              {menuData.items.map((item, index) => (
                <li key={index}>
                  <a
                    href={item.link}
                    className="block py-2 text-base font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-blue-500 pt-4">
            {renderContactInfo(true)}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
