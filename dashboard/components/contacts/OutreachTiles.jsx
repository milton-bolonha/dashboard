"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Save } from "lucide-react";
import { Tile } from "../ui/Tile";
import { regenerateOutreachTile } from "@/lib/contact-outreach-generator";

export function OutreachTiles({ contact, company, context = {} }) {
  const [outreachTiles, setOutreachTiles] = useState(
    contact?.outreachTiles || null
  );
  const [regeneratingTile, setRegeneratingTile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setOutreachTiles(contact?.outreachTiles || null);
  }, [contact]);

  const handleRegenerateTile = async (tileType) => {
    // ... (lógica de regenerar mantida)
  };

  if (!outreachTiles) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p>Outreach tiles have not been generated for this contact yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Tile
        title={outreachTiles.contactInsights?.title || "Contact Insights"}
        excerpt={outreachTiles.contactInsights?.answer || "No content."}
      />
      <Tile
        title={outreachTiles.emailPitch?.title || "Email Pitch"}
        excerpt={outreachTiles.emailPitch?.answer || "No content."}
      />
      <Tile
        title={outreachTiles.coldCallScript?.title || "Cold Call Script"}
        excerpt={outreachTiles.coldCallScript?.answer || "No content."}
      />
    </div>
  );
}
