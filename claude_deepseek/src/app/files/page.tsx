"use client";

import { useState, useEffect, useCallback } from "react";
import { DropZone } from "@/components/features/files/DropZone";
import { FileList } from "@/components/features/files/FileList";
import { UnmatchedList } from "@/components/features/files/UnmatchedList";
import { FilePreviewModal } from "@/components/features/files/FilePreviewModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useProject } from "@/lib/ProjectContext";

interface ArchivedFile {
  id: number;
  originalName: string;
  fileSize: number;
  captureDate: string | null;
  status: string;
  storedPath: string;
  createdAt: string;
  projectNode?: { id: number; name: string } | null;
}

interface ProjectNode {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export default function FilesPage() {
  const [allFiles, setAllFiles] = useState<ArchivedFile[]>([]);
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    summary: { total: number; classified: number; unmatched: number; skipped: number };
  } | null>(null);

  // 预览
  const [previewFile, setPreviewFile] = useState<ArchivedFile | null>(null);

  // 删除密码
  const [deleteTarget, setDeleteTarget] = useState<ArchivedFile | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { apiUrl, currentProject } = useProject();

  const loadData = useCallback(() => {
    if (!currentProject) return;
    fetch(apiUrl("/api/files"))
      .then((r) => r.json())
      .then((res) => { if (res.success) setAllFiles(res.data); })
      .catch(() => {});
    fetch(apiUrl("/api/nodes"))
      .then((r) => r.json())
      .then((res) => { if (res.success) setNodes(res.data); })
      .catch(() => {});
  }, [currentProject, apiUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFiles = async (fileList: FileList) => {
    setLoading(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("projectId", String(currentProject?.id || ""));
    for (let i = 0; i < fileList.length; i++) {
      formData.append("files", fileList[i]);
    }
    try {
      const res = await fetch(apiUrl("/api/files"), { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setImportResult(json.data);
        loadData();
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleReassign = async (fileId: number, nodeId: number) => {
    await fetch(apiUrl(`/api/files/${fileId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectNodeId: nodeId, projectId: String(currentProject?.id || "") }),
    });
    loadData();
  };

  const handleDeleteClick = (file: ArchivedFile) => {
    setDeleteTarget(file);
    setDeletePassword("");
    setDeleteError("");
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
      loadData();
      if (previewFile?.id === deleteTarget.id) setPreviewFile(null);
    } else {
      setDeleteError(json.error || "删除失败");
    }
    setDeleting(false);
  };

  const classified = allFiles.filter((f) => f.status === "CLASSIFIED");
  const unmatched = allFiles.filter((f) => f.status === "UNMATCHED");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">文件归档</h1>

      <DropZone onFiles={handleFiles} loading={loading} />

      {importResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 flex flex-wrap gap-3 sm:gap-6 text-sm">
          <div><span className="text-gray-500">总计：</span><span className="font-bold text-gray-800">{importResult.summary.total} 个文件</span></div>
          <div><span className="text-gray-500">已分类：</span><span className="font-bold text-green-700">{importResult.summary.classified}</span></div>
          <div><span className="text-gray-500">待确认：</span><span className="font-bold text-orange-700">{importResult.summary.unmatched}</span></div>
          {importResult.summary.skipped > 0 && (
            <div><span className="text-gray-500">已跳过（重复）：</span><span className="font-bold text-gray-500">{importResult.summary.skipped}</span></div>
          )}
        </div>
      )}

      <UnmatchedList files={unmatched} nodes={nodes} onReassign={handleReassign} onPreview={(f) => setPreviewFile(f)} />

      <FileList
        files={classified}
        title="已归档文件"
        onPreview={(f) => setPreviewFile(f)}
        onDelete={handleDeleteClick}
      />

      {allFiles.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>暂无归档文件，拖放文件到上方区域开始导入</p>
        </div>
      )}

      {/* 文件预览 */}
      {previewFile && (
        <FilePreviewModal
          fileId={previewFile.id}
          fileName={previewFile.originalName}
          onClose={() => setPreviewFile(null)}
          onDelete={(id) => {
            setPreviewFile(null);
            const f = allFiles.find((x) => x.id === id);
            if (f) handleDeleteClick(f);
          }}
        />
      )}

      {/* 删除密码确认 */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="删除文件">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确认删除 <span className="font-medium text-gray-800">"{deleteTarget?.originalName}"</span>？
            此操作将同时删除服务器上的文件，不可恢复。
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
          {deleteError && (
            <p className="text-sm text-red-600">{deleteError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
