import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface CurrentNodeProps {
  node: {
    id: number;
    name: string;
    description: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    checklistItems: { isCompleted: boolean }[];
  } | null;
  daysLeft: number;
}

export function CurrentNodeCard({ node, daysLeft }: CurrentNodeProps) {
  if (!node) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">当前节点</h3>
        <p className="text-gray-400 dark:text-gray-500">暂无进行中的节点</p>
      </Card>
    );
  }

  const completed = node.checklistItems.filter((c) => c.isCompleted).length;
  const total = node.checklistItems.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <a href={`/nodes/${node.id}`} className="block">
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 transition-colors">{node.name}</h3>
            {node.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{node.description}</p>
            )}
          </div>
          <Badge status={node.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 text-sm">
          <div>
            <span className="text-gray-400 dark:text-gray-500">开始：</span>
            <span className="text-gray-700 dark:text-gray-300 ml-1">{node.startDate || "未设置"}</span>
          </div>
          <div>
            <span className="text-gray-400 dark:text-gray-500">截止：</span>
            <span className={`ml-1 font-medium ${daysLeft < 0 ? "text-red-600" : daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-orange-600" : "text-gray-700 dark:text-gray-300"}`}>
              {node.endDate || "未设置"}
              {node.endDate && daysLeft >= 0 && (
                <span className="ml-1">（剩余{daysLeft}天）</span>
              )}
              {node.endDate && daysLeft < 0 && (
                <span className="ml-1">（逾期{Math.abs(daysLeft)}天）</span>
              )}
            </span>
          </div>
        </div>

        {/* 进度条 */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>前置准备清单</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>
    </a>
  );
}
