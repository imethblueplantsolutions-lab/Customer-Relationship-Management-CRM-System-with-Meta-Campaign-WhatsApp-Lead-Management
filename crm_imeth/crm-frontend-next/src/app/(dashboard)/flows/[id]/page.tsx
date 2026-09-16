"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const FlowEditorContent = dynamic(() => import("./FlowEditorContent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  ),
});

export default function FlowEditorPage() {
  return <FlowEditorContent />;
}
