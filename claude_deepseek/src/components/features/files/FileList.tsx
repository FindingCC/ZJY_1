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
  projectNode?: { id: number; name: string } | null;
}

interface ProjectNode {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface FileListProps {
  files: ArchivedFile[];
  title: string;
  nodes: ProjectNode[];
  onMove: (fileId: number, nodeId: number) => Promise<void>;
  onPreview?: (file: ArchivedFile) => void;
  onDelete?: (file: ArchivedFile) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fileIcon = (name: string): string => {
  if (/\.(jpg|jpeg|png|gif|heic|webp)$/i.test(name)) return "🖼️";
  if (/\.pdf$/i.test(name)) return "📄";
  if (/\.(doc|docx)$/i.test(name)) return "📝";
  if (/\.(xls|xlsx)$/i.test(name)) return "📊";
  if (/\.dwg$/i.test(name)) return "📐";
  return "📎";
};

export function FileList({ files, title, nodes, onMove, onPreview, onDelete }: FileListProps) {
  const [movingId, setMovingId] = useState<number | null>(null);

  if (files.length === 0) return null;

  const handleMove = async (fileId: number, nodeId: number) => {
    setMovingId(fileId);
    await onMove(fileId, nodeId);
    setMovingId(null);
  };

  // 按节点分组
  const grouped = new Map<string, ArchivedFile[]>();
  for (const f of files) {
    const key = f.projectNode?.name || "未分类";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}（{files.length}）</h3>
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([nodeName, nodeFiles]) => (
          <div key={nodeName}>
            <h4 className="text-sm font-medium text-blue-700 mb-2">
              📂 {nodeName}（{nodeFiles.length}）
            </h4>
            <div className="space-y-1">
              {nodeFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <button
                    onClick={() => onPreview?.(f)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                  >
                    <span className="flex-shrink-0">{fileIcon(f.originalName)}</span>
                    <span className="truncate text-blue-600 hover:underline" title={f.originalName}>
                      {f.originalName}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 text-xs text-gray-400">
                    <span className="hidden sm:inline">{formatSize(f.fileSize)}</span>
                    {f.captureDate && <span className="hidden sm:inline">{f.captureDate}</span>}
                    <select
                      className="text-xs border border-gray-300 rounded px-1 py-1.5 w-8 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none text-center"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) handleMove(f.id, parseInt(e.target.value));
                      }}
                      disabled={movingId === f.id}
                    >
                      <option value="">⇄</option>
                      {nodes
                        .filter((n) => n.id !== f.projectNode?.id)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                    </select>
                    {onDelete && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onDelete(f); }}
                      >
                        删除
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
