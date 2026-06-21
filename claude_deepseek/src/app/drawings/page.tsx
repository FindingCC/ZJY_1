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

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function DrawingsPage() {
  const { currentProject, apiUrl } = useProject();
  const [drawings, setDrawings] = useState<DrawingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("土建施工");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<DrawingFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zooming, setZooming] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchRef = useRef({ dist: 0, zoom: 1 });

  const load = useCallback(async () => {
    if (!currentProject) return;
    setLoadErr(false);
    const params = new URLSearchParams({ projectId: String(currentProject.id), category });
    if (search) params.set("search", search);
    const res = await fetch(apiUrl(`/api/drawings?${params}`));
    const json = await res.json();
    if (json.success) setDrawings(json.data);
    setLoading(false);
  }, [currentProject, category, search, apiUrl]);

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
  const isPdf = (n: string) => /\.pdf$/i.test(n);
  const isCad = (n: string) => /\.dwg$/i.test(n);

  // 触摸缩放
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchRef.current = { dist, zoom };
      setZooming(true);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / touchRef.current.dist;
      let newZoom = touchRef.current.zoom * ratio;
      newZoom = Math.max(1, Math.min(5, Math.round(newZoom * 10) / 10));
      setZoom(newZoom);
    }
  };
  const onTouchEnd = () => { setZooming(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">施工图纸</h1>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <Button variant="ghost" size="sm">+ 上传</Button>
            <input ref={inputRef} type="file" multiple className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              accept="image/*,.pdf,.dwg,.dwf" />
          </label>
        </div>
      </div>

      {/* 分类 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

      {/* 图纸列表 */}
      {loading ? <div className="bg-gray-200 rounded-xl h-48 animate-pulse" /> :
        drawings.length === 0 ? (
          <p className="text-center text-gray-400 py-16">暂无图纸</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {drawings.map((d) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-2 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setPreview(d); setZoom(1); setLoadErr(false); }}>
                {isImage(d.name) ? (
                  <img src={`/api/files/serve-drawing?id=${d.id}`} alt={d.name}
                    className="w-full h-32 object-cover rounded-lg mb-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : isPdf(d.name) ? (
                  <div className="w-full h-32 bg-red-50 rounded-lg flex items-center justify-center text-3xl mb-1">📄</div>
                ) : isCad(d.name) ? (
                  <div className="w-full h-32 bg-blue-50 rounded-lg flex items-center justify-center text-3xl mb-1">📐</div>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-3xl mb-1">📎</div>
                )}
                <p className="text-xs text-gray-700 truncate font-medium">{d.name}</p>
                <p className="text-[10px] text-gray-400">{formatDate(d.createdAt)} · {formatSize(d.fileSize)}</p>
              </div>
            ))}
          </div>
        )}

      {/* 预览 */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden touch-none"
          onClick={(e) => { if (e.target === e.currentTarget) { setPreview(null); setZoom(1); } }}>
          <div className="relative max-w-[100vw] max-h-[100vh] flex items-center justify-center w-full h-full"
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

            {isImage(preview.name) ? (
              <img src={`/api/files/serve-drawing?id=${preview.id}`} alt={preview.name}
                style={{ transform: `scale(${zoom})`, transition: zooming ? "none" : "transform 0.2s" }}
                className="max-w-[95%] max-h-[90%] object-contain"
                onError={() => setLoadErr(true)} />
            ) : isPdf(preview.name) ? (
              <iframe src={`/api/files/serve-drawing?id=${preview.id}`} className="w-[95%] h-[90%] rounded" />
            ) : (
              <a href={`/api/files/serve-drawing?id=${preview.id}`} target="_blank"
                className="text-white text-lg underline">下载查看</a>
            )}

            {loadErr && <p className="text-white text-sm absolute">加载失败</p>}
            <button onClick={() => { setPreview(null); setZoom(1); }}
              className="absolute top-3 right-3 text-white text-2xl bg-black/50 w-9 h-9 rounded-full flex items-center justify-center z-10">✕</button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-xs bg-black/50 px-3 py-1.5 rounded-full whitespace-nowrap">
              双指缩放 {Math.round(zoom * 100)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
