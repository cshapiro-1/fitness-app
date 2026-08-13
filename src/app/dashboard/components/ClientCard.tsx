"use client";

import { useState } from "react";

export interface Client {
  id: string;
  name: string;
  email: string;
  fitnessGoals?: string;
  status: "PENDING" | "ACTIVE";
}

export function ClientCard({
  client,
  onUpdate,
}: {
  client: Client;
  onUpdate?: () => void;
}) {
  const [name, setName] = useState(client.name || "");
  const [email, setEmail] = useState(client.email || "");
  const [fitnessGoals, setFitnessGoals] = useState(client.fitnessGoals || "");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/client/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, fitnessGoals }),
      });

      if (res.ok) {
        setMessage("Client updated successfully!");
        if (onUpdate) onUpdate();
      } else {
        setMessage("Failed to update client.");
      }
    } catch (err) {
      setMessage("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteUrl(data.inviteUrl);
      }
    } catch (err) {
      console.error(err);
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg w-full space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{client.name || "Unnamed Client"}</h2>
          <p className="text-sm text-gray-500">{client.email || "No email provided"}</p>
        </div>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            client.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {client.status === "ACTIVE" ? "Active" : "Pending Invite"}
        </span>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Fitness Goals
          </label>
          <textarea
            rows={3}
            value={fitnessGoals}
            onChange={(e) => setFitnessGoals(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            placeholder="e.g., Build muscle, lose 10 lbs, train 4x per week"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Client Info"}
          </button>
          {message && <p className="text-xs text-green-600 font-medium">{message}</p>}
        </div>
      </form>

      <div className="pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-gray-800">Invite Link</h4>
            <p className="text-xs text-gray-500">
              Generate a unique registration link for this client.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateInvite}
            disabled={generatingInvite}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition disabled:opacity-50 whitespace-nowrap"
          >
            {generatingInvite ? "Generating..." : inviteUrl ? "Re-generate Link" : "Generate Invite Link"}
          </button>
        </div>

        {inviteUrl && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full p-2 text-xs border rounded-md bg-white font-mono text-gray-700 select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 transition whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}