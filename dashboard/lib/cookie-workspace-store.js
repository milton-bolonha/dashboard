import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const META_COOKIE = "dashWorkspaceMeta";
const DATA_COOKIE = "dashWorkspaceData";
const COOKIE_DEFAULT_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60, // 1 hour
};

function safeJsonParse(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("[cookieWorkspaceStore] JSON parse error", error);
    return fallback;
  }
}

const generateId = (prefix) => {
  try {
    return `${prefix}_${randomUUID()}`;
  } catch (error) {
    return `${prefix}_${Date.now().toString(36)}`;
  }
};

async function getStore() {
  return cookies();
}

async function readMeta(store) {
  const entry = await store.get?.(META_COOKIE);
  const raw = entry?.value ?? null;
  if (!raw) return null;
  return safeJsonParse(raw, null);
}

async function writeMeta(store, meta) {
  await store.set?.(
    META_COOKIE,
    JSON.stringify(meta),
    COOKIE_DEFAULT_OPTIONS
  );
}

function createDefaultMeta() {
  return {
    companyId: "cookie-company",
    companyName: "Preview Company",
    companyWebsite: "",
    tilesToGenerate: 0,
    generatedAt: new Date().toISOString(),
  };
}

async function readData(store, meta) {
  const entry = await store.get?.(DATA_COOKIE);
  const raw = entry?.value ?? null;
  const parsed = safeJsonParse(raw, {});
  const company = parsed?.company || {};

  return {
    company: {
      id: meta?.companyId || "cookie-company",
      name: meta?.companyName || company.name || "Preview Company",
      website: meta?.companyWebsite || company.website || "",
      tiles: Array.isArray(company.tiles) ? company.tiles : [],
      notes: Array.isArray(company.notes) ? company.notes : [],
      contacts: Array.isArray(company.contacts) ? company.contacts : [],
    },
  };
}

async function writeData(store, data) {
  await store.set?.(
    DATA_COOKIE,
    JSON.stringify(data),
    COOKIE_DEFAULT_OPTIONS
  );
}

async function getSnapshot() {
  const store = await getStore();
  let meta = await readMeta(store);
  if (!meta) {
    meta = createDefaultMeta();
    await writeMeta(store, meta);
  }
  const data = await readData(store, meta);
  return { store, meta, data };
}

async function updateCompany(updater) {
  const { store, meta, data } = await getSnapshot();
  const updatedCompany = updater({ ...data.company });
  const nextCompany = {
    ...data.company,
    ...updatedCompany,
    tiles: Array.isArray(updatedCompany.tiles)
      ? updatedCompany.tiles
      : data.company.tiles,
    notes: Array.isArray(updatedCompany.notes)
      ? updatedCompany.notes
      : data.company.notes,
    contacts: Array.isArray(updatedCompany.contacts)
      ? updatedCompany.contacts
      : data.company.contacts,
  };

  if (nextCompany.name && nextCompany.name !== meta.companyName) {
    meta.companyName = nextCompany.name;
  }
  if (typeof nextCompany.website === "string") {
    meta.companyWebsite = nextCompany.website;
  }
  meta.tilesToGenerate = nextCompany.tiles?.length || 0;
  meta.generatedAt = new Date().toISOString();

  await writeMeta(store, meta);
  await writeData(store, { company: nextCompany });

  return nextCompany;
}

export async function readWorkspaceFromCookies() {
  try {
    const { meta, data } = await getSnapshot();
    const company = data.company || createDefaultMeta();
    const tiles = company.tiles || [];

    return {
      companies: [
        {
          id: company.id,
          name: company.name,
          website: company.website,
          tiles,
          tiles_status: tiles.length ? "completed" : "pending",
          tiles_to_generate: meta.tilesToGenerate || tiles.length,
          notes: company.notes || [],
          contacts: company.contacts || [],
        },
      ],
      contacts: company.contacts || [],
      notes: company.notes || [],
      workspace: {
        name: `${company.name || "Trial"} Workspace`,
        companies: [
          {
            ...company,
            tiles,
          },
        ],
        contacts: company.contacts || [],
      },
      generatedAt: meta.generatedAt,
    };
  } catch (error) {
    console.warn("[cookieWorkspaceStore] readWorkspaceFromCookies fallback", error);
    const fallback = createDefaultMeta();
    return {
      companies: [
        {
          id: fallback.companyId,
          name: fallback.companyName,
          website: fallback.companyWebsite,
          tiles: [],
          tiles_status: "pending",
          tiles_to_generate: 0,
          notes: [],
          contacts: [],
        },
      ],
      contacts: [],
      notes: [],
      workspace: {
        name: `${fallback.companyName} Workspace`,
        companies: [
          {
            id: fallback.companyId,
            name: fallback.companyName,
            website: fallback.companyWebsite,
            tiles: [],
            notes: [],
            contacts: [],
          },
        ],
        contacts: [],
      },
      generatedAt: fallback.generatedAt,
    };
  }
}

