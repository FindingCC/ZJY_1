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

interface FileListProps {
  files: ArchivedFile[];
  title: string;
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

export function FileList({ files, title, onPreview, onDelete }: FileListProps) {
  if (files.length === 0) return null;

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
                  className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
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
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
                    <span>{formatSize(f.fileSize)}</span>
                    {f.captureDate && <span>{f.captureDate}</span>}
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
