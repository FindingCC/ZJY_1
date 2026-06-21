"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CurrentNodeCard } from "@/components/features/dashboard/CurrentNodeCard";
import { OverdueNodeList } from "@/components/features/dashboard/OverdueNodeList";
import { UpcomingReminderList } from "@/components/features/dashboard/UpcomingReminderList";
import { StatsBar } from "@/components/features/dashboard/StatsBar";
import { NodeTimeline } from "@/components/features/nodes/NodeTimeline";
import { daysUntilDue } from "@/lib/date";
import { useProject } from "@/lib/ProjectContext";

interface ProjectNode {
  id: number;
  name: string;
  description: string | null;
  status: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  checklistItems: { isCompleted: boolean }[];
  template?: { name: string; category: string } | null;
}

export default function DashboardPage() {
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const { apiUrl, currentProject } = useProject();

  useEffect(() => {
    if (!currentProject) return;
    fetch(apiUrl("/api/nodes"))
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setNodes(res.data);
      })
      .finally(() => setLoading(false));
  }, [currentProject, apiUrl]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const overdueNodes = nodes
    .filter((n) => n.status === "OVERDUE")
    .map((n) => ({
      id: n.id,
      name: n.name,
      endDate: n.endDate,
      daysOverdue: n.endDate ? Math.abs(daysUntilDue(n.endDate)) : 0,
    }));

  const inProgressNodes = nodes.filter((n) => n.status === "IN_PROGRESS");

  const upcomingNodes = nodes
    .filter((n) => n.status !== "COMPLETED" && n.endDate)
    .map((n) => ({
      id: n.id,
      name: n.name,
      endDate: n.endDate,
      daysLeft: n.endDate ? daysUntilDue(n.endDate) : 999,
    }))
    .filter((n) => n.daysLeft >= 0);

  const stats = {
    total: nodes.length,
    inProgress: nodes.filter((n) => n.status === "IN_PROGRESS").length,
    completed: nodes.filter((n) => n.status === "COMPLETED").length,
    overdue: nodes.filter((n) => n.status === "OVERDUE").length,
  };

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <StatsBar {...stats} />

      {/* 报表导出 */}
      {currentProject && (
        <div className="flex gap-3">
          <a
            href={apiUrl("/api/reports?type=weekly")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            📄 下载周报
          </a>
          <a
            href={apiUrl("/api/reports?type=monthly")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            📊 下载月报
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：进行中的节点 + 时间线 */}
        <div className="lg:col-span-2 space-y-6">
          {inProgressNodes.length === 0 ? (
            <CurrentNodeCard node={null} daysLeft={0} />
          ) : (
            inProgressNodes.map((node) => (
              <CurrentNodeCard
                key={node.id}
                node={node}
                daysLeft={node.endDate ? daysUntilDue(node.endDate) : 0}
              />
            ))
          )}
          <NodeTimeline nodes={nodes} />
        </div>

        {/* 右栏：逾期 + 临近提醒 */}
        <div className="space-y-6">
          <OverdueNodeList nodes={overdueNodes} />
          <UpcomingReminderList nodes={upcomingNodes} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-16 sm:h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-200 rounded-xl h-40" />
          <div className="bg-gray-200 rounded-xl h-64" />
        </div>
        <div className="space-y-6">
          <div className="bg-gray-200 rounded-xl h-32" />
          <div className="bg-gray-200 rounded-xl h-48" />
        </div>
      </div>
    </div>
  );
}
