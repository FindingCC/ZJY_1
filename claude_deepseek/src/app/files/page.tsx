"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DropZone } from "@/components/features/files/DropZone";
import { FileList } from "@/components/features/files/FileList";
import { UnmatchedList } from "@/components/features/files/UnmatchedList";
import { FilePreviewModal } from "@/components/features/files/FilePreviewModal";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card } from "@/components/ui/Card";
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

interface Receipt {
  id: number;
  originalName: string;
  fileSize: number;
  storedPath: string;
  receivedAt: string | null;
  supplier: string | null;
  remark: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fileIcon = (name: string): string => {
  if (/\.(jpg|jpeg|png|gif|heic|webp)$/i.test(name)) return "🖼️";
  if (/\.pdf$/i.test(name)) return "📄";
  if (/\.(doc|docx)$/i.test(name)) return "📝";
  if (/\.(xls|xlsx)$/i.test(name)) return "📊";
  return "📎";
};

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

  // 收货单
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptFileRef = useRef<HTMLInputElement>(null);
  const [receiptSupplier, setReceiptSupplier] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptRemark, setReceiptRemark] = useState("");
  const [receiptDeleteTarget, setReceiptDeleteTarget] = useState<Receipt | null>(null);
  const [receiptDelPwd, setReceiptDelPwd] = useState("");
  const [receiptDelErr, setReceiptDelErr] = useState("");
  const [receiptDeleting, setReceiptDeleting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<Receipt | null>(null);
  const [receiptFileNames, setReceiptFileNames] = useState<string[]>([]);

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
    fetch(apiUrl("/api/receipts"))
      .then((r) => r.json())
      .then((res) => { if (res.success) setReceipts(res.data); })
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

  // 收货单上传
  const handleReceiptUpload = async () => {
    const files = receiptFileRef.current?.files;
    if (!files?.length) return;
    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append("projectId", String(currentProject?.id || ""));
    formData.append("receivedAt", receiptDate || "");
    formData.append("supplier", receiptSupplier || "");
    formData.append("remark", receiptRemark || "");
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    try {
      const res = await fetch(apiUrl("/api/receipts"), { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        loadData();
        receiptFileRef.current!.value = "";
        setReceiptSupplier("");
        setReceiptRemark("");
        setReceiptFileNames([]);
        // 上传成功后清文件选择
      }
    } catch { /* ignore */ }
    setUploadingReceipt(false);
  };

  // 收货单删除
  const handleReceiptDeleteConfirm = async () => {
    if (!receiptDeleteTarget) return;
    setReceiptDeleting(true);
    setReceiptDelErr("");
    const res = await fetch(apiUrl(`/api/receipts/${receiptDeleteTarget.id}`), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: receiptDelPwd }),
    });
    const json = await res.json();
    if (json.success) {
      setReceiptDeleteTarget(null);
      loadData();
      if (receiptPreview?.id === receiptDeleteTarget.id) setReceiptPreview(null);
    } else {
      setReceiptDelErr(json.error || "删除失败");
    }
    setReceiptDeleting(false);
  };

  const classified = allFiles.filter((f) => f.status === "CLASSIFIED");
  const unmatched = allFiles.filter((f) => f.status === "UNMATCHED");

  // 收货单预览 URL
  const receiptPreviewUrl = receiptPreview
    ? `/api/serve-files?id=${receiptPreview.id}&type=receipt`
    : null;

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
        nodes={nodes}
        onMove={async (fileId, nodeId) => {
          await fetch(apiUrl(`/api/files/${fileId}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectNodeId: nodeId, projectId: String(currentProject?.id || "") }),
          });
          loadData();
        }}
        onPreview={(f) => setPreviewFile(f)}
        onDelete={handleDeleteClick}
      />

      {/* 收货单 */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">📦 收货单（{receipts.length}）</h3>

        {/* 上传区域 — 3栏输入 + 单独一行文件 */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">送货单位</label>
              <input
                type="text"
                value={receiptSupplier}
                onChange={(e) => setReceiptSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="供应商名称"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">收货日期</label>
              <input
                type="text"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value.replace(/[^\d-]/g, ""))}
                placeholder="YYYY-MM-DD"
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
              <input
                type="text"
                value={receiptRemark}
                onChange={(e) => setReceiptRemark(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-[9px] text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="选填"
              />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">文件</label>
              <div className="flex gap-2 items-center">
                <input
                  ref={receiptFileRef}
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    setReceiptFileNames(files ? Array.from(files).map((f) => f.name) : []);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => receiptFileRef.current?.click()}
                  className="shrink-0 px-3 py-[7px] rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                >
                  选择文件
                </button>
                <span className="text-sm text-gray-400 truncate">
                  {receiptFileNames.length > 0
                    ? `已选 ${receiptFileNames.length} 个文件`
                    : "未选择文件"}
                </span>
                <Button variant="primary" onClick={handleReceiptUpload} loading={uploadingReceipt} className="shrink-0 ml-auto">
                  上传
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* 列表 */}
        {receipts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无收货单，请上传</p>
        ) : (
          <div className="space-y-1">
            {receipts.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-gray-50">
                <button
                  onClick={() => setReceiptPreview(r)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <span className="flex-shrink-0">{fileIcon(r.originalName)}</span>
                  <span className="truncate text-blue-600 hover:underline" title={r.originalName}>
                    {r.originalName}
                  </span>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                  {r.supplier && <span className="hidden sm:inline text-gray-500">{r.supplier}</span>}
                  {r.receivedAt && <span className="hidden sm:inline">{r.receivedAt}</span>}
                  <span className="hidden sm:inline">{formatSize(r.fileSize)}</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setReceiptDeleteTarget(r); setReceiptDelPwd(""); setReceiptDelErr(""); }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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

      {/* 收货单预览 */}
      <Modal
        open={receiptPreview !== null}
        onClose={() => setReceiptPreview(null)}
        title={receiptPreview?.originalName || "预览"}
      >
        {receiptPreviewUrl && (
          <div className="max-h-[80vh] overflow-auto">
            {/\.(jpg|jpeg|png|gif|webp)$/i.test(receiptPreview?.originalName || "") ? (
              <img src={receiptPreviewUrl} alt={receiptPreview?.originalName} className="max-w-full h-auto" />
            ) : /\.pdf$/i.test(receiptPreview?.originalName || "") ? (
              <iframe src={receiptPreviewUrl} className="w-full h-[70vh]" title={receiptPreview?.originalName} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-3">该格式不支持预览</p>
                <a href={receiptPreviewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">下载打开</a>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <a href={receiptPreviewUrl} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">新标签打开</Button>
              </a>
              <Button variant="danger" size="sm" onClick={() => { setReceiptPreview(null); setReceiptDeleteTarget(receiptPreview); setReceiptDelPwd(""); setReceiptDelErr(""); }}>
                删除
              </Button>
            </div>
          </div>
        )}
      </Modal>

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

      {/* 收货单删除密码 */}
      <Modal open={receiptDeleteTarget !== null} onClose={() => setReceiptDeleteTarget(null)} title="删除收货单">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确认删除 <span className="font-medium text-gray-800">"{receiptDeleteTarget?.originalName}"</span>？
            此操作将同时删除文件，不可恢复。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请输入删除密码</label>
            <input
              type="password"
              value={receiptDelPwd}
              onChange={(e) => { setReceiptDelPwd(e.target.value); setReceiptDelErr(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleReceiptDeleteConfirm(); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="输入密码"
              autoFocus
            />
          </div>
          {receiptDelErr && (
            <p className="text-sm text-red-600">{receiptDelErr}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReceiptDeleteTarget(null)}>取消</Button>
            <Button variant="danger" onClick={handleReceiptDeleteConfirm} loading={receiptDeleting}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
