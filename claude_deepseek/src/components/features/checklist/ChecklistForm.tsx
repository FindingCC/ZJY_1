"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ChecklistFormProps {
  onAdd: (content: string) => Promise<void>;
}

export function ChecklistForm({ onAdd }: ChecklistFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    await onAdd(content.trim());
    setContent("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="添加新的准备清单项..."
        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
        添加
      </Button>
    </form>
  );
}
