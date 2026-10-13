"use client";

import { useState, useId, useEffect } from "react";
import {
  X,
  BookUser,
  Search,
  CheckSquare,
  Square,
  User,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlusCircle,
  Smartphone,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export interface ContactItem {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  companyName?: string;
  selected: boolean;
}

interface PhonebookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhonebookImportModal({
  isOpen,
  onClose,
  onSuccess,
}: PhonebookImportModalProps) {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<{
    created: number;
    skipped: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"device" | "quick_paste">("device");
  const [pasteText, setPasteText] = useState("");
  const [isContactPickerAvailable, setIsContactPickerAvailable] = useState(false);

  useEffect(() => {
    // Check if W3C Contacts Picker API is available in browser / WebView
    const available =
      typeof navigator !== "undefined" &&
      "contacts" in navigator &&
      "ContactsManager" in window;
    setIsContactPickerAvailable(Boolean(available));
  }, []);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResultSummary(null);
      setSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Normalize phone number (E.164-compatible cleaning)
  const normalizePhone = (raw: string): string => {
    let clean = raw.trim().replace(/[\s()\-]/g, "");
    // If local Sri Lankan 10-digit number like 0770660647 -> +94770660647
    if (/^0\d{9}$/.test(clean)) {
      clean = `+94${clean.slice(1)}`;
    } else if (/^[1-9]\d{8,14}$/.test(clean) && !clean.startsWith("+")) {
      clean = `+${clean}`;
    }
    return clean;
  };

  // 1. Native / Web Contact Picker trigger
  const handlePickDeviceContacts = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Try W3C Contacts Manager API (Supported on Chrome on Android & hybrid wrappers)
      if (
        typeof navigator !== "undefined" &&
        "contacts" in navigator &&
        typeof (navigator as unknown as { contacts: { select: (props: string[], opts: { multiple: boolean }) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>> } }).contacts?.select === "function"
      ) {
        const nav = navigator as unknown as {
          contacts: {
            select: (
              props: string[],
              opts: { multiple: boolean }
            ) => Promise<
              Array<{ name?: string[]; tel?: string[]; email?: string[] }>
            >;
          };
        };

        const props = ["name", "tel", "email"];
        const selected = await nav.contacts.select(props, { multiple: true });

        if (!selected || selected.length === 0) {
          setLoading(false);
          return;
        }

        const parsed: ContactItem[] = [];
        selected.forEach((c, idx) => {
          const rawTel = c.tel && c.tel.length > 0 ? c.tel[0] : "";
          const phone = normalizePhone(rawTel);
          if (phone) {
            parsed.push({
              id: `device-${Date.now()}-${idx}`,
              name: c.name && c.name.length > 0 ? c.name[0] : "Unnamed Contact",
              phoneNumber: phone,
              email: c.email && c.email.length > 0 ? c.email[0] : undefined,
              selected: true,
            });
          }
        });

        if (parsed.length === 0) {
          setError("No valid phone numbers found in the selected contacts.");
        } else {
          setContacts(parsed);
          toast.success(`Selected ${parsed.length} contacts from phone book`);
        }
      } else {
        // Fallback info for browsers without native ContactsManager API
        setError(
          "Direct address book access requires Android/iOS device permissions or the native BluePlanet app shell. You can use 'Quick Add / Paste' tab below to import multiple numbers right now!"
        );
        setActiveTab("quick_paste");
      }
    } catch (err: unknown) {
      console.warn("Contact picker error:", err);
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message || "Could not read contacts from device.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Parse Quick Paste list (e.g., Name, Phone or Phone only per line)
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/);
    const parsed: ContactItem[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let name = "";
      let rawPhone = "";
      let email = "";

      // Format: Name, Phone, Email or Name - Phone
      if (trimmed.includes(",") || trimmed.includes("\t")) {
        const parts = trimmed.split(/,|\t/).map((p) => p.trim());
        name = parts[0] || "";
        rawPhone = parts[1] || "";
        email = parts[2] || "";
      } else if (trimmed.includes(" - ")) {
        const parts = trimmed.split(" - ").map((p) => p.trim());
        name = parts[0] || "";
        rawPhone = parts[1] || "";
      } else {
        // Just phone or name
        if (/[\d+]{7,}/.test(trimmed)) {
          rawPhone = trimmed;
        } else {
          name = trimmed;
        }
      }

      const cleanPhone = normalizePhone(rawPhone);
      if (cleanPhone) {
        parsed.push({
          id: `paste-${Date.now()}-${idx}`,
          name: name || `Lead ${cleanPhone}`,
          phoneNumber: cleanPhone,
          email: email || undefined,
          selected: true,
        });
      }
    });

    if (parsed.length === 0) {
      setError("No valid phone numbers detected in the pasted text.");
    } else {
      setContacts((prev) => [...prev, ...parsed]);
      setPasteText("");
      setActiveTab("device");
      setError(null);
      toast.success(`Added ${parsed.length} contacts to preview list`);
    }
  };

  // Toggle selection
  const toggleContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectAll = () => {
    setContacts((prev) => prev.map((c) => ({ ...c, selected: true })));
  };

  const deselectAll = () => {
    setContacts((prev) => prev.map((c) => ({ ...c, selected: false })));
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  // Filter contacts
  const filteredContacts = contacts.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  });

  const selectedCount = contacts.filter((c) => c.selected).length;

  // 3. Submit bulk import to backend
  const handleImportSubmit = async () => {
    const toImport = contacts.filter((c) => c.selected);
    if (toImport.length === 0) {
      setError("Please select at least one contact to import.");
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const payload = {
        contacts: toImport.map((c) => ({
          name: c.name,
          phoneNumber: c.phoneNumber,
          email: c.email || undefined,
          companyName: c.companyName || undefined,
        })),
      };

      const res = await apiClient<{
        created: number;
        skipped: number;
        createdLeads?: unknown[];
      }>("/leads/bulk-import", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        setResultSummary({
          created: res.data.created,
          skipped: res.data.skipped,
        });
        toast.success(
          `Successfully imported ${res.data.created} lead(s)! ${
            res.data.skipped > 0 ? `(${res.data.skipped} duplicate(s) skipped)` : ""
          }`
        );
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        throw new Error(res.error || "Failed to import contacts");
      }
    } catch (err: unknown) {
      let msg = "Failed to import contacts";
      if (err instanceof ApiError) {
        msg = err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <BookUser className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Import from Phone Book
              </h2>
              <p className="text-xs text-slate-500">
                Add leads directly from your device contacts or address book
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("device")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "device"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Device Contacts {contacts.length > 0 && `(${contacts.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quick_paste")}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "quick_paste"
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Quick Add / Paste
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resultSummary && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">
                  Import completed: {resultSummary.created} new lead(s) created!
                </p>
                {resultSummary.skipped > 0 && (
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    {resultSummary.skipped} duplicate phone numbers were skipped.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "device" ? (
            <div className="space-y-4">
              {/* Trigger Button if no contacts yet */}
              {contacts.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3 shadow-inner">
                    <Smartphone className="h-7 w-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    Select Contacts from Phone Book
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Open your device's native address book to pick customer numbers.
                    Names and phone numbers will be automatically imported as leads.
                  </p>
                  <button
                    type="button"
                    onClick={handlePickDeviceContacts}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Reading Contacts...
                      </>
                    ) : (
                      <>
                        <BookUser className="h-4 w-4" /> Open Phone Book Picker
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-[11px] text-slate-400">
                    Works on Android, iOS native app & supported mobile browsers.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between pb-2 border-b border-slate-100">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search loaded contacts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAll}
                        className="text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Deselect All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handlePickDeviceContacts}
                        className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="h-3 w-3" /> Add More
                      </button>
                    </div>
                  </div>

                  {/* Contact List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => toggleContact(contact.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          contact.selected
                            ? "bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-xs"
                            : "bg-white border-slate-200 text-slate-500 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="text-emerald-600 focus:outline-none"
                          >
                            {contact.selected ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {contact.name}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 text-slate-400" />
                              {contact.phoneNumber}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeContact(contact.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {filteredContacts.length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">
                        No contacts match "{search}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste Contact List
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format: <code>Name, Phone</code> or one phone number per line.
                  E.g.
                  <br />
                  <code>John Doe, +94770660647</code>
                  <br />
                  <code>Jane Smith - 0712345678</code>
                </p>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Kasun Perera, +94771234567&#10;Kamal Silva, 0779876543&#10;+94711122334"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                Parse and Add to List
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            {contacts.length > 0 ? (
              <span>
                <strong className="text-slate-800">{selectedCount}</strong> of{" "}
                {contacts.length} selected
              </span>
            ) : (
              <span>No contacts loaded</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={importing || selectedCount === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <BookUser className="h-3.5 w-3.5" />
                  Import {selectedCount > 0 ? `(${selectedCount})` : ""} Leads
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
