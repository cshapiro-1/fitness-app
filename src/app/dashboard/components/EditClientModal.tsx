"use client";

import React, { useState, useEffect } from "react";

export interface EditClientModalProps {
  editingClient: any;
  editName: string;
  setEditName: (name: string) => void;
  editNotes: string;
  setEditNotes: (notes: string) => void;
  onSave: (updatedClient?: any) => void | Promise<void>;
  onClose: () => void;
  onClientUpdated?: (updatedClient: any) => void;
  [key: string]: any;
}

export function EditClientModal({
  editingClient,
  editName,
  setEditName,
  editNotes,
  setEditNotes,
  onSave,
  onClose,
  onClientUpdated,
}: EditClientModalProps) {
  const [fitnessGoals, setFitnessGoals] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setFitnessGoals(editingClient.fitnessGoals || "");
      const existingUrl =
        editingClient.inviteUrl ||
        (editingClient.inviteToken
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${editingClient.inviteToken}`
          : null);
      setInviteUrl(existingUrl);
    }
  }, [editingClient]);

  if (!editingClient) return null;

  const handleGenerateInvite = async () => {
    if (!editingClient?.id) return;
    setGeneratingInvite(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: editingClient.id }),
      });

      const data = await res.json();
      if (res.ok && data.inviteUrl) {
        setInviteUrl(data.inviteUrl);

        const updated = {
          ...editingClient,
          inviteUrl: data.inviteUrl,
          inviteToken: data.inviteToken || editingClient.inviteToken,
          inviteStatus: "PENDING",
        };

        if (onClientUpdated) {
          onClientUpdated(updated);
        }
      } else {
        alert(data.error || "Failed to generate invite link.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating invite link.");
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient?.id) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          notes: editNotes.trim() || null,
          fitnessGoals: fitnessGoals.trim() || null,
        }),
      });

      if (res.ok) {
        const updatedClient = await res.json();
        const mergedClient = {
          ...editingClient,
          ...updatedClient,
          inviteUrl: inviteUrl || updatedClient.inviteUrl,
        };
        await onSave(mergedClient);
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to update client.");
      }
    } catch (err) {
      console.error("Save client error:", err);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Edit Client</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-600 transition text-xl font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Client Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="Goals, preferences, or context"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Fitness Goals
            </label>
            <textarea
              rows={2}
              value={fitnessGoals}
              onChange={(e) => setFitnessGoals(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              placeholder="e.g. Lose 10lbs, Bench press 225, Train 3x/week"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 bg-gray-50 -mx-6 p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-gray-800">Client Invite Link</p>
                <p className="text-[11px] text-gray-500">Generate or copy a registration link for this client.</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateInvite}
                disabled={generatingInvite}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {generatingInvite ? "Generating..." : inviteUrl ? "Re-generate" : "Generate Link"}
              </button>
            </div>

            {inviteUrl && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full p-2 text-xs border rounded bg-white font-mono text-gray-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClientModal;
