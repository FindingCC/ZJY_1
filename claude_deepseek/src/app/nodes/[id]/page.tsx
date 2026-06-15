"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NodeForm } from "@/components/features/nodes/NodeForm";
import { ChecklistItemView } from "@/components/features/checklist/ChecklistItem";
import { ChecklistForm } from "@/components/features/checklist/ChecklistForm";
import { daysUntilDue } from "@/lib/date";

interface ProjectNode {
  id: number;
  name: string;
  description: string | null;
  status: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  templateId: number | null;
  template?: { name: string; category: string } | null;
  checklistItems: { id: number; content: string; isCompleted: boolean; order: number }[];
}

export default function NodeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [node, setNode] = useState<ProjectNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadNode = useCallback(() => {
    setLoading(true);
    fetch(`/api/nodes/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setNode(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadNode(); }, [loadNode]);

  const handleToggleChecklist = async (itemId: number, isCompleted: boolean) => {
    await fetch(`/api/nodes/${id}/checklist/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ isCompleted }),
    });
    loadNode();
  };

  const handleEditChecklist = async (itemId: number, content: string) => {
    await fetch(`/api/nodes/${id}/checklist/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    loadNode();
  };

  const handleDeleteChecklist = async (itemId: number) => {
    await fetch(`/api/nodes/${id}/checklist/${itemId}`, { method: "DELETE" });
    loadNode();
  };

  const handleAddChecklist = async (content: string) => {
    await fetch(`/api/nodes/${id}/checklist`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    loadNode();
  };

  const handleUpdateStatus = async (status: string) => {
    await fetch(`/api/nodes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    loadNode();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-gray-200 rounded-xl h-12 w-48" />
        <div className="bg-gray-200 rounded-xl h-32" />
        <div className="bg-gray-200 rounded-xl h-64" />
      </div>
    );
  }

  if (!node) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">🔍</p>
        <p>节点不存在</p>
        <a href="/nodes" className="text-blue-600 hover:underline mt-2 inline-block">返回列表</a>
      </div>
    );
  }

  const completedCount = node.checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = node.checklistItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const daysLeft = node.endDate ? daysUntilDue(node.endDate) : null;
  const isOverdue = node.status === "OVERDUE";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 返回链接 */}
      <a href="/nodes" className="text-sm text-blue-600 hover:underline">← 返回节点列表</a>

      {/* 节点信息卡片 */}
      <Card className={isOverdue ? "border-l-4 border-l-red-500 bg-red-50/30" : ""}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-800">{node.name}</h1>
              <Badge status={node.status} />
              {isOverdue && daysLeft !== null && (
                <span className="text-sm text-red-600 font-bold">
                  逾期{Math.abs(daysLeft)}天！
                </span>
              )}
            </div>
            {node.description && (
              <p className="text-sm text-gray-500">{node.description}</p>
            )}
            {node.template && (
              <p className="text-xs text-gray-400 mt-1">
                基于模板：{node.template.name}（{node.template.category}）
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>编辑</Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>删除</Button>
          </div>
        </div>

        {/* 日期 + 状态操作 */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-400">开始日期</span>
            <p className="text-gray-700 font-medium">{node.startDate || "未设置"}</p>
          </div>
          <div>
            <span className="text-gray-400">截止日期</span>
            <p className={`font-medium ${isOverdue ? "text-red-600" : daysLeft !== null && daysLeft <= 3 ? "text-orange-600" : "text-gray-700"}`}>
              {node.endDate || "未设置"}
              {daysLeft !== null && daysLeft >= 0 && !isOverdue && (
                <span className="ml-1 text-xs">（剩余{daysLeft}天）</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-gray-400">状态</span>
            <select
              value={node.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              className="block w-full mt-0.5 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="PENDING">未开始</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </div>
        </div>

        {/* 进度条 */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">前置准备清单进度</span>
            <span className="text-gray-700 font-medium">{completedCount}/{totalCount}（{progress}%）</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* 前置准备清单 */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">前置准备清单</h3>
        <div className="mb-4">
          <ChecklistForm onAdd={handleAddChecklist} />
        </div>
        <div className="divide-y divide-gray-100">
          {node.checklistItems.map((item) => (
            <ChecklistItemView
              key={item.id}
              item={item}
              onToggle={handleToggleChecklist}
              onEdit={handleEditChecklist}
              onDelete={handleDeleteChecklist}
            />
          ))}
        </div>
        {node.checklistItems.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">暂无清单项，请添加</p>
        )}
      </Card>

      {/* 编辑表单模态框 */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="编辑节点"
      >
        <NodeForm
          initial={{
            id: node.id,
            name: node.name,
            description: node.description || "",
            order: node.order,
            startDate: node.startDate || "",
            endDate: node.endDate || "",
          }}
          onSubmit={() => { setShowEdit(false); loadNode(); }}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="确认删除"
      >
        <p className="text-sm text-gray-600 mb-4">
          删除后无法恢复，节点下的所有清单项和提醒记录将被一并删除。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(false)}>取消</Button>
          <Button
            variant="danger"
            onClick={async () => {
              await fetch(`/api/nodes/${id}`, { method: "DELETE" });
              window.location.href = "/nodes";
            }}
          >
            确认删除
          </Button>
        </div>
      </Modal>
    </div>
  );
}
