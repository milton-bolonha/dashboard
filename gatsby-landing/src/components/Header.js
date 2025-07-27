import React, { useState, useEffect } from "react";
import { Link } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
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
      if (window.innerWidth >= 1280) {
        // xl breakpoint
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContactInfo = (isMobile = false) => (
    <div
      className={`flex w-full ${
        isMobile
          ? "flex-col space-y-4 text-left"
          : "flex-wrap-reverse justify-end gap-5"
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
              className={`h-5 w-5 flex-shrink-0 ${
                isMobile ? "text-white" : "text-blue-500"
              }`}
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
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" aria-label="Voltar para a página inicial">
              {logoData?.childImageSharp ? (
                <GatsbyImage
                  image={getImage(logoData)}
                  alt={logoData?.alt || "Company Logo"}
                  style={{ height: 64, width: "auto" }}
                  quality={100}
                />
              ) : (
                <img
                  src="/images/logo.png"
                  alt="Default Company Logo"
                  style={{ height: 64 }}
                />
              )}
            </Link>
          </div>

          {/* Menu Desktop */}
          <nav className="hidden xl:flex justify-center">
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
          <div
            className="hidden xl:flex justify-end"
            style={{ maxWidth: "500px" }}
          >
            {renderContactInfo()}
          </div>

          {/* Botão Hambúrguer */}
          <div className="xl:hidden flex items-center">
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
          className="xl:hidden bg-blue-600 text-white p-4 animate-fade-in-down overflow-y-auto"
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
