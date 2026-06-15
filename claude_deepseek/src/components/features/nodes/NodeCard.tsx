import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface NodeCardProps {
  node: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    order: number;
    startDate: string | null;
    endDate: string | null;
    template?: { name: string; category: string } | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function NodeCard({ node, onEdit, onDelete }: NodeCardProps) {
  const isOverdue = node.status === "OVERDUE";

  return (
    <div
      className={`bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
        isOverdue ? "border-red-300 bg-red-50/30 animate-pulse-red" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">#{String(node.order).padStart(2, "0")}</span>
            <a
              href={`/nodes/${node.id}`}
              className={`font-semibold hover:underline ${isOverdue ? "text-red-700" : "text-gray-800"}`}
            >
              {node.name}
            </a>
            <Badge status={node.status} />
          </div>
          {node.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{node.description}</p>
          )}
          {node.template && (
            <p className="text-xs text-gray-400 mt-1">
              模板：{node.template.name}（{node.template.category}）
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={onEdit}>编辑</Button>
          <Button variant="danger" size="sm" onClick={onDelete}>删除</Button>
        </div>
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span>开始：{node.startDate || "未设置"}</span>
        <span>截止：{node.endDate || "未设置"}</span>
        {isOverdue && node.endDate && (
          <span className="text-red-600 font-bold">已逾期</span>
        )}
      </div>
    </div>
  );
}
