"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

interface SafetyFile {
  id: number;
  originalName: string;
  fileSize: number;
  storedPath: string;
  createdAt: string;
}

interface SafetyStudy {
  id: number;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  files: SafetyFile[];
}

export default function SafetyPage() {
  const { currentProject, apiUrl } = useProject();
  const [studies, setStudies] = useState<SafetyStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInit, setShowInit] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [initMsg, setInitMsg] = useState("");
  const [previewFile, setPreviewFile] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    if (!currentProject) return;
    const res = await fetch(apiUrl("/api/safety-studies"));
    const json = await res.json();
    if (json.success) {
      setStudies(json.data);
      // 没数据时自动弹初始化
      if (json.data.length === 0) setShowInit(true);
    }
    setLoading(false);
  }, [currentProject, apiUrl]);

  useEffect(() => { load(); }, [load]);

  const handleInit = async () => {
    if (!startDate || !currentProject) return;
    setInitMsg("生成中...");
    const res = await fetch("/api/safety-studies/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: currentProject.id, startDate }),
    });
    const json = await res.json();
    if (json.success) {
      setInitMsg(`已生成 ${json.data.created} 周记录`);
      setShowInit(false);
      load();
    } else {
      setInitMsg(json.error || "失败");
    }
  };

  const handleUpload = async (studyId: number, fileList: FileList | null) => {
    if (!fileList?.length || !currentProject) return;
    const fd = new FormData();
    fd.append("projectId", String(currentProject.id));
    fd.append("safetyStudyId", String(studyId));
    for (let i = 0; i < fileList.length; i++) fd.append("files", fileList[i]);
    await fetch(apiUrl("/api/safety-studies"), { method: "POST", body: fd });
    load();
  };

  const isImage = (n: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">每周安全学习记录</h1>
        <Button onClick={() => setShowInit(true)} variant="ghost" size="sm">初始化周次</Button>
      </div>

      {/* 初始化弹窗 */}
      <Modal open={showInit} onClose={() => { if (studies.length > 0) setShowInit(false); }} title="初始化安全学习记录">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">输入管理人员进场时间，系统将自动生成每周的学习记录。</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">进场日期</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {initMsg && <p className="text-sm text-blue-600">{initMsg}</p>}
          <Button onClick={handleInit} loading={initMsg === "生成中..."}>生成周记录</Button>
        </div>
      </Modal>

      {loading ? <div className="bg-gray-200 rounded-xl h-32 animate-pulse" /> :
        studies.map((s) => (
          <Card key={s.id}>
            <h3 className="text-base font-semibold text-gray-800 mb-2">{s.weekLabel}</h3>
            <div className="space-y-1">
              {s.files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm py-1">
                  <button onClick={() => setPreviewFile({ id: f.id, name: f.originalName })}
                    className="text-blue-600 hover:underline truncate">
                    {isImage(f.originalName) ? "🖼" : "📄"} {f.originalName}
                  </button>
                </div>
              ))}
            </div>
            <label className="inline-block mt-2 text-xs text-blue-600 cursor-pointer hover:underline">
              + 上传文件
              <input type="file" multiple className="hidden" onChange={(e) => handleUpload(s.id, e.target.files)} accept="image/*,.pdf,.doc,.docx" />
            </label>
          </Card>
        ))
      }

      {/* 预览 */}
      <Modal open={!!previewFile} onClose={() => setPreviewFile(null)} title={previewFile?.name || ""}>
        {previewFile && isImage(previewFile.name) ? (
          <img src={`/api/files/serve-drawing?id=${previewFile.id}&type=safety`} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain" />
        ) : previewFile ? (
          <a href={`/api/files/serve-drawing?id=${previewFile.id}&type=safety`} target="_blank" className="text-blue-600 underline">在新窗口打开</a>
        ) : null}
      </Modal>
    </div>
  );
}
