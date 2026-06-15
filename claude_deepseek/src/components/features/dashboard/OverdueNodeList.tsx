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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">逾期节点</h3>
        <p className="text-sm text-green-600">✓ 没有逾期节点</p>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500 bg-red-50/50">
      <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
        🚨 逾期节点 ({nodes.length})
      </h3>
      <div className="space-y-2">
        {nodes.map((node) => (
          <a
            key={node.id}
            href={`/nodes/${node.id}`}
            className="block bg-white rounded-lg p-3 border border-red-200 hover:border-red-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{node.name}</span>
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
