"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PasswordModal } from "@/components/ui/PasswordModal";
import { NodeCard } from "@/components/features/nodes/NodeCard";
import { NodeForm } from "@/components/features/nodes/NodeForm";

interface ProjectNode {
  id: number;
  name: string;
  description: string | null;
  status: string;
  order: number;
  startDate: string | null;
  endDate: string | null;
  template?: { name: string; category: string } | null;
}

const FILTERS = [
  { key: "", label: "全部" },
  { key: "IN_PROGRESS", label: "进行中" },
  { key: "COMPLETED", label: "已完成" },
  { key: "OVERDUE", label: "逾期" },
];

export default function NodesPageWrapper() {
  return (
    <Suspense>
      <NodesPage />
    </Suspense>
  );
}

function NodesPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialStatus);
  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<ProjectNode | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadNodes = () => {
    setLoading(true);
    const url = filter ? `/api/nodes?status=${filter}` : "/api/nodes";
    fetch(url)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setNodes(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadNodes(); }, [filter]);

  const handleDelete = async (id: number, password: string) => {
    const res = await fetch(`/api/nodes/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    setDeleteConfirm(null);
    loadNodes();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">施工节点管理</h1>
        <Button onClick={() => { setEditingNode(null); setShowForm(true); }}>
          + 新增节点
        </Button>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); window.history.replaceState({}, "", `/nodes?status=${f.key}`); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 节点列表 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : nodes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p>暂无施工节点，点击"新增节点"开始</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onEdit={() => { setEditingNode(node); setShowForm(true); }}
              onDelete={() => setDeleteConfirm(node.id)}
            />
          ))}
        </div>
      )}

      {/* 新增/编辑表单 */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingNode ? "编辑节点" : "新增施工节点"}
      >
        <NodeForm
          initial={editingNode ? {
            id: editingNode.id,
            name: editingNode.name,
            description: editingNode.description || "",
            order: editingNode.order,
            startDate: editingNode.startDate || "",
            endDate: editingNode.endDate || "",
          } : undefined}
          onSubmit={() => { setShowForm(false); loadNodes(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* 删除密码确认 */}
      <PasswordModal
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="删除节点"
        message="删除后无法恢复，节点下的所有清单项和提醒记录将被一并删除。"
        onConfirm={async (password) => {
          if (deleteConfirm === null) throw new Error();
          await handleDelete(deleteConfirm, password);
        }}
      />
    </div>
  );
}
