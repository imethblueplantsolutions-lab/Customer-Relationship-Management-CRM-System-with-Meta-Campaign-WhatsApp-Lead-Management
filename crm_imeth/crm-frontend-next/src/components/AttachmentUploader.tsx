"use client";

import { useState, useRef } from "react";
import type { Attachment } from "@/types";
import {
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Download,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

interface AttachmentUploaderProps {
  leadId?: string;
  followupId?: string;
  attachments: Attachment[];
  onUploadSuccess: (attachment: Attachment) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  title?: string;
}

export default function AttachmentUploader({
  leadId,
  followupId,
  attachments = [],
  onUploadSuccess,
  onDeleteAttachment,
  title,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
  const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_URL || "";

  // Upload single file logic
  const uploadSingleFile = async (file: File) => {
    // 25MB file size limit validation
    if (file.size > 25 * 1024 * 1024) {
      throw new Error(`File "${file.name}" exceeds the 25MB size limit.`);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const formData = new FormData();
    formData.append("file", file);
    if (leadId) formData.append("leadId", leadId);
    if (followupId) formData.append("followupId", followupId);

    const response = await fetch(`${API_BASE_URL}/attachments`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.success && data.data) {
      onUploadSuccess(data.data);
    } else {
      throw new Error(data.error || `Failed to upload ${file.name}`);
    }
  };

  // Upload multiple files concurrently (up to 3 in parallel)
  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const results: string[] = [];
      const CONCURRENCY_LIMIT = 3;
      for (let i = 0; i < fileList.length; i += CONCURRENCY_LIMIT) {
        const batch = fileList.slice(i, i + CONCURRENCY_LIMIT);
        const batchResults = await Promise.allSettled(batch.map((f) => uploadSingleFile(f)));
        for (const res of batchResults) {
          if (res.status === "rejected") {
            results.push(res.reason instanceof Error ? res.reason.message : "Upload failed");
          }
        }
      }
      if (results.length > 0) {
        setError(results.join("; "));
        toast.error(`Some files failed: ${results[0]}`);
      } else {
        toast.success(fileList.length === 1 ? "File uploaded successfully" : `${fileList.length} files uploaded successfully`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete attachment handler
  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;

    setDeletingId(attachmentToDelete.id);
    setError("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(`${API_BASE_URL}/attachments/${attachmentToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Attachment deleted");
        if (onDeleteAttachment) {
          onDeleteAttachment(attachmentToDelete.id);
        }
      } else {
        const msg = data.error || "Failed to delete attachment";
        setError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting attachment";
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
      setAttachmentToDelete(null);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  // Helper format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Get file type icon
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />;
    if (fileType.includes("pdf") || fileType.includes("text"))
      return <FileText className="h-4 w-4 text-blue-600 shrink-0" />;
    return <File className="h-4 w-4 text-slate-500 shrink-0" />;
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input (supports multiple files) */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag-and-Drop Dropzone UI */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
          isDragging
            ? "border-blue-500 bg-[#BBE1FA]/30 scale-[1.01]"
            : "border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-2 gap-2 text-blue-600">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-xs font-bold">Uploading file attachment...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-blue-600">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to upload <span className="text-slate-400 font-normal">or drag & drop</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, PNG, JPG, DOCX, CSV up to 25MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Attachments Display Grid/List */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-blue-600" />
            {title || "Attachments"} ({attachments.length})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((att) => {
              const fullUrl = att.fileUrl.startsWith("http")
                ? att.fileUrl
                : `${BACKEND_ORIGIN}${att.fileUrl}`;

              const isDeleting = deletingId === att.id;

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                      {getFileIcon(att.fileType)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={att.fileName}>
                        {att.fileName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>{formatFileSize(att.fileSize)}</span>
                        {att.createdBy?.name && (
                          <>
                            <span>•</span>
                            <span className="truncate">{att.createdBy.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="View / Download File"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    {onDeleteAttachment && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachmentToDelete(att);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Attachment"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!attachmentToDelete}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${attachmentToDelete?.fileName}"? This action cannot be undone.`}
        confirmLabel="Delete Attachment"
        variant="danger"
        isLoading={!!deletingId}
        onConfirm={confirmDeleteAttachment}
        onClose={() => setAttachmentToDelete(null)}
      />
    </div>
  );
}