export async function writeWorkspaceToCookies({
  companyName,
  companyWebsite,
  tiles,
}) {
  const trimmedTiles = Array.isArray(tiles) ? tiles : [];
  const updated = await updateCompany((company) => ({
    ...company,
    name: companyName || company.name,
    website: companyWebsite || company.website,
    tiles: trimmedTiles,
  }));

  return {
    companyId: updated.id,
    companyName: updated.name,
    companyWebsite: updated.website,
    tilesToGenerate: updated.tiles.length,
    generatedAt: new Date().toISOString(),
  };
}

export async function clearWorkspaceCookies() {
  const store = await getStore();
  await store.delete?.(META_COOKIE);
  await store.delete?.(DATA_COOKIE);
}

export function enforceTileLimit(tiles, maxTiles = 10, maxCharsPerTile = 750) {
  if (!Array.isArray(tiles)) {
    return [];
  }

  return tiles.slice(0, maxTiles).map((tile, index) => {
    const content = tile?.content || "";
    const truncated =
      content.length > maxCharsPerTile
        ? `${content.substring(0, maxCharsPerTile)}…`
        : content;

    return {
      ...tile,
      orderIndex: index,
      content: truncated,
    };
  });
}

export async function updateCompanyInfo({ name, website }) {
  return updateCompany((company) => ({
    ...company,
    name: name ?? company.name,
    website: website ?? company.website,
  }));
}

export async function listNotes() {
  const { data } = await getSnapshot();
  return data.company.notes || [];
}

export async function createNote({ title, content }) {
  const now = new Date().toISOString();
  const note = {
    id: generateId("note"),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };

  await updateCompany((company) => ({
    ...company,
    notes: [note, ...(company.notes || [])].slice(0, 20),
  }));

  return note;
}

export async function updateNote(noteId, { title, content }) {
  let updatedNote = null;
  await updateCompany((company) => {
    const notes = (company.notes || []).map((note) => {
      if (note.id !== noteId) return note;
      updatedNote = {
        ...note,
        title: title ?? note.title,
        content: content ?? note.content,
        updatedAt: new Date().toISOString(),
      };
      return updatedNote;
    });
    return { ...company, notes };
  });
  return updatedNote;
}

export async function deleteNote(noteId) {
  await updateCompany((company) => ({
    ...company,
    notes: (company.notes || []).filter((note) => note.id !== noteId),
  }));
}

export async function listContacts() {
  const { data } = await getSnapshot();
  return data.company.contacts || [];
}

export async function createContact({ name, jobTitle, linkedinUrl }) {
  const contact = {
    id: generateId("contact"),
    name,
    jobTitle,
    linkedinUrl: linkedinUrl || "",
    createdAt: new Date().toISOString(),
  };

  await updateCompany((company) => ({
    ...company,
    contacts: [contact, ...(company.contacts || [])].slice(0, 20),
  }));

  return contact;
}

export async function updateContact(contactId, payload) {
  let updatedContact = null;
  await updateCompany((company) => {
    const contacts = (company.contacts || []).map((contact) => {
      if (contact.id !== contactId) return contact;
      updatedContact = {
        ...contact,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return updatedContact;
    });
    return { ...company, contacts };
  });
  return updatedContact;
}

export async function deleteContact(contactId) {
  await updateCompany((company) => ({
    ...company,
    contacts: (company.contacts || []).filter(
      (contact) => contact.id !== contactId
    ),
  }));
}

export async function deleteTile(tileId) {
  await updateCompany((company) => ({
    ...company,
    tiles: (company.tiles || []).filter((tile) => tile.id !== tileId),
  }));
}

export async function reorderTilesOrder(orderIds) {
  if (!Array.isArray(orderIds)) return;
  await updateCompany((company) => {
    const tilesMap = new Map((company.tiles || []).map((tile) => [tile.id, tile]));
    const reordered = orderIds
      .map((id, index) => {
        const tile = tilesMap.get(id);
        if (!tile) return null;
        return { ...tile, orderIndex: index };
      })
      .filter(Boolean);
    return {
      ...company,
      tiles: reordered,
    };
  });
}
