"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NodeForm } from "@/components/features/nodes/NodeForm";
import { ChecklistItemView } from "@/components/features/checklist/ChecklistItem";
import { ChecklistForm } from "@/components/features/checklist/ChecklistForm";
import { FilePreviewModal } from "@/components/features/files/FilePreviewModal";
import { PasswordModal } from "@/components/ui/PasswordModal";
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
  const [showDeleteNode, setShowDeleteNode] = useState(false);
  const [deleteChecklistTarget, setDeleteChecklistTarget] = useState<number | null>(null);
  const { apiUrl, currentProject } = useProject();

  const loadNode = useCallback(() => {
    if (!currentProject) return;
    setLoading(true);
    fetch(apiUrl(`/api/nodes/${id}`))
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setNode(res.data);
      })
      .finally(() => setLoading(false));
  }, [id, currentProject, apiUrl]);

  useEffect(() => { loadNode(); }, [loadNode]);

  const handleToggleChecklist = async (itemId: number, isCompleted: boolean) => {
    // 乐观更新：立即改本地状态，不刷新页面
    setNode((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems.map((c) =>
          c.id === itemId ? { ...c, isCompleted } : c
        ),
      };
    });
    await fetch(apiUrl(`/api/nodes/${id}/checklist/${itemId}`), {
      method: "PUT",
      body: JSON.stringify({ isCompleted }),
    });
  };

  const handleEditChecklist = async (itemId: number, content: string) => {
    setNode((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems.map((c) =>
          c.id === itemId ? { ...c, content } : c
        ),
      };
    });
    await fetch(apiUrl(`/api/nodes/${id}/checklist/${itemId}`), {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  };

  const handleDeleteChecklist = async (itemId: number, password: string) => {
    const res = await fetch(apiUrl(`/api/nodes/${id}/checklist/${itemId}`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    // 乐观删除本地记录
    setNode((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems.filter((c) => c.id !== itemId),
      };
    });
  };

  const handleAddChecklist = async (content: string) => {
    await fetch(apiUrl(`/api/nodes/${id}/checklist`), {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    loadNode();
  };

  const handleUpdateStatus = async (status: string) => {
    await fetch(apiUrl(`/api/nodes/${id}`), {
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
            <Button variant="danger" size="sm" onClick={() => setShowDeleteNode(true)}>删除</Button>
          </div>
        </div>

        {/* 日期 + 状态操作 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 text-sm">
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
              onDelete={(itemId) => setDeleteChecklistTarget(itemId)}
            />
          ))}
        </div>
        {node.checklistItems.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">暂无清单项，请添加</p>
        )}
      </Card>

      {/* 归档文件区块 */}
      <ArchivedFilesSection nodeId={parseInt(id)} />

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

      {/* 删除节点密码确认 */}
      <PasswordModal
        open={showDeleteNode}
        onClose={() => setShowDeleteNode(false)}
        title="删除节点"
        message={`确认删除节点"${node.name}"？删除后不可恢复，节点下的所有清单项和提醒记录将被一并删除。`}
        onConfirm={async (password) => {
          const res = await fetch(apiUrl(`/api/nodes/${id}`), {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          window.location.href = "/nodes";
        }}
      />

      {/* 删除清单项密码确认 */}
      <PasswordModal
        open={deleteChecklistTarget !== null}
        onClose={() => setDeleteChecklistTarget(null)}
        title="删除清单项"
        message="确认删除此清单项？"
        onConfirm={async (password) => {
          if (deleteChecklistTarget === null) throw new Error();
          await handleDeleteChecklist(deleteChecklistTarget, password);
          setDeleteChecklistTarget(null);
        }}
      />
    </div>
  );
}

function ArchivedFilesSection({ nodeId }: { nodeId: number }) {
  const [files, setFiles] = useState<{
    id: number;
    originalName: string;
    fileSize: number;
    captureDate: string | null;
    storedPath: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string } | null>(null);

  // 删除密码
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { apiUrl, currentProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(() => {
    if (!currentProject) return;
    fetch(apiUrl(`/api/files?nodeId=${nodeId}`))
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setFiles(res.data);
      })
      .finally(() => setLoading(false));
  }, [nodeId, currentProject, apiUrl]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("nodeId", String(nodeId));
    formData.append("projectId", String(currentProject?.id || ""));
    for (let i = 0; i < fileList.length; i++) {
      formData.append("files", fileList[i]);
    }
    await fetch(apiUrl("/api/files"), { method: "POST", body: formData });
    setUploading(false);
    loadFiles();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(apiUrl(`/api/files/${deleteTarget.id}`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const json = await res.json();
    if (json.success) {
      setDeleteTarget(null);
      if (previewFile?.id === deleteTarget.id) setPreviewFile(null);
      loadFiles();
    } else {
      setDeleteError(json.error || "删除失败");
    }
    setDeleting(false);
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
  const fileIcon = (name: string) => {
    if (isImage(name)) return "🖼️";
    if (/\.pdf$/i.test(name)) return "📄";
    if (/\.(doc|docx)$/i.test(name)) return "📝";
    if (/\.(xls|xlsx)$/i.test(name)) return "📊";
    if (/\.dwg$/i.test(name)) return "📐";
    return "📎";
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          归档文件{files.length > 0 && `（${files.length}）`}
        </h3>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.rar"
          />
          <Button
            variant="ghost"
            size="sm"
            loading={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            + 上传文件
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-gray-200 rounded-lg h-16 animate-pulse" />
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          暂无归档文件，点击"上传文件"将现场照片或扫描件添加到此处
        </p>
      ) : (
        <div className="space-y-1">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between text-sm py-2 px-2 rounded hover:bg-gray-50 group"
            >
              <button
                onClick={() => setPreviewFile({ id: f.id, name: f.originalName })}
                className="flex items-center gap-2 min-w-0 flex-1 text-left"
              >
                <span className="flex-shrink-0">{fileIcon(f.originalName)}</span>
                <span className="truncate text-blue-600 hover:underline" title={f.originalName}>
                  {f.originalName}
                </span>
              </button>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-400">
                <span>{formatSize(f.fileSize)}</span>
                {f.captureDate && <span>{f.captureDate}</span>}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: f.id, name: f.originalName }); }}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 文件预览 */}
      {previewFile && (
        <FilePreviewModal
          fileId={previewFile.id}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
          onDelete={(id) => {
            const f = files.find((x) => x.id === id);
            if (f) { setPreviewFile(null); setDeleteTarget({ id: f.id, name: f.originalName }); }
          }}
        />
      )}

      {/* 删除密码确认 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="删除文件">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确认删除 <span className="font-medium text-gray-800">"{deleteTarget?.name}"</span>？此操作不可恢复。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请输入删除密码</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleDeleteConfirm(); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="输入密码"
              autoFocus
            />
          </div>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>确认删除</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
