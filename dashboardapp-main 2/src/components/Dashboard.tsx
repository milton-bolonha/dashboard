"use client";

import React, { useState, useEffect, useRef } from "react";
import { Company, Dashboard as DashboardType, User, Contact } from "@/types";
import { UserMenu } from "@/components/user/UserMenu";
import { TileGrid } from "@/components/TileGrid";
import { TileComponent } from "@/components/TileComponent";
import { AddCompanyModal } from "@/components/AddCompanyModal";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { EditContactModal } from "@/components/contacts/EditContactModal";
import { EditCompanyModal } from "@/components/companies/EditCompanyModal";
import { AddContactModal } from "@/components/AddContactModal";
import { BulkUploadModal } from "@/components/BulkUploadModal";
import { FileUpload, FileList } from "@/components/FileUpload";
import { useDashboard } from "@/hooks/useDashboard";
import { toast } from "react-hot-toast";
import {
  XMarkIcon,
  ArrowPathIcon,
  BookmarkSquareIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { PlusIcon as PlusIconSolid } from "@heroicons/react/24/solid";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { capitalizeWords } from "@/utils/stringUtils";
import { db } from "@/lib/firebase";
import { aiService } from "@/lib/ai";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Modal } from "@/components/ui/Modal";

interface DashboardProps {
  companies: Company[];
  defaultDashboard: DashboardType | null;
  user: User;
}

