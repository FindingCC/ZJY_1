"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CurrentNodeCard } from "@/components/features/dashboard/CurrentNodeCard";
import { OverdueNodeList } from "@/components/features/dashboard/OverdueNodeList";
import { UpcomingReminderList } from "@/components/features/dashboard/UpcomingReminderList";
import { StatsBar } from "@/components/features/dashboard/StatsBar";
import { NodeTimeline } from "@/components/features/nodes/NodeTimeline";
import { daysUntilDue } from "@/lib/date";

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

  useEffect(() => {
    fetch("/api/nodes")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setNodes(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const inProgressNode = nodes.find((n) => n.status === "IN_PROGRESS") || nodes.find((n) => n.status !== "COMPLETED" && n.status !== "OVERDUE");

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

  const inProgressDaysLeft = inProgressNode?.endDate ? daysUntilDue(inProgressNode.endDate) : 0;

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <StatsBar {...stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：当前节点 + 时间线 */}
        <div className="lg:col-span-2 space-y-6">
          <CurrentNodeCard node={inProgressNode || null} daysLeft={inProgressDaysLeft} />
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
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-20" />
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
