"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProject } from "@/lib/ProjectContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { key: "土建施工", label: "土建施工", icon: "🏗" },
  { key: "电气一次", label: "电气一次", icon: "⚡" },
  { key: "电气二次", label: "电气二次", icon: "🔌" },
];

interface DrawingFile {
  id: number;
  name: string;
  fileSize: number;
  storedPath: string;
  category: string;
  createdAt: string;
}

export default function DrawingsPage() {
  const { currentProject, apiUrl } = useProject();
  const [drawings, setDrawings] = useState<DrawingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("土建施工");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<DrawingFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!currentProject) return;
    const params = new URLSearchParams({ projectId: String(currentProject.id), category });
    if (search) params.set("search", search);
    const res = await fetch(`/api/drawings?${params}`);
    const json = await res.json();
    if (json.success) setDrawings(json.data);
    setLoading(false);
  }, [currentProject, category, search]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length || !currentProject) return;
    const fd = new FormData();
    fd.append("projectId", String(currentProject.id));
    fd.append("category", category);
    for (let i = 0; i < fileList.length; i++) fd.append("files", fileList[i]);
    await fetch(apiUrl("/api/drawings"), { method: "POST", body: fd });
    load();
  };

  const handleDelete = async (id: number) => {
    const pwd = prompt("输入删除密码");
    if (!pwd) return;
    await fetch(apiUrl("/api/drawings"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: pwd }),
    });
    load();
  };

  const isImage = (n: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">施工图纸</h1>
        <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>+ 上传图纸</Button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} accept="image/*,.pdf" />
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              category === c.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="搜索图纸名称..." />

      {/* 图纸网格 */}
      {loading ? <div className="bg-gray-200 rounded-xl h-48 animate-pulse" /> :
        drawings.length === 0 ? (
          <p className="text-center text-gray-400 py-16">暂无图纸</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {drawings.map((d) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-2 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setPreview(d); setZoom(1); }}>
                {isImage(d.name) ? (
                  <img src={`/api/files/serve-drawing?id=${d.id}`} alt={d.name}
                    className="w-full h-32 object-cover rounded-lg mb-1" />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-1">📄</div>
                )}
                <p className="text-xs text-gray-600 truncate">{d.name}</p>
              </div>
            ))}
          </div>
        )}

      {/* 预览模态框 */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-hidden touch-none"
          onClick={(e) => { if (e.target === e.currentTarget) { setPreview(null); setZoom(1); } }}>
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            {isImage(preview.name) ? (
              <img src={`/api/files/serve-drawing?id=${preview.id}`} alt={preview.name}
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s" }}
                className="max-w-full max-h-[90vh] object-contain cursor-zoom-in"
                onClick={() => setZoom(z => z >= 3 ? 1 : z + 0.5)} />
            ) : (
              <a href={`/api/files/serve-drawing?id=${preview.id}`} target="_blank"
                className="text-white text-xl underline">在新窗口查看</a>
            )}
            <button onClick={() => { setPreview(null); setZoom(1); }}
              className="absolute top-2 right-2 text-white text-2xl bg-black/50 w-8 h-8 rounded-full">✕</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1 rounded-full">
              点击图片缩放 ({zoom}x) | 删除需管理员密码
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
