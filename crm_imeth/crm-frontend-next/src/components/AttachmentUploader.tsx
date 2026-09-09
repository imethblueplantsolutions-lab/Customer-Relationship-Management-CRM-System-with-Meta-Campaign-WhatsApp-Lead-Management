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
} from "lucide-react";

interface AttachmentUploaderProps {
  leadId?: string;
  followupId?: string;
  attachments: Attachment[];
  onUploadSuccess: (attachment: Attachment) => void;
}

export default function AttachmentUploader({
  leadId,
  followupId,
  attachments = [],
  onUploadSuccess,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const BACKEND_ORIGIN =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Upload file logic
  const handleUploadFile = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
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
        setError(data.error || "File upload failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error uploading file");
    } finally {
      setUploading(false);
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
      const droppedFile = e.dataTransfer.files[0];
      handleUploadFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      handleUploadFile(selectedFile);
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
      {/* Hidden File Input */}
      <input
        type="file"
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
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none ${
          isDragging
            ? "border-[#128c7e] bg-emerald-50/80 scale-[1.01]"
            : "border-slate-300 hover:border-[#128c7e] bg-slate-50/50 hover:bg-slate-50"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center py-2 gap-2 text-[#128c7e]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs font-bold">Uploading file attachment...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#128c7e]">
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
            <Paperclip className="h-3.5 w-3.5 text-[#128c7e]" />
            Attachments ({attachments.length})
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((att) => {
              const fullUrl = att.fileUrl.startsWith("http")
                ? att.fileUrl
                : `${BACKEND_ORIGIN}${att.fileUrl}`;

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      {getFileIcon(att.fileType)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate" title={att.fileName}>
                        {att.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {formatFileSize(att.fileSize)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#128c7e] hover:bg-slate-100 transition-colors shrink-0"
                    title="View / Download File"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
