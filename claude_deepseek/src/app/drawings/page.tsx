"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProject } from "@/lib/ProjectContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { key: "土建施工", label: "土建施工", color: "#f59e0b" },
  { key: "电气一次", label: "电气一次", color: "#8b5cf6" },
  { key: "电气二次", label: "电气二次", color: "#06b6d4" },
];

interface DrawingFile {
  id: number;
  name: string;
  fileSize: number;
  storedPath: string;
  category: string;
  subCategory: string;
  createdAt: string;
}

function SvgIcon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const Icons = {
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
  image: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  document: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  plus: "M12 5v14 M5 12h14",
  close: "M18 6L6 18 M6 6l12 12",
  zoomIn: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35 M11 11v-3 M11 11v3",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
};

function formatDate(s: string) {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

export default function DrawingsPage() {
  const { currentProject, apiUrl } = useProject();
  const [drawings, setDrawings] = useState<DrawingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("土建施工");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [preview, setPreview] = useState<DrawingFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const pinStartRef = useRef({ dist: 0, zoom: 1, x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const [subCategory, setSubCategory] = useState("");
  const [showSubForm, setShowSubForm] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  const load = useCallback(async () => {
    if (!currentProject) return;
    const params = new URLSearchParams({ projectId: String(currentProject.id), category });
    if (search) params.set("search", search);
    const res = await fetch(apiUrl(`/api/drawings?${params}`));
    const json = await res.json();
    if (json.success) setDrawings(json.data);
    setLoading(false);
  }, [currentProject, category, search, apiUrl]);

  useEffect(() => { load(); }, [load]);

  const subCategories = [...new Set(drawings.map((d) => d.subCategory).filter(Boolean))].sort();

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length || !currentProject) return;
    const fd = new FormData();
    fd.append("projectId", String(currentProject.id));
    fd.append("category", category);
    fd.append("subCategory", subCategory);
    for (let i = 0; i < fileList.length; i++) fd.append("files", fileList[i]);
    await fetch(apiUrl("/api/drawings"), { method: "POST", body: fd });
    load();
  };

  const handleAddSub = async () => {
    if (!newSubName.trim()) return;
    setSubCategory(newSubName.trim());
    setNewSubName("");
    setShowSubForm(false);
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

  // Mouse/touch drag for pan
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || e.pointerType === "touch") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isPinching) return;
    setPan({ x: dragStart.px + e.clientX - dragStart.x, y: dragStart.py + e.clientY - dragStart.y });
  };
  const onPointerUp = () => { setIsDragging(false); };

  // Touch pinch for zoom
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinStartRef.current = { dist, zoom: zoom, x: pan.x, y: pan.y };
      setIsPinching(true);
      setIsDragging(false);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const ratio = dist / pinStartRef.current.dist;
      let newZoom = Math.round(pinStartRef.current.zoom * ratio * 10) / 10;
      newZoom = Math.max(1, Math.min(5, newZoom));
      setZoom(newZoom);
    }
  };
  const onTouchEnd = () => { setIsPinching(false); };

  // Wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    let newZoom = Math.round((zoom + delta) * 10) / 10;
    newZoom = Math.max(1, Math.min(5, newZoom));
    setZoom(newZoom);
  };

  const resetPanZoom = () => { setPan({ x: 0, y: 0 }); setZoom(1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">施工图纸</h1>
        <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
          <SvgIcon d={Icons.upload} size={16} />
          <span className="ml-1">上传</span>
        </Button>
        <input ref={inputRef} type="file" multiple className="hidden"
          onChange={(e) => handleUpload(e.target.files)} accept="image/*,.pdf,.dwg,.dwf" />
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => { setCategory(c.key); setSubCategory(""); }}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: category === c.key ? c.color : "transparent",
              color: category === c.key ? "#fff" : "#6b7280",
              border: category === c.key ? "none" : "1px solid #d1d5db",
            }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: category === c.key ? "#fff" : c.color, display: "inline-block" }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* 子分类 + 搜索 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0">
          <button onClick={() => setSubCategory("")}
            className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${!subCategory ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            全部
          </button>
          {subCategories.map((s) => (
            <button key={s} onClick={() => setSubCategory(s)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${subCategory === s ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
          <button onClick={() => { if (!showSubForm) { setNewSubName(""); setShowSubForm(true); } }}
            className="px-3 py-1 rounded text-xs text-gray-400 border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-500 whitespace-nowrap transition-colors">
            <SvgIcon d={Icons.plus} size={12} /> 新建子分类
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex items-center gap-1">
          <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="w-32 sm:w-40 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜索..." />
          <button type="submit" className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
            <SvgIcon d={Icons.search} size={16} />
          </button>
        </form>
      </div>

      {/* 新建子分类 */}
      {showSubForm && (
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)}
            className="border border-blue-200 rounded px-2 py-1 text-xs flex-1 outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="输入子分类名称" autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleAddSub(); if (e.key === "Escape") setShowSubForm(false); }} />
          <Button variant="ghost" size="sm" onClick={handleAddSub}>确定</Button>
          <Button variant="ghost" size="sm" onClick={() => setShowSubForm(false)}>取消</Button>
        </div>
      )}

      {/* 筛选信息 */}
      {subCategory && (
        <p className="text-xs text-gray-400">
          当前筛选：{category} / {subCategory}（{drawings.filter((d) => d.subCategory === subCategory).length} 个文件）
        </p>
      )}

      {/* 图纸网格 */}
      {loading ? <div className="bg-gray-200 rounded-xl h-48 animate-pulse" /> :
        drawings.filter((d) => !subCategory || d.subCategory === subCategory).length === 0 ? (
          <p className="text-center text-gray-400 py-16">暂无图纸</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {drawings.filter((d) => !subCategory || d.subCategory === subCategory).map((d) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-xl p-2 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => { setPreview(d); resetPanZoom(); }}>
                {isImage(d.name) ? (
                  <img src={`/api/serve-files?id=${d.id}`} alt={d.name}
                    className="w-full h-32 object-cover rounded-lg mb-1" loading="lazy"
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
                ) : isPdf(d.name) ? (
                  <div className="w-full h-32 bg-red-50 rounded-lg flex items-center justify-center mb-1">
                    <SvgIcon d={Icons.document} size={28} />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-1">
                    <SvgIcon d={Icons.image} size={28} />
                  </div>
                )}
                <p className="text-xs text-gray-700 truncate font-medium">{d.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[10px] text-gray-400">{formatDate(d.createdAt)}</span>
                  <span className="text-[10px] text-gray-400">{formatSize(d.fileSize)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* 预览 */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          onWheel={onWheel}
          onClick={(e) => { if (e.target === e.currentTarget) { setPreview(null); resetPanZoom(); } }}>
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/80 text-white z-10">
            <span className="text-sm truncate flex-1">{preview.name}</span>
            <div className="flex items-center gap-3 text-xs">
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => { setZoom(Math.min(5, zoom + 0.5)); }}
                className="p-1 hover:text-blue-400"><SvgIcon d={Icons.zoomIn} size={16} /></button>
              <button onClick={resetPanZoom} className="p-1 hover:text-blue-400">重置</button>
              <button onClick={() => { setPreview(null); resetPanZoom(); }}
                className="p-1 hover:text-red-400"><SvgIcon d={Icons.close} size={18} /></button>
            </div>
          </div>
          {/* 内容区 */}
          <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ cursor: zoom > 1 ? "grab" : "default" }}>
            <div style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging || isPinching ? "none" : "transform 0.15s ease-out",
              transformOrigin: "center",
            }}>
              {isImage(preview.name) ? (
                <img ref={imgRef} src={`/api/serve-files?id=${preview.id}`} alt={preview.name}
                  className="max-w-[90vw] max-h-[85vh] object-contain select-none" draggable={false} />
              ) : isPdf(preview.name) ? (
                <iframe src={`/api/serve-files?id=${preview.id}`} className="w-[95vw] h-[90vh] rounded" />
              ) : (
                <a href={`/api/serve-files?id=${preview.id}`} target="_blank" className="text-white text-lg underline">下载查看</a>
              )}
            </div>
          </div>
          {/* 底部操作 */}
          <div className="px-4 py-2 bg-black/80 flex items-center justify-center gap-3 z-10">
            <span className="text-white/60 text-xs">
              {zoom > 1 ? "拖拽移动 | 滚轮缩放 | 双指捏合" : "滚轮或双指缩放"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
