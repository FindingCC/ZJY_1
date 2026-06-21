interface TimelineNode {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface NodeTimelineProps {
  nodes: TimelineNode[];
}

export function NodeTimeline({ nodes }: NodeTimelineProps) {
  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">施工进度</h3>
        <p className="text-sm text-gray-400">暂无节点数据</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-500";
      case "IN_PROGRESS": return "bg-blue-500";
      case "OVERDUE": return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">施工进度时间线</h3>
      <div className="relative">
        {/* 连线 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-3 sm:space-y-4">
          {nodes.map((node, i) => (
            <div key={node.id} className="flex items-start gap-4 relative">
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusColor(node.status)}`}
              >
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <a
                href={`/nodes/${node.id}`}
                className={`flex-1 min-w-0 hover:underline ${
                  node.status === "OVERDUE" ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="font-medium text-sm">{node.name}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {node.startDate && `${node.startDate} ~ `}
                  {node.endDate || "未设置"}
                </span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