export default function Dashboard({
  companies,
  defaultDashboard,
  user,
}: DashboardProps) {
  const {
    selectedCompany,
    selectedContact,
    selectedDashboard,
    setSelectedCompany,
    setSelectedContact,
    setSelectedDashboard,
    updateTiles,
    tiles,
    isLoading,
    error,
  } = useDashboard();
  const { signOutUser } = useAuth();
  const router = useRouter();

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [companyList, setCompanyList] = useState<Company[]>(companies);
  const [recentlyVisitedCompanies, setRecentlyVisitedCompanies] = useState<
    Company[]
  >([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [recentlyVisitedLoaded, setRecentlyVisitedLoaded] = useState(false);
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [dashboardsLoading, setDashboardsLoading] = useState(false);
  const [tilesLoading, setTilesLoading] = useState(false);
  const [showDashDropdown, setShowDashDropdown] = useState(false);
  const [newDashName, setNewDashName] = useState("");
  const [viewMode, setViewMode] = useState<
    "dashboard" | "companies" | "contacts"
  >("dashboard");
  const [showDashPanel, setShowDashPanel] = useState(false);
  const [dashSearch, setDashSearch] = useState("");
  const dashDropdownRef = useRef<HTMLDivElement | null>(null);
  const [showCreateDash, setShowCreateDash] = useState(false);
  const [createDashName, setCreateDashName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const askEnsuredRef = useRef<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const companyDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContactDropdown) {
        const target = event.target as Element;
        if (!target.closest(".contacts-dropdown")) {
          setShowContactDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showContactDropdown]);

  // Close company dropdown on outside click / Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showCompanyDropdown) return;
      const target = e.target as Element;
      const root = companyDropdownRef.current;
      if (root && !root.contains(target)) setShowCompanyDropdown(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCompanyDropdown(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showCompanyDropdown]);

  // Close dashboard dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!showDashDropdown) return;
      const target = e.target as Element;
      const root = dashDropdownRef.current;
      if (root && !root.contains(target)) {
        setShowDashDropdown(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDashDropdown(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showDashDropdown]);

  // Set initial dashboard
  useEffect(() => {
    if (defaultDashboard && !selectedDashboard) {
      setSelectedDashboard(defaultDashboard);
    }
  }, [defaultDashboard, selectedDashboard, setSelectedDashboard]);

  // Load recently visited companies from database
  useEffect(() => {
    const loadRecentlyVisited = async () => {
      if (!user.id || companyList.length === 0 || recentlyVisitedLoaded) return;

      try {
        console.log("Loading recently visited companies for user:", user.id);
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const recentCompanyIds = userData.recentlyVisitedCompanies || [];
          console.log(
            "Found recent company IDs in database:",
            recentCompanyIds
          );

          if (recentCompanyIds.length > 0) {
            // Get company details for the recent company IDs
            const recentCompanies = companyList.filter((company) =>
              recentCompanyIds.includes(company.id)
            );
            console.log(
              "Found recent companies:",
              recentCompanies.map((c) => c.name)
            );
            if (recentCompanies.length > 0) {
              setRecentlyVisitedCompanies(recentCompanies);
              setRecentlyVisitedLoaded(true);
              return;
            }
          }
        }

        // If no recent companies in database or user document doesn't exist, use first 5 from company list
        console.log("No recent companies found, using first 5 companies");
        setRecentlyVisitedCompanies(companyList.slice(0, 5));
        setRecentlyVisitedLoaded(true);
      } catch (error) {
        console.error("Error loading recently visited companies:", error);
        // Fallback to first 5 companies
        setRecentlyVisitedCompanies(companyList.slice(0, 5));
        setRecentlyVisitedLoaded(true);
      }
    };

    loadRecentlyVisited();
  }, [user.id, companyList, recentlyVisitedLoaded]);

  // Dashboards list for company; create default "Dashboard Template 1" if none
  useEffect(() => {
    if (!selectedCompany) return;
    setDashboardsLoading(true);
    const dq = query(
      collection(db, "dashboards"),
      where("userId", "==", user.id),
      where("companyId", "==", selectedCompany.id)
    );
    const unsub = onSnapshot(dq, async (snap) => {
      if (snap.empty) {
        const ref = await addDoc(collection(db, "dashboards"), {
          name: "Dashboard Template 1",
          template: "template-1",
          background: null,
          backgroundImage: null,
          isPublic: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.id,
          companyId: selectedCompany.id,
        });
        const dash: DashboardType = {
          id: ref.id,
          name: "Dashboard Template 1",
          template: "template-1",
          background: null,
          backgroundImage: null,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.id,
          companyId: selectedCompany.id,
          tiles: [],
        } as any;

        // Create Dashboard Template 2
        const ref2 = await addDoc(collection(db, "dashboards"), {
          name: "Dashboard Template 2",
          template: "template-2",
          background: null,
          backgroundImage: null,
          isPublic: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userId: user.id,
          companyId: selectedCompany.id,
        });

        // Create Dashboard Template 2 object
        const dash2: DashboardType = {
          id: ref2.id,
          name: "Dashboard Template 2",
          template: "template-2",
          background: null,
          backgroundImage: null,
          isPublic: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.id,
          companyId: selectedCompany.id,
          tiles: [],
        } as any;

        // Sort dashboards by created_at in ascending order (oldest first)
        const sortedDashboards = [dash, dash2].sort((a, b) => {
          // Handle different timestamp formats
          const getTime = (timestamp: any) => {
            if (timestamp instanceof Date) {
              return timestamp.getTime();
            } else if (timestamp && timestamp.toDate) {
              // Firestore Timestamp
              return timestamp.toDate().getTime();
            } else if (timestamp && timestamp.seconds) {
              // Firestore Timestamp with seconds
              return (
                timestamp.seconds * 1000 +
                (timestamp.nanoseconds || 0) / 1000000
              );
            } else {
              return new Date(timestamp).getTime();
            }
          };

          const aTime = getTime(a.createdAt);
          const bTime = getTime(b.createdAt);
          return aTime - bTime; // Ascending order (oldest first)
        });

        setDashboards(sortedDashboards);
        setSelectedDashboard(sortedDashboards[0]); // Select the oldest dashboard (first in sorted list)

        // Seed tiles for both templates and generate initial content for each tile
        try {
          const { TEMPLATE_1, TEMPLATE_2 } = require("@/lib/templates");

          // Helper function to generate dynamic title
          const generateDynamicTitle = async (
            prompt: string,
            companyName: string
          ): Promise<string> => {
            try {
              const titlePrompt = `Based on this prompt: "${prompt}" for company "${companyName}", generate a concise, professional title (maximum 4 words) that captures the essence of what this prompt is asking for. Return only the title, no quotes or extra text.`;

              const resp = await fetch("/api/ai/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: titlePrompt }),
              });

              if (resp.ok) {
                const data = await resp.json();
                if (typeof data?.content === "string") {
                  return data.content.trim().replace(/['"]/g, "");
                }
              }
            } catch (_) {
              // Fallback to original title if AI generation fails
            }
            return "Custom Prompt";
          };

          // Create tiles for Template 1
          await Promise.all(
            TEMPLATE_1.map(async (t: any, idx: number) => {
              const dynamicTitle = await generateDynamicTitle(
                t.prompt,
                selectedCompany.name
              );

              const createdRef = await addDoc(collection(db, "tiles"), {
                title: dynamicTitle,
                prompt: t.prompt,
                content: null,
                position: idx,
                size: "medium",
                type: "prompt",
                color: "white",
                isFlipped: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                userId: user.id,
                dashboardId: ref.id,
                companyId: selectedCompany.id,
              });

              // Generate AI content for this tile
              try {
                const scopedPrompt = `Company: ${selectedCompany.name}. ${t.prompt}`;
                let content = "";
                try {
                  const resp = await fetch("/api/ai/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: scopedPrompt }),
                  });
                  const data = await resp.json();
                  if (resp.ok && typeof data?.content === "string") {
                    content = data.content;
                  } else {
                    const mock = await aiService.generateResponse(
                      scopedPrompt,
                      { user }
                    );
                    content = mock.content;
                  }
                } catch (_) {
                  const mock = await aiService.generateResponse(scopedPrompt, {
                    user,
                  });
                  content = mock.content;
                }
                await updateDoc(doc(db, "tiles", createdRef.id), {
                  content,
                  updatedAt: serverTimestamp(),
                });
                // Save history entry
                await addDoc(
                  collection(db, "tiles", createdRef.id, "history"),
                  {
                    prompt: scopedPrompt,
                    response: content,
                    createdAt: serverTimestamp(),
                    userId: user.id,
                    companyId: selectedCompany.id,
                  }
                );
              } catch (_) {}
            })
          );

          // Create tiles for Template 2
          await Promise.all(
            TEMPLATE_2.map(async (t: any, idx: number) => {
              const dynamicTitle = await generateDynamicTitle(
                t.prompt,
                selectedCompany.name
              );

              const createdRef = await addDoc(collection(db, "tiles"), {
                title: dynamicTitle,
                prompt: t.prompt,
                content: null,
                position: idx,
                size: "medium",
                type: "prompt",
                color: "white",
                isFlipped: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                userId: user.id,
                dashboardId: ref2.id,
                companyId: selectedCompany.id,
              });

              // Generate AI content for this tile
              try {
                const scopedPrompt = `Company: ${selectedCompany.name}. ${t.prompt}`;
                let content = "";
                try {
                  const resp = await fetch("/api/ai/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: scopedPrompt }),
                  });
                  const data = await resp.json();
                  if (resp.ok && typeof data?.content === "string") {
                    content = data.content;
                  } else {
                    const mock = await aiService.generateResponse(
                      scopedPrompt,
                      { user }
                    );
                    content = mock.content;
                  }
                } catch (_) {
                  const mock = await aiService.generateResponse(scopedPrompt, {
                    user,
                  });
                  content = mock.content;
                }
                await updateDoc(doc(db, "tiles", createdRef.id), {
                  content,
                  updatedAt: serverTimestamp(),
                });
                // Save history entry
                await addDoc(
                  collection(db, "tiles", createdRef.id, "history"),
                  {
                    prompt: scopedPrompt,
                    response: content,
                    createdAt: serverTimestamp(),
                    userId: user.id,
                    companyId: selectedCompany.id,
                  }
                );
              } catch (_) {}
            })
          );
        } catch (_) {}

        // After tile generation completes, keep the current view mode
        setDashboardsLoading(false);
        return;
      }
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as DashboardType[];

      // Sort dashboards by created_at in ascending order (oldest first)
      const sortedList = list.sort((a, b) => {
        // Handle different timestamp formats
        const getTime = (timestamp: any) => {
          if (timestamp instanceof Date) {
            return timestamp.getTime();
          } else if (timestamp && timestamp.toDate) {
            // Firestore Timestamp
            return timestamp.toDate().getTime();
          } else if (timestamp && timestamp.seconds) {
            // Firestore Timestamp with seconds
            return (
              timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
            );
          } else {
            return new Date(timestamp).getTime();
          }
        };

        const aTime = getTime(a.createdAt);
        const bTime = getTime(b.createdAt);
        return aTime - bTime; // Ascending order (oldest first)
      });

      console.log("sortedList", sortedList);
      setDashboards(sortedList);
      if (
        !selectedDashboard ||
        !sortedList.find((d) => d.id === selectedDashboard.id)
      ) {
        setSelectedDashboard(sortedList[0]);
      }
      setDashboardsLoading(false);
    });
    return () => unsub();
  }, [selectedCompany, user.id, refreshKey]);

  // Tiles subscription for selected dashboard
  useEffect(() => {
    if (!selectedCompany || !selectedDashboard) return;
    setTilesLoading(true);
    const tq = query(
      collection(db, "tiles"),
      where("userId", "==", user.id),
      where("companyId", "==", selectedCompany.id),
      where("dashboardId", "==", selectedDashboard.id)
    );
    const unsub = onSnapshot(tq, (snap) => {
      const mapped = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .sort((a: any, b: any) => {
          const aAsk = a.prompt === "__bulk__" ? -1 : 0;
          const bAsk = b.prompt === "__bulk__" ? -1 : 0;
          if (aAsk !== bAsk) return aAsk - bAsk;
          return (a.position ?? 0) - (b.position ?? 0);
        });
      updateTiles(mapped as any);
      // Ensure there is always a blank chat tile as the first tile
      const dashId = selectedDashboard.id;
      const hasBlank = mapped.some((t: any) => t.prompt === "__bulk__");
      if (hasBlank) {
        askEnsuredRef.current[dashId] = true;
      }
      if (!hasBlank && !askEnsuredRef.current[dashId]) {
        try {
          addDoc(collection(db, "tiles"), {
            title: "",
            prompt: "__bulk__",
            content: null,
            position: -1,
            size: "medium",
            type: "prompt",
            color: "white",
            isFlipped: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            userId: user.id,
            dashboardId: selectedDashboard.id,
            companyId: selectedCompany.id,
          });
          askEnsuredRef.current[dashId] = true;
        } catch (_) {}
      }
      // If we just asked something, show it as a bubble in the Ask tile placeholder
      try {
        const last = localStorage.getItem(`ask:last:${selectedDashboard.id}`);
        if (last) {
          // No-op here; Ask tile component renders from history; we simply clear the flag
          localStorage.removeItem(`ask:last:${selectedDashboard.id}`);
        }
      } catch (_) {}
      setTilesLoading(false);
    });
    return () => unsub();
  }, [selectedCompany, selectedDashboard, user.id, updateTiles, refreshKey]);

  // Live-sync companies from Firestore for current user
  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "companies"),
          where("userId", "==", user.id)
        );
        const unsub = onSnapshot(q, (snap) => {
          const list: Company[] = [] as any;
          snap.forEach((d) => {
            const data = d.data() as any;
            list.push({
              id: d.id,
              name: data.name,
              url: data.url ?? null,
              description: data.description ?? null,
              industry: data.industry ?? null,
              size: data.size ?? null,
              location: data.location ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: data.userId,
            });
          });
          setCompanyList(list);
          setCompaniesLoading(false);
          // If no companies exist, clear selections and show the home screen
          if (list.length === 0) {
            setSelectedCompany(undefined);
            setSelectedDashboard(undefined);
            updateTiles([]);
            return;
          }
          // Select first on initial load, or if current selection disappeared
          if (
            !selectedCompany ||
            (selectedCompany && !list.find((c) => c.id === selectedCompany.id))
          ) {
            handleCompanySelect(list[0]);
          }
        });
        return () => unsub();
      } catch (_) {}
    };
    load();
  }, [user.id, refreshKey]);

  // Load files when company changes
  useEffect(() => {
    if (selectedCompany) {
      loadFiles();
      loadContacts();
    }
  }, [selectedCompany]);

  const loadContacts = () => {
    if (!selectedCompany) return;
    // Live Firestore subscription for contacts
    (async () => {
      try {
        const { collection, query, where, onSnapshot, orderBy } = await import(
          "firebase/firestore"
        );
        const { db } = await import("@/lib/firebase");
        const qy = query(
          collection(db, "contacts"),
          where("companyId", "==", selectedCompany.id)
        );
        // unsubscribe previous?
        onSnapshot(qy, (snap) => {
          const list: Contact[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name,
              jobTitle: data.jobTitle ?? null,
              email: data.email ?? null,
              linkedinUrl: data.linkedinUrl ?? null,
              insights: data.insights ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              userId: data.userId,
              companyId: data.companyId,
            };
          });
          setContacts(list);
        });
      } catch (_) {}
    })();
  };

  const handleCompanySelect = async (company: Company) => {
    console.log("Selecting company:", company.name);
    setSelectedCompany(company);
    setSelectedContact(undefined);
    setViewMode("dashboard");

    // Update recently visited companies (keep only 5 most recent)
    const updatedRecentCompanies = (() => {
      // Remove company if it already exists in the list
      const filtered = recentlyVisitedCompanies.filter(
        (c) => c.id !== company.id
      );
      // Add company to the beginning and keep only 5
      return [company, ...filtered].slice(0, 5);
    })();

    console.log(
      "Updated recent companies:",
      updatedRecentCompanies.map((c) => c.name)
    );
    setRecentlyVisitedCompanies(updatedRecentCompanies);

    // Save recently visited companies to database
    try {
      const userDocRef = doc(db, "users", user.id);
      const recentCompanyIds = updatedRecentCompanies.map((c) => c.id);
      console.log("Saving recent company IDs to database:", recentCompanyIds);

      await setDoc(
        userDocRef,
        {
          recentlyVisitedCompanies: recentCompanyIds,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("Successfully saved recently visited companies to database");
    } catch (error) {
      console.error("Error saving recently visited companies:", error);
    }

    // Immediately set a minimal dashboard so the main area isn't blank
    setSelectedDashboard({
      id: `dash-${company.id}`,
      name: "Dashboard Template 1",
      template: "template-1",
      background: null,
      backgroundImage: null,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      companyId: company.id,
      tiles: [],
    } as DashboardType);
    // Tiles will then stream in via the Firestore subscription
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Function to clear recently visited companies (for testing)
  const clearRecentlyVisited = async () => {
    try {
      const userDocRef = doc(db, "users", user.id);
      await setDoc(
        userDocRef,
        {
          recentlyVisitedCompanies: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setRecentlyVisitedCompanies([]);
      setRecentlyVisitedLoaded(false);
      console.log("Cleared recently visited companies");
    } catch (error) {
      console.error("Error clearing recently visited companies:", error);
    }
  };

  // Function to reload recently visited companies (for testing)
  const reloadRecentlyVisited = async () => {
    setRecentlyVisitedLoaded(false);
    console.log(
      "Reset recently visited loaded flag, will reload on next effect"
    );
  };

  const handleAddCompany = () => {
    setShowAddCompany(true);
  };

  const handleAddContact = () => {
    setShowAddContact(true);
  };

  const handleBulkUpload = async () => {
    if (!selectedCompany || !selectedDashboard) return;
    try {
      const hasBlank = tiles?.some(
        (t) =>
          t.dashboardId === selectedDashboard.id &&
          t.companyId === selectedCompany.id &&
          t.prompt === "__bulk__"
      );
      if (hasBlank) return;
      await addDoc(collection(db, "tiles"), {
        title: "",
        prompt: "__bulk__",
        content: null,
        position: -1,
        size: "medium",
        type: "prompt",
        color: "white",
        isFlipped: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: user.id,
        dashboardId: selectedDashboard.id,
        companyId: selectedCompany.id,
      });
    } catch (_) {}
  };

  const handleFileUpload = () => {
    setShowFileUpload(true);
  };

  const loadFiles = () => {
    if (!selectedCompany) return;

    // Use mock data directly
    const { mockFiles } = require("@/lib/mockData");
    setFiles(
      mockFiles.filter((file: any) => file.companyId === selectedCompany.id)
    );
  };

  const handleFileUploaded = (file: any) => {
    setFiles((prev) => [file, ...prev]);
  };

  const handleFileDeleted = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Top Header Bar - Fixed */}
      <header
        className={`bg-white dark:bg-gray-900 px-6 py-4 flex-shrink-0 transition-all duration-300 ${
          sidebarOpen ? "lg:ml-[235.8px] max-[1260px]:ml-0" : "ml-0"
        } ${showDashPanel ? "lg:mr-80" : "mr-0"}`}
      >
        <div className="flex items-center justify-between max-[600px]:flex-col max-[600px]:space-y-3 max-[900px]:justify-center">
          {/* Left side - Hamburger menu and breadcrumbs */}
          <div className="flex items-center space-x-4 max-[600px]:justify-center max-[600px]:w-full max-[900px]:justify-center">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  className="h-6 w-6 text-gray-700 dark:text-gray-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            {viewMode === "companies" ? (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  Companies
                </span>
              </div>
            ) : (
              selectedCompany && (
                <div className="flex items-center space-x-2 text-sm">
                  <button
                    onClick={() => setViewMode("companies")}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors"
                  >
                    Companies
                  </button>
                  <span className="text-gray-400 dark:text-gray-500">/</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {selectedCompany.name}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Right side - Dashboard switcher */}
          <div className="flex items-center space-x-2 max-[600px]:justify-center max-[600px]:w-full max-[900px]:justify-center">
            {viewMode !== "companies" && selectedCompany && (
              <>
                <button
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Refresh"
                  onClick={() => {
                    setRefreshing(true);
                    setRefreshKey((k) => k + 1);
                    setTimeout(() => setRefreshing(false), 700);
                  }}
                >
                  <ArrowPathIcon
                    className={`h-5 w-5 text-gray-600 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <button
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Save"
                  onClick={() => toast("Saved")}
                >
                  {/* <BookmarkSquareIcon className="h-5 w-5 text-gray-600" /> */}
                  <img src="/dashboard save icon.png" className="h-5 w-5" />
                </button>
                {/* Debug buttons for testing recently visited companies */}
                {/* <button
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Clear Recent Companies (Debug)"
                  onClick={clearRecentlyVisited}
                >
                  <span className="text-xs">Clear</span>
                </button> */}
                {/* <button
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Reload Recent Companies (Debug)"
                  onClick={reloadRecentlyVisited}
                >
                  <span className="text-xs">Reload</span>
                </button> */}
                <div className="relative" ref={dashDropdownRef}>
                  <button
                    onClick={() => setShowDashDropdown((v) => !v)}
                    className="inline-flex items-center p-1 px-3 font-bold rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-900"
                  >
                    <span className="truncate max-w-[220px]">
                      {selectedDashboard?.name || "Dashboards"}
                    </span>
                    <ChevronDownIcon className="h-4 w-4 ml-2" />
                  </button>
                  {showDashDropdown && (
                    <div className="absolute max-w-[230px] right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 py-1">
                      <div className="">
                        {dashboards.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => {
                              setSelectedDashboard(d);
                              setShowDashDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-[15px] ${
                              selectedDashboard?.id === d.id
                                ? "font-bold text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {d.name}
                          </button>
                        ))}
                      </div>
                      <div
                        className="px-4 py-2 text-sm italic text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                        onClick={() => {
                          setShowDashDropdown(false);
                          setShowDashPanel(true);
                        }}
                      >
                        View All
                      </div>
                      <button
                        onClick={() => {
                          setCreateDashName("");
                          setShowCreateDash(true);
                        }}
                        className="w-full text-left px-3 py-2 flex items-center space-x-2 font-bold hover:bg-gray-50"
                      >
                        <span className="inline-flex items-center text-blue-700 justify-center h-5 w-5 rounded-full bg-blue-600 text-white">
                          <PlusIconSolid className="h-3.5 w-3.5" />
                        </span>
                        <span>CREATE DASHBOARD</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-600 hover:text-gray-900"
                  title="Share"
                  onClick={() => toast("Share functionality coming soon")}
                >
                  Share
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Responsive */}
        <div
          className={`bg-gray-200 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-40 flex flex-col`}
          style={{ width: "235.8px" }}
        >
          <div
            className="flex flex-col h-full"
            style={{ backgroundColor: "#EFEFEF" }}
          >
            {/* Sidebar Top Bar with brand and menu */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2 px-4">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  loading...
                </span>
                <svg
                  className="h-4 w-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close sidebar"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* Quick Actions - Earn Credits (styled like sections) */}
            <div className="mx-3 mb-3">
              <div className="flex items-center justify-between mb-2 px-3 py-2 flex-shrink-0">
                <div className="flex items-center space-x-2 select-none">
                  <svg
                    className="h-4 w-4 text-orange-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <ellipse cx="12" cy="6" rx="6.5" ry="2.5"></ellipse>
                    <path d="M5.5 6v3.2c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V6"></path>
                    <path d="M5.5 9.2v3.2c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V9.2"></path>
                    <path d="M5.5 12.4V15c0 1.4 2.9 2.6 6.5 2.6S18.5 16.4 18.5 15v-2.6"></path>
                  </svg>
                  <h3 className="text-base font-medium text-gray-500 dark:text-gray-500">
                    Earn Credits
                  </h3>
                </div>
              </div>
              <div
                className="px-3 pb-2 space-y-0.5"
                style={{ paddingLeft: 24 }}
              >
                <button
                  onClick={() => toast("Invite Friends coming soon")}
                  className="w-full text-left px-6 py-1 text-base font-medium rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-500 dark:text-gray-500"
                >
                  <span className="truncate">Invite Friends</span>
                </button>
                <button
                  onClick={() => toast("Suggest Features coming soon")}
                  className="w-full text-left px-6 py-1 text-base font-medium rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-gray-500 dark:text-gray-500"
                >
                  <span className="truncate">Suggest Features</span>
                </button>
              </div>
            </div>

            {/* Main Content - Fixed height container */}
            <div className="flex-1 px-4 pb-4 pt-2 flex flex-col min-h-0">
              {/* Companies Section - Exactly Half Height */}
              <div className="flex-1 flex flex-col mb-4 min-h-0">
                <div
                  className="flex items-center justify-between mb-3 px-3 py-2 flex-shrink-0 cursor-pointer"
                  onClick={() => setViewMode("companies")}
                >
                  <div className="flex items-center space-x-2 select-none">
                    <svg
                      className="h-4 w-4 text-orange-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 20V6a2 2 0 012-2h7a2 2 0 012 2v14" />
                      <path d="M4 20h13M8 9h2M8 12h2M8 15h2M12 9h2M12 12h2M12 15h2" />
                    </svg>
                    <h3 className="text-base font-medium text-gray-500 dark:text-gray-500">
                      Companies
                    </h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddCompany(true);
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Add Company"
                  >
                    <PlusIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1 space-y-0.5" style={{ paddingLeft: 24 }}>
                  {recentlyVisitedCompanies.length > 0 ? (
                    recentlyVisitedCompanies.map((company) => (
                      <button
                        key={company.id}
                        onClick={() => handleCompanySelect(company)}
                        className="w-full text-left px-6 py-1 text-base font-medium rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-500"
                      >
                        {company.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-6 py-1 text-sm text-gray-400">
                      No recent companies
                    </div>
                  )}
                </div>
              </div>

              {/* Contacts Section - Exactly Half Height */}
              <div className="flex-1 flex flex-col min-h-0">
                <div
                  className="flex items-center justify-between mb-3 px-3 py-2 flex-shrink-0 cursor-pointer"
                  onClick={() => setViewMode("contacts")}
                >
                  <div className="flex items-center space-x-2 select-none">
                    <svg
                      className="h-4 w-4 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="5" y="4" width="14" height="16" rx="2" />
                      <circle cx="12" cy="11" r="2.2" />
                      <path d="M9 16c1.2-1 5.8-1 7 0" />
                      <path d="M5 8h-1M5 12h-1M5 16h-1" />
                    </svg>
                    <h3 className="text-base font-medium text-gray-500 dark:text-gray-500">
                      Contacts
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    title="Add Contact"
                  >
                    <PlusIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div
                  className="flex-1 overflow-y-auto space-y-0.5 min-h-0 scrollbar-hide"
                  style={{ paddingLeft: 24 }}
                >
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        handleContactSelect(contact);
                        setShowContactDropdown(false);
                      }}
                      className="w-full text-left px-6 py-1 text-base font-medium rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-500"
                    >
                      {contact.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Section - Distinguished from other sections */}
            <div
              className="p-4 flex-shrink-0 dark:border-gray-700 bg-gray-200 dark:bg-gray-800"
              style={{ backgroundColor: "#EFEFEF" }}
            >
              <div className="flex flex-col space-y-3">
                <UserMenu
                  userName={user?.name}
                  userEmail={user?.email}
                  onProfile={() => router.push("/profile")}
                  onSignOut={async () => {
                    try {
                      await signOutUser();
                      router.push("/auth/signin");
                    } catch {
                      toast.error("Failed to unsubscribe");
                    }
                  }}
                />
                {/* Settings Icon with Text */}
                <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="p-1 bg-gray-100 rounded-full">
                    <svg
                      className="h-4 w-4 text-gray-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            sidebarOpen ? "lg:ml-[235.8px] max-[1260px]:ml-0" : "ml-0"
          } ${showDashPanel ? "lg:mr-80" : "mr-0"}`}
        >
          {/* Dashboard Content - Scrollable */}
          <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 scrollbar-hide">
            <div
              className={`${
                sidebarOpen
                  ? "pl-32 max-[1260px]:pl-0"
                  : "pl-32 max-[1260px]:pl-0"
              }`}
            >
              {companiesLoading || dashboardsLoading || tilesLoading ? (
                <div className="flex items-center justify-center h-64 text-gray-600">
                  Loading…
                </div>
              ) : viewMode === "companies" ? (
                <div className="space-y-2">
                  <h1 className="text-xl font-semibold text-gray-900 ml-32 max-[1260px]:ml-0">
                    Companies
                  </h1>
                  <div className="max-w-3xl ml-36 max-[1260px]:ml-0">
                    <CompaniesTable
                      companies={companyList}
                      onAdd={() => setShowAddCompany(true)}
                      onEdit={(c) => setEditCompany(c)}
                      onDelete={async (c) => {
                        try {
                          const { deleteDoc, doc } = await import(
                            "firebase/firestore"
                          );
                          await deleteDoc(doc(db, "companies", c.id));
                          toast.success("Company deleted");
                        } catch (_) {
                          toast.error("Failed to delete");
                        }
                      }}
                      onSelect={handleCompanySelect}
                    />
                  </div>
                </div>
              ) : viewMode === "contacts" ? (
                <div className="space-y-2">
                  <h1 className="text-xl font-semibold text-gray-900 ml-32 max-[1260px]:ml-0">
                    Contacts
                  </h1>
                  <div className="max-w-3xl ml-36 max-[1260px]:ml-0">
                    <ContactsTable
                      contacts={contacts}
                      onAdd={() => setShowAddContact(true)}
                      onEdit={(c) => setEditingContact(c)}
                      onDelete={async (c) => {
                        try {
                          const { deleteDoc, doc } = await import(
                            "firebase/firestore"
                          );
                          const { db } = await import("@/lib/firebase");
                          await deleteDoc(doc(db, "contacts", c.id));
                        } catch (_) {}
                      }}
                    />
                  </div>
                </div>
              ) : selectedCompany && selectedDashboard ? (
                <div className="space-y-6">
                  {/* Company selector and Contacts Dropdown */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4 max-[900px]:justify-center">
                      {/* Company Dropdown */}
                      <div
                        className="relative inline-block"
                        ref={companyDropdownRef}
                      >
                        <button
                          onClick={() => setShowCompanyDropdown((v) => !v)}
                          className="inline-flex items-center text-2xl font-bold text-gray-900 dark:text-gray-100"
                        >
                          <span className="truncate max-w-[380px]">
                            {selectedCompany?.name
                              ? capitalizeWords(selectedCompany.name)
                              : "Select Company"}
                          </span>
                          <svg
                            className={`h-5 w-5 ml-2 transition-transform ${
                              showCompanyDropdown ? "rotate-180" : ""
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                          {selectedCompany && (
                            <span
                              className="ml-3 inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
                              style={{
                                backgroundColor: (() => {
                                  const score = (() => {
                                    const anyC: any = selectedCompany as any;
                                    if (
                                      typeof anyC.score === "number" &&
                                      anyC.score > 0
                                    )
                                      return Math.max(
                                        1,
                                        Math.min(5, Math.floor(anyC.score))
                                      );
                                    let sum = 0;
                                    for (
                                      let i = 0;
                                      i < selectedCompany.name.length;
                                      i++
                                    )
                                      sum =
                                        (sum +
                                          selectedCompany.name.charCodeAt(i)) %
                                        97;
                                    return (sum % 5) + 1;
                                  })();
                                  switch (score) {
                                    case 1:
                                    case 2:
                                      return "#F77969";
                                    case 3:
                                      return "#E8D20A";
                                    case 4:
                                    case 5:
                                      return "#0FB22A";
                                    default:
                                      return "#F77969";
                                  }
                                })(),
                              }}
                            >
                              {(() => {
                                const anyC: any = selectedCompany as any;
                                if (
                                  typeof anyC.score === "number" &&
                                  anyC.score > 0
                                )
                                  return Math.max(
                                    1,
                                    Math.min(5, Math.floor(anyC.score))
                                  );
                                let sum = 0;
                                for (
                                  let i = 0;
                                  i < selectedCompany.name.length;
                                  i++
                                )
                                  sum =
                                    (sum + selectedCompany.name.charCodeAt(i)) %
                                    97;
                                return (sum % 5) + 1;
                              })()}
                            </span>
                          )}
                        </button>
                        {showCompanyDropdown && (
                          <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-2">
                            <div className="relative mb-2">
                              <input
                                value={companySearch}
                                onChange={(e) =>
                                  setCompanySearch(e.target.value)
                                }
                                placeholder="Search..."
                                className="w-full pl-8 pr-3 py-2 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100"
                                style={{ color: "#7F7F7F" }}
                              />
                              <svg
                                className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                            </div>
                            <div className="max-h-64 overflow-y-auto scrollbar-hide">
                              {companySearch.trim().length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Type to search companies…
                                </div>
                              ) : (
                                (() => {
                                  const q = companySearch.trim().toLowerCase();
                                  const results = companyList.filter((c) =>
                                    c.name.toLowerCase().includes(q)
                                  );
                                  if (results.length === 0) {
                                    return (
                                      <div className="px-3 py-2 text-sm text-gray-500">
                                        No results
                                      </div>
                                    );
                                  }
                                  return results.map((c) => (
                                    <button
                                      key={c.id}
                                      onClick={() => {
                                        handleCompanySelect(c);
                                        setShowCompanyDropdown(false);
                                        setCompanySearch("");
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                                        selectedCompany?.id === c.id
                                          ? "font-semibold"
                                          : "text-gray-800 dark:text-gray-200"
                                      }`}
                                      style={
                                        selectedCompany?.id === c.id
                                          ? { color: "#C6C6C6" }
                                          : {}
                                      }
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        style={{ color: "#FFA492" }}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M4 20V6a2 2 0 012-2h7a2 2 0 012 2v14" />
                                        <path d="M4 20h13M8 9h2M8 12h2M8 15h2M12 9h2M12 12h2M12 15h2" />
                                      </svg>
                                      <span className="truncate">{c.name}</span>
                                    </button>
                                  ));
                                })()
                              )}
                            </div>
                            {/* Inline ask shortcut inside menu (optional) */}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contacts Dropdown */}
                    <div className="relative inline-block contacts-dropdown max-[900px]:justify-center">
                      <button
                        onClick={() =>
                          setShowContactDropdown(!showContactDropdown)
                        }
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center space-x-2"
                        style={{
                          minWidth: "123.73px",
                          width: "auto",
                          height: "26.97px",
                          color: "#7F7F7F",
                          fontSize: "12px",
                        }}
                      >
                        <span className="whitespace-nowrap">
                          {selectedContact?.name || "Contacts"}
                        </span>
                        <svg
                          className={`h-4 w-4 transition-transform flex-shrink-0 ${
                            showContactDropdown ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Contacts Dropdown Panel */}
                      {showContactDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                          <div className="max-h-64 overflow-y-auto scrollbar-hide">
                            {contacts.length > 0 ? (
                              contacts.map((contact) => (
                                <button
                                  key={contact.id}
                                  onClick={() => {
                                    handleContactSelect(contact);
                                    setShowContactDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    selectedContact?.id === contact.id
                                      ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-l-2 border-green-500"
                                      : "text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {contact.name}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                No contacts found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons and Search */}
                  <div className="mb-6 flex flex-row items-center justify-between gap-3 max-[900px]:flex-col max-[900px]:items-center">
                    <div className="flex flex-row gap-3 max-[900px]:flex-col max-[900px]:items-center">
                      <button
                        onClick={handleFileUpload}
                        className="px-4 bg-transparent text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{
                          fontSize: "14px",
                          height: "26.98px",
                          fontWeight: "bold",
                        }}
                      >
                        + Upload Files
                      </button>
                      <button
                        onClick={handleBulkUpload}
                        className="px-4 text-white rounded-lg transition-colors w-auto max-[900px]:w-full"
                        style={{
                          fontSize: "14px",
                          height: "26.98px",
                          backgroundColor: "#3165DB",
                          fontWeight: "bold",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "#2A5BC7")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "#3165DB")
                        }
                      >
                        Bulk Upload Prompts
                      </button>
                      <button
                        className="px-4 text-white rounded-lg transition-colors w-auto max-[900px]:w-full"
                        style={{
                          fontSize: "14px",
                          height: "26.98px",
                          backgroundColor: "#D37B11",
                          fontWeight: "bold",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "#C16A0A")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = "#D37B11")
                        }
                        onClick={async () => {
                          if (!selectedCompany || !selectedDashboard) return;
                          try {
                            const ref = await addDoc(collection(db, "tiles"), {
                              title: "Note",
                              prompt: null,
                              content: "",
                              position: tiles?.length || 0,
                              size: "medium",
                              type: "note",
                              color: "green",
                              isFlipped: false,
                              createdAt: serverTimestamp(),
                              updatedAt: serverTimestamp(),
                              userId: user.id,
                              dashboardId: selectedDashboard.id,
                              companyId: selectedCompany.id,
                            });
                            toast.success("Note tile added");
                          } catch (_) {
                            toast.error("Failed to add note tile");
                          }
                        }}
                      >
                        Add Notes Tile
                      </button>
                    </div>
                    {/* Search Field */}
                    <div className="relative w-[320px] max-[900px]:w-full mr-24 max-[900px]:mr-0">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find on page..."
                        className="pl-8 pr-4 py-2 w-full border-0 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-4 w-4 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Dashboard Switcher moved to far right */}
                    {/* <div className="ml-auto relative">
                          <button
                            onClick={() => setShowDashDropdown((v) => !v)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                          >
                            {selectedDashboard?.name || 'Dashboards'}
                          </button>
                          {showDashDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                              <div className="max-h-64 overflow-y-auto py-1">
                                {dashboards.map((d) => (
                                  <button
                                    key={d.id}
                                    onClick={() => {
                                      setSelectedDashboard(d)
                                      setShowDashDropdown(false)
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${selectedDashboard?.id === d.id ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                                  >
                                    {d.name}
                                  </button>
                                ))}
                                <div className="border-t border-gray-200 my-1" />
                                <button
                                  onClick={async () => {
                                    if (!selectedCompany) return
                                    const nextIndex = (dashboards?.length || 0) + 1
                                    const name = `Dashboard ${nextIndex}`
                                    const ref = await addDoc(collection(db, 'dashboards'), {
                                      name,
                                      template: 'blank',
                                      background: null,
                                      backgroundImage: null,
                                      isPublic: false,
                                      createdAt: serverTimestamp(),
                                      updatedAt: serverTimestamp(),
                                      userId: user.id,
                                      companyId: selectedCompany.id,
                                    })
                                    setSelectedDashboard({ id: ref.id, name, template: 'blank', background: null, backgroundImage: null, isPublic: false, createdAt: new Date(), updatedAt: new Date(), userId: user.id, companyId: selectedCompany.id, tiles: [] } as any)
                                    setShowDashDropdown(false)
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  + Create Dashboard
                                </button>
                              </div>
                            </div>
                          )}
                        </div> */}
                  </div>

                  <TileGrid
                    tiles={tiles}
                    company={selectedCompany}
                    contact={selectedContact}
                    user={user}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    gridColsClass=""
                  />

                  {/* Notes Section */}
                  <div className="mt-8">
                    <h3
                      className="text-gray-900 dark:text-gray-100 mb-4"
                      style={{
                        fontSize: "18.18px",
                        fontFamily:
                          "SF Pro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                        fontWeight: "590",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                        color: "#333333",
                      }}
                    >
                      Notes
                    </h3>
                    <div
                      className="w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
                      style={
                        {
                          "--tile-width": "300px",
                          "--tile-height": "218.52px",
                          width: "100%",
                          display: "grid",
                          gridTemplateColumns: "repeat(5, 300px)",
                          gap: "24px",
                          gridAutoRows: "218.52px",
                        } as React.CSSProperties
                      }
                    >
                      {/* Note Tiles - Filter tiles to show only note type */}
                      {tiles
                        .filter((tile) => tile.type === "note")
                        .map((tile) => (
                          <div
                            key={tile.id}
                            className="transition-transform duration-200"
                            style={{
                              width: "300px",
                              height: "218.52px",
                            }}
                          >
                            <TileComponent
                              tile={tile}
                              company={selectedCompany}
                              contact={selectedContact}
                              user={user}
                              onUpdate={async (updates) => {
                                try {
                                  const { updateDoc, doc } = await import(
                                    "firebase/firestore"
                                  );
                                  await updateDoc(doc(db, "tiles", tile.id), {
                                    ...updates,
                                    updatedAt: serverTimestamp(),
                                  });
                                } catch (error) {
                                  console.error("Error updating tile:", error);
                                }
                              }}
                              onDelete={async () => {
                                try {
                                  const { deleteDoc, doc } = await import(
                                    "firebase/firestore"
                                  );
                                  await deleteDoc(doc(db, "tiles", tile.id));
                                  toast.success("Note deleted");
                                } catch (error) {
                                  console.error("Error deleting tile:", error);
                                  toast.error("Failed to delete note");
                                }
                              }}
                            />
                          </div>
                        ))}

                      {/* Always show at least one empty note tile if no note tiles exist */}
                      {tiles.filter((tile) => tile.type === "note").length ===
                        0 && (
                        <div
                          className="transition-transform duration-200"
                          style={{
                            width: "300px",
                            height: "218.52px",
                          }}
                        >
                          <TileComponent
                            tile={{
                              id: "empty-note-tile",
                              title: "Note",
                              prompt: null,
                              content: "Add new note...",
                              position: 0,
                              size: "medium",
                              type: "note",
                              color: "green",
                              isFlipped: false,
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              userId: user.id,
                              dashboardId: selectedDashboard?.id || "",
                              companyId: selectedCompany?.id || "",
                            }}
                            company={selectedCompany}
                            contact={selectedContact}
                            user={user}
                            onUpdate={async (updates) => {
                              // Handle empty tile updates - could create a new tile
                              if (updates.content && updates.content.trim()) {
                                try {
                                  const {
                                    addDoc,
                                    collection,
                                    serverTimestamp,
                                  } = await import("firebase/firestore");
                                  await addDoc(collection(db, "tiles"), {
                                    title: updates.title || "Note",
                                    prompt: null,
                                    content: updates.content,
                                    position: tiles?.length || 0,
                                    size: "medium",
                                    type: "note",
                                    color: "green",
                                    isFlipped: false,
                                    createdAt: serverTimestamp(),
                                    updatedAt: serverTimestamp(),
                                    userId: user.id,
                                    dashboardId: selectedDashboard?.id,
                                    companyId: selectedCompany?.id,
                                  });
                                  toast.success("Note created");
                                } catch (error) {
                                  console.error("Error creating note:", error);
                                  toast.error("Failed to create note");
                                }
                              }
                            }}
                            onDelete={() => {
                              // Empty tile cannot be deleted
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Attachments Section */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      File Attachments
                    </h3>
                    <FileList files={files} onFileDelete={handleFileDeleted} />
                  </div>
                </div>
              ) : !selectedCompany ? (
                <div className="flex items-center justify-center h-[60vh]">
                  <div className="text-center">
                    <h3
                      className="text-gray-900 dark:text-gray-100 mb-3 font-bold"
                      style={{
                        fontSize: "28px",
                        fontFamily:
                          "SF Pro, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
                      }}
                    >
                      Add Companies to Research
                    </h3>
                    <div className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => setShowAddCompany(true)}
                        className="text-white rounded-md font-bold"
                        style={{
                          backgroundColor: "#3165DB",
                          width: "210px",
                          fontSize: "26.51px",
                          padding: "12px 16px",
                        }}
                      >
                        Quick Add
                      </button>
                      <button
                        onClick={() => toast("CSV upload coming soon")}
                        className="text-white rounded-md font-bold"
                        style={{
                          backgroundColor: "#3165DB",
                          width: "210px",
                          fontSize: "26.51px",
                          padding: "12px 16px",
                        }}
                      >
                        CSV Upload
                      </button>
                      <button
                        onClick={() => toast("Connect CRM coming soon")}
                        className="text-white rounded-md font-bold"
                        style={{
                          backgroundColor: "#3165DB",
                          width: "210px",
                          fontSize: "26.51px",
                          padding: "12px 16px",
                        }}
                      >
                        Connect CRM
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Dashboard Selected
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Select a dashboard from the header or add a new one.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        {/* Right Dashboards Panel */}
        {showDashPanel && (
          <aside className="w-80 fixed right-0 top-0 bottom-0 bg-white border-l border-gray-200 z-40 shadow-xl flex flex-col">
            <div className="p-3 flex items-center justify-between border-b border-gray-200">
              <div className="text-lg font-bold text-gray-900">Dashboards</div>
              <button
                onClick={() => setShowDashPanel(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <input
                  value={dashSearch}
                  onChange={(e) => setDashSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                  style={{ border: "none" }}
                />
                <svg
                  className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-hide">
              {dashboards
                .filter((d) =>
                  d.name.toLowerCase().includes(dashSearch.toLowerCase())
                )
                .map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDashboard(d);
                      setShowDashPanel(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                      selectedDashboard?.id === d.id
                        ? "font-semibold text-blue-600"
                        : "text-gray-800"
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile overlay - Only on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <AddCompanyModal
        isOpen={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        onSuccess={(company) => {
          setShowAddCompany(false);
          setSelectedCompany(company);
          setSelectedContact(undefined);
          setViewMode("dashboard");
          toast.success("Company added successfully");
        }}
        variant="quick"
      />

      <EditCompanyModal
        isOpen={!!editCompany}
        company={editCompany || undefined}
        onClose={() => setEditCompany(null)}
        onSave={async (updates) => {
          if (!editCompany) return;
          try {
            const { updateDoc, doc, serverTimestamp } = await import(
              "firebase/firestore"
            );
            await updateDoc(doc(db, "companies", editCompany.id), {
              ...updates,
              updatedAt: serverTimestamp(),
            });
            toast.success("Company updated");
            setEditCompany(null);
          } catch (_) {
            toast.error("Failed to update");
          }
        }}
      />

      <AddContactModal
        isOpen={showAddContact}
        onClose={() => setShowAddContact(false)}
        companyId={selectedCompany?.id}
        onSuccess={(contact) => {
          setShowAddContact(false);
          setSelectedContact(contact);
          toast.success("Contact added successfully");
        }}
      />

      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        companyId={selectedCompany?.id}
        dashboardId={selectedDashboard?.id}
        onCreateTiles={(newTiles) => {
          // place new tiles at the very beginning visually
          const normalized = newTiles.map((t) => ({ ...t, position: -1 }));
          const combined = [...normalized, ...tiles];
          const reindexed = combined.map((t, idx) => ({ ...t, position: idx }));
          updateTiles(reindexed);
        }}
        onSuccess={() => {
          setShowBulkUpload(false);
          toast.success("Prompts uploaded successfully");
        }}
      />

      {/* File Upload Modal */}
      {selectedCompany && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4 ${
            showFileUpload ? "block" : "hidden"
          }`}
        >
          <div
            className="w-full max-w-2xl rounded-lg shadow-lg"
            style={{ backgroundColor: "#C6C6C6" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add multiple prompts onto a single dashboard
                </h2>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="p-2 hover:bg-gray-200 rounded-md"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Upload Options */}
              <div className="flex flex-col space-x-4">
                <div className="flex">
                  {/* Copy & Paste Option */}
                  <div
                    className="flex items-center space-x-2 rounded-lg cursor-pointer"
                    style={{
                      width: "150px",
                      height: "31.19px",
                      padding: "0 12px",
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      className="text-gray-700 font-medium"
                      style={{ fontSize: "12px" }}
                    >
                      Copy & Paste
                    </span>
                  </div>

                  {/* Upload File Option (Selected) */}
                  <div
                    className="flex items-center space-x-3 rounded-lg border border-blue-300 cursor-pointer"
                    style={{
                      width: "150px",
                      height: "31.2px",
                      backgroundColor: "#D1D1D1",
                      padding: "0 12px",
                    }}
                    onClick={() => {
                      // Trigger file input when Upload File is clicked
                      const fileInput = document.getElementById(
                        "file-upload-input"
                      ) as HTMLInputElement;
                      fileInput?.click();
                    }}
                  >
                    <svg
                      className="h-4 w-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span
                      className="font-medium"
                      style={{ fontSize: "12px", color: "black" }}
                    >
                      Upload File
                    </span>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx"
                  className="hidden"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files);
                      setSelectedFiles(files);
                    }
                  }}
                />

                {/* File Types List */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Upload any of the following file types:
                  </p>
                  <div
                    className="text-sm"
                    style={{ color: "#7F7F7F", letterSpacing: "-0.5px" }}
                  >
                    <div>PDF (.pdf)</div>
                    <div>Word (.docx)</div>
                    <div>PowerPoint (.pptx)</div>
                    <div>Text (.txt)</div>
                    <div>Excel (.xlsx)</div>
                    <div>CSV (.csv)</div>
                  </div>
                </div>

                {/* Selected Files Display */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected files:
                    </p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
                        >
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Files Button */}
                <div className="flex justify-start mt-6">
                  <button
                    onClick={async () => {
                      if (selectedFiles.length === 0) {
                        toast.error("Please select files first");
                        return;
                      }

                      try {
                        setIsUploading(true);

                        // Upload files to Cloudinary
                        const uploadPromises = selectedFiles.map(
                          async (file) => {
                            const formData = new FormData();
                            formData.append("file", file);

                            const response = await fetch(
                              "/api/uploads/cloudinary",
                              {
                                method: "POST",
                                body: formData,
                              }
                            );

                            if (!response.ok) {
                              throw new Error(`Failed to upload ${file.name}`);
                            }

                            const data = await response.json();
                            return {
                              id: data.public_id,
                              name: file.name,
                              url: data.secure_url,
                              type: file.type,
                              size: file.size,
                              createdAt: new Date(),
                              updatedAt: new Date(),
                              userId: user.id,
                              companyId: selectedCompany?.id || "",
                              dashboardId: selectedDashboard?.id || "",
                            };
                          }
                        );

                        const uploadedFiles = await Promise.all(uploadPromises);

                        // Save to Firestore
                        const { addDoc, collection, serverTimestamp } =
                          await import("firebase/firestore");
                        const { db } = await import("@/lib/firebase");

                        for (const file of uploadedFiles) {
                          await addDoc(collection(db, "files"), {
                            ...file,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                          });
                        }

                        toast.success(
                          `${uploadedFiles.length} file(s) uploaded successfully`
                        );
                        setShowFileUpload(false);
                        setSelectedFiles([]);

                        // Refresh files list
                        uploadedFiles.forEach((file) =>
                          handleFileUploaded(file)
                        );
                      } catch (error) {
                        console.error("Upload error:", error);
                        toast.error("Failed to upload files");
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    disabled={selectedFiles.length === 0 || isUploading}
                    className="flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    style={{
                      width: "81.44px",
                      height: "26.75px",
                      fontSize: "12px",
                    }}
                  >
                    {isUploading ? "..." : "+ Add Files"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      <Modal
        isOpen={showCreateDash}
        onClose={() => setShowCreateDash(false)}
        title="Create dashboard"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              value={createDashName}
              onChange={(e) => setCreateDashName(e.target.value)}
              placeholder="New dashboard name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreateDash(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const name = createDashName.trim();
                if (!name || !selectedCompany) return;
                const ref = await addDoc(collection(db, "dashboards"), {
                  name,
                  template: "blank",
                  background: null,
                  backgroundImage: null,
                  isPublic: false,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  userId: user.id,
                  companyId: selectedCompany.id,
                });
                setSelectedDashboard({
                  id: ref.id,
                  name,
                  template: "blank",
                  background: null,
                  backgroundImage: null,
                  isPublic: false,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  userId: user.id,
                  companyId: selectedCompany.id,
                  tiles: [],
                } as any);
                setShowCreateDash(false);
                setShowDashDropdown(false);
                setCreateDashName("");
              }}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
      <EditContactModal
        isOpen={!!editingContact}
        contact={editingContact || undefined}
        onClose={() => setEditingContact(null)}
      />
    </div>
  );
}
