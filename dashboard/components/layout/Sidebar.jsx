import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { CompanyList } from "@/components/ui/CompanyList";
import { ContactList } from "@/components/ui/ContactList";

export default function Sidebar({
  workspaceName = "Deel",
  isCollapsed,
  toggle,
  onAddCompany,
  onAddContact,
  companies = [],
  contacts = [],
  selectedCompany,
  selectedContact,
  onCompanyClick,
  onContactClick,
}) {
  const { isSignedIn } = useUser();

  const navLinkClasses = `flex items-center space-x-3 text-[#6B6B6B] hover:text-black transition-colors py-2 px-2 rounded-md`;
  const activeNavLinkClasses = `flex items-center justify-between text-black font-medium py-2 px-2 rounded-md bg-gray-200`;

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#efefef] p-4 flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex items-center justify-between mb-8 w-full ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center space-x-2 ${
            isCollapsed ? "hidden" : "flex"
          }`}
        >
          <span className="font-semibold text-lg">{workspaceName}</span>
          <Image
            src="/images/down-arrow.svg"
            width={16}
            height={16}
            alt="Switch workspace"
          />
        </div>
        <button
          onClick={toggle}
          className="p-1 cursor-pointer hover:bg-gray-200 rounded transition-colors"
        >
          <Image
            src="/images/hamburger.svg"
            width={20}
            height={20}
            alt="Collapse sidebar"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {/* Menu de Ações - Esconder completamente quando collapsed */}
        {!isCollapsed && (
          <>
            {companies.length === 0 && contacts.length === 0 && (
              <h3 className="text-xs text-gray-500 uppercase tracking-wider px-2 pt-2 pb-1">
                Actions
              </h3>
            )}
            <Link href="#" className={navLinkClasses}>
              <Image
                src="/images/coin.svg"
                width={16}
                height={16}
                alt="Earn Credits"
              />
              <span>Earn Credits</span>
            </Link>
            <Link href="#" className={navLinkClasses}>
              <span>Invite Friends</span>
            </Link>
            <Link href="#" className={navLinkClasses}>
              <span>Suggest Features</span>
            </Link>
          </>
        )}

        {/* Seções Principais */}
        <div className="pt-4">
          {/* Companies Section - Só mostrar quando não collapsed */}
          {!isCollapsed && (
            <>
              {companies.length === 0 && (
                <h3 className="text-xs text-gray-500 uppercase tracking-wider px-2 pt-2 pb-1">
                  Companies
                </h3>
              )}
              <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-100 transition-colors">
                <Link href="#" className="flex items-center space-x-3">
                  <Image
                    src="/images/company.svg"
                    width={16}
                    height={16}
                    alt="Companies"
                  />
                  <span>Companies</span>
                </Link>
                <button
                  onClick={onAddCompany}
                  className="p-1 hover:bg-gray-300 rounded cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </>
          )}

          {/* Companies List */}
          {!isCollapsed && companies.length > 0 && (
            <div className="pt-2">
              <CompanyList
                companies={companies}
                selectedCompany={selectedCompany}
                onCompanyClick={onCompanyClick}
              />
            </div>
          )}

          {/* Contacts Section */}
          {!isCollapsed && (
            <div className="pt-4">
              <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-gray-100 transition-colors">
                <Link href="#" className="flex items-center space-x-3">
                  <Image
                    src="/images/contact.svg"
                    width={16}
                    height={16}
                    alt="Contacts"
                  />
                  <span>Contacts</span>
                </Link>
                <button
                  onClick={onAddContact}
                  className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Contacts List */}
          {!isCollapsed && (
            <div className="pt-2">
              <ContactList
                contacts={contacts}
                selectedContact={selectedContact}
                onContactClick={onContactClick}
              />
            </div>
          )}
        </div>
      </nav>

      <div className="space-y-2">
        {/* Rodapé / Contas */}
        {isSignedIn ? (
          <>
            <Link
              href="/profile"
              className="flex items-center space-x-3 text-[#6B6B6B] hover:text-black transition-colors py-2"
            >
              <span>👤</span>
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center space-x-3 text-[#6B6B6B] hover:text-black transition-colors py-2"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </>
        ) : (
          <div className="text-center text-xs text-gray-500">
            Sign up to access your profile and settings.
          </div>
        )}
      </div>
    </aside>
  );
}
