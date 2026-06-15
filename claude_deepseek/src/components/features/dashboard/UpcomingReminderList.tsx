import { Card } from "@/components/ui/Card";

interface UpcomingNode {
  id: number;
  name: string;
  endDate: string | null;
  daysLeft: number;
}

interface UpcomingReminderListProps {
  nodes: UpcomingNode[];
}

export function UpcomingReminderList({ nodes }: UpcomingReminderListProps) {
  const upcoming7d = nodes.filter((n) => n.daysLeft > 0 && n.daysLeft <= 7);

  if (upcoming7d.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">临近到期提醒</h3>
        <p className="text-sm text-gray-400">未来7天内没有到期节点</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        ⏰ 临近到期提醒
      </h3>
      <div className="space-y-2">
        {upcoming7d.map((node) => {
          const urgency = node.daysLeft <= 1 ? "text-red-600 bg-red-50 border-red-200"
            : node.daysLeft <= 3 ? "text-orange-600 bg-orange-50 border-orange-200"
            : "text-yellow-600 bg-yellow-50 border-yellow-200";

          return (
            <a
              key={node.id}
              href={`/nodes/${node.id}`}
              className={`block rounded-lg p-3 border transition-colors hover:opacity-80 ${urgency}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{node.name}</span>
                <span className="text-sm font-bold">
                  {node.daysLeft === 1 ? "明天到期" : `剩余${node.daysLeft}天`}
                </span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                截止: {node.endDate}
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}
