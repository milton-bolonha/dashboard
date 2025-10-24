"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Linkedin } from "lucide-react";
import Image from "next/image";
import { OutreachTiles } from "@/components/contacts/OutreachTiles";

export function ContactModal({ isOpen, onClose, contact, company, context }) {
  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-40 cursor-pointer"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-[55%] bg-white shadow-2xl z-50 flex flex-col rounded-l-[16px] border-l border-[#bababa]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- Header --- */}
            <div className="flex-shrink-0 h-[72px] px-6 flex items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Image
                    src="/images/back.svg"
                    width={20}
                    height={20}
                    alt="Back"
                  />
                </button>
              </div>
              <h2 className="text-[24px] font-semibold text-gray-800 ml-6">
                {contact.name}
              </h2>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-grow p-6 overflow-y-auto bg-white">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Image
                    src="/images/contact.svg"
                    width={32}
                    height={32}
                    alt="Contact"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                    {contact.linkedinUrl && (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        <Linkedin className="w-3 h-3 mr-1" />
                        LinkedIn Profile →
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  Added {new Date(contact.added_at).toLocaleDateString()}
                </span>
              </div>

              {/* Outreach Tiles Section */}
              {company && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 text-lg border-b pb-2">
                    Contact Outreach
                  </h4>
                  <OutreachTiles
                    contact={contact}
                    company={company}
                    context={
                      context || {
                        companyTiles: company.tiles || [],
                        uploadedFiles: [],
                        notes: [],
                      }
                    }
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
