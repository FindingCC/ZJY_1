"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ArchivedFile {
  id: number;
  originalName: string;
  fileSize: number;
  captureDate: string | null;
  status: string;
  storedPath: string;
  createdAt: string;
}

interface ProjectNode {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface UnmatchedListProps {
  files: ArchivedFile[];
  nodes: ProjectNode[];
  onReassign: (fileId: number, nodeId: number) => Promise<void>;
  onPreview?: (file: ArchivedFile) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UnmatchedList({ files, nodes, onReassign, onPreview }: UnmatchedListProps) {
  const [reassigning, setReassigning] = useState<number | null>(null);

  if (files.length === 0) return null;

  const handleReassign = async (fileId: number, nodeId: number) => {
    setReassigning(fileId);
    await onReassign(fileId, nodeId);
    setReassigning(null);
  };

  return (
    <Card className="border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-950/30">
      <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">
        ⚠️ 待人工确认（{files.length}）
      </h3>
      <div className="space-y-2">
        {files.map((f) => (
          <div
            key={f.id}
            className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-200 dark:border-orange-800"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-gray-400 flex-shrink-0">
                {/\.(jpg|jpeg|png|gif|heic|webp)$/i.test(f.originalName) ? "🖼️" : "📎"}
              </span>
              <div className="min-w-0">
                <button
                  onClick={() => onPreview?.(f)}
                  className="text-sm text-blue-600 hover:underline truncate text-left"
                >
                  {f.originalName}
                </button>
                <p className="text-xs text-gray-400">
                  {formatSize(f.fileSize)}
                  {f.captureDate && ` · ${f.captureDate}`}
                </p>
              </div>
            </div>
            <select
              className="ml-2 sm:ml-3 text-xs border border-gray-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none max-w-[120px] sm:max-w-none"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleReassign(f.id, parseInt(e.target.value));
              }}
              disabled={reassigning === f.id}
            >
              <option value="" disabled>
                {reassigning === f.id ? "分配中..." : "分配到..."}
              </option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} {n.startDate ? `(${n.startDate}~${n.endDate})` : ""}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}
