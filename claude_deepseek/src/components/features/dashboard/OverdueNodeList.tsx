import { Card } from "@/components/ui/Card";

interface OverdueNode {
  id: number;
  name: string;
  endDate: string | null;
  daysOverdue: number;
}

interface OverdueNodeListProps {
  nodes: OverdueNode[];
}

export function OverdueNodeList({ nodes }: OverdueNodeListProps) {
  if (nodes.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">逾期节点</h3>
        <p className="text-sm text-green-600 dark:text-green-400">✓ 没有逾期节点</p>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
        🚨 逾期节点 ({nodes.length})
      </h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <a
            key={node.id}
            href={`/nodes/${node.id}`}
            className="block bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 dark:text-gray-100">{node.name}</span>
              <span className="text-sm text-red-600 font-bold">
                逾期{node.daysOverdue}天
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              截止: {node.endDate}
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
