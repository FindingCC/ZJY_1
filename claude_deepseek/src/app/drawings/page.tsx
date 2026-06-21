"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProject } from "@/lib/ProjectContext";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { key: "土建施工", label: "土建施工", color: "#f59e0b" },
  { key: "电气一次", label: "电气一次", color: "#8b5cf6" },
  { key: "电气二次", label: "电气二次", color: "#06b6d4" },
];

interface DrawingFile {
  id: number; name: string; fileSize: number; storedPath: string;
  category: string; subCategory: string; createdAt: string;
}

function SvgIcon({ d, size = 20, className = "" }: { d: string; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>;
}
const I = {
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
  folder: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  chevron: "M15 18l-6-6 6-6",
  image: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  plus: "M12 5v14 M5 12h14",
  close: "M18 6L6 18 M6 6l12 12",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  zoom: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35",
};

function fmtDate(s: string) { const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
function fmtSize(b: number) { if (b < 1024) return `${b}B`; if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)}K`; return `${(b / (1024 * 1024)).toFixed(1)}M`; }

export default function DrawingsPage() {
  const { currentProject, apiUrl } = useProject();
  const [drawings, setDrawings] = useState<DrawingFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("土建施工");
  const [subCategory, setSubCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [preview, setPreview] = useState<DrawingFile | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const pinRef = useRef({ dist: 0, zoom: 1, x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNewSub, setShowNewSub] = useState("");
  const [newSubName, setNewSubName] = useState("");

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

  // Sub-categories with counts for the selected category
  const subs = [...new Set(drawings.filter((d) => d.subCategory).map((d) => d.subCategory))].sort();
  const subsWithCount = subs.map((s) => ({ name: s, count: drawings.filter((d) => d.subCategory === s).length }));

  // Filtered drawings for current sub-folder, or all when search is active
  const filtered = subCategory ? drawings.filter((d) => d.subCategory === subCategory) : drawings;

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

  const handleCreateSub = async () => {
    if (!newSubName.trim()) return;
    setSubCategory(newSubName.trim());
    setNewSubName("");
    setShowNewSub("");
  };

  const handleDelete = async (id: number) => {
    const pwd = prompt("输入删除密码");
    if (!pwd) return;
    await fetch(apiUrl("/api/drawings"), {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: pwd }),
    });
    load();
  };

  const isImg = (n: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(n);
  const isPdf = (n: string) => /\.pdf$/i.test(n);

  // Pointer events
  const loadPreview = (d: DrawingFile) => { setPreview(d); setZoom(1); setPan({ x: 0, y: 0 }); };
  const closePreview = () => { setPreview(null); setZoom(1); setPan({ x: 0, y: 0 }); };
  const onPtrDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" || e.pointerType === "touch") { setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }); }
  };
  const onPtrMove = (e: React.PointerEvent) => {
    if (!isDragging || isPinching) return;
    setPan({ x: dragStart.px + e.clientX - dragStart.x, y: dragStart.py + e.clientY - dragStart.y });
  };
  const onPtrUp = () => setIsDragging(false);
  const onTS = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); pinRef.current = { dist: d, zoom, x: pan.x, y: pan.y }; setIsPinching(true); setIsDragging(false); }
  };
  const onTM = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) { const r = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) / pinRef.current.dist; let z = Math.round(pinRef.current.zoom * r * 10) / 10; z = Math.max(1, Math.min(5, z)); setZoom(z); }
  };
  const onTE = () => setIsPinching(false);
  const onWh = (e: React.WheelEvent) => { e.preventDefault(); let z = Math.round((zoom + (e.deltaY > 0 ? -0.2 : 0.2)) * 10) / 10; z = Math.max(1, Math.min(5, z)); setZoom(z); };

  // Main rendering: either folder view or file list view
  const isSearching = !!search;
  const showSubFolders = !isSearching && !subCategory;
  const showFiles = isSearching || !!subCategory;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">施工图纸</h1>
          {subCategory && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <SvgIcon d={I.chevron} size={14} className="text-gray-400" />
              <button onClick={() => setSubCategory("")} className="hover:text-blue-600">{category}</button>
              <SvgIcon d={I.chevron} size={14} className="text-gray-400" />
              <span className="font-medium text-gray-700">{subCategory}</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => {
          if (showNewSub) { setNewSubName(""); setShowNewSub(""); return; }
          setNewSubName(""); setShowNewSub(category);
        }}>
          <SvgIcon d={I.plus} size={16} /><span className="ml-1">{showNewSub === category ? "取消" : "新建文件夹"}</span>
        </Button>
      </div>

      {/* New folder form */}
      {showNewSub === category && (
        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-500">在 {category} 下新建文件夹：</span>
          <input type="text" value={newSubName} onChange={(e) => setNewSubName(e.target.value)}
            className="border border-blue-200 rounded px-2 py-1 text-xs flex-1 outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="如：电容器、隔离开关..." autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateSub(); if (e.key === "Escape") { setShowNewSub(""); setNewSubName(""); } }} />
          <Button variant="ghost" size="sm" onClick={handleCreateSub}>确定</Button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => { setCategory(c.key); setSubCategory(""); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
            style={{ backgroundColor: category === c.key ? c.color : "transparent", color: category === c.key ? "#fff" : "#6b7280", border: category === c.key ? "none" : "1px solid #d1d5db" }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: category === c.key ? "#fff" : c.color, display: "inline-block" }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }} className="flex items-center gap-1.5">
        <SvgIcon d={I.search} size={16} className="text-gray-400 flex-shrink-0" />
        <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="搜索图纸名称..."
        />
      </form>
      {search && <p className="text-xs text-gray-400">全局搜索 "{search}" — {filtered.length} 个结果</p>}

      {/* Folder view */}
      {showSubFolders && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {subsWithCount.map((s) => (
            <button key={s.name} onClick={() => setSubCategory(s.name)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
              <SvgIcon d={I.folder} size={40} className="text-yellow-500 group-hover:text-yellow-600" />
              <span className="text-sm font-medium text-gray-700 text-center truncate w-full">{s.name}</span>
              <span className="text-xs text-gray-400">{s.count} 个文件</span>
            </button>
          ))}
          {subs.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📁</p>
              <p className="text-sm">暂无文件夹，点击上方「新建文件夹」开始</p>
            </div>
          )}
        </div>
      )}

      {/* File list */}
      {showFiles && (
        <>
          {/* Upload button at top */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              <SvgIcon d={I.plus} size={14} /><span>上传到{subCategory || category}</span>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                onChange={(e) => handleUpload(e.target.files)} accept="image/*,.pdf,.dwg,.dwf" />
            </label>
            {subCategory && !isSearching && <span className="text-xs text-gray-400">{filtered.length} 个文件</span>}
          </div>

          {loading ? <div className="bg-gray-200 rounded-xl h-48 animate-pulse" /> :
            filtered.length === 0 ? <p className="text-center text-gray-400 py-16">{search ? "未找到匹配图纸" : "暂无图纸"}</p> :
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((d) => (
                <div key={d.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative cursor-pointer" onClick={() => loadPreview(d)}>
                    {isImg(d.name) ? (
                      <img src={`/api/serve-files?id=${d.id}`} alt={d.name} className="w-full h-36 object-cover" loading="lazy" />
                    ) : isPdf(d.name) ? (
                      <div className="w-full h-36 bg-red-50 flex items-center justify-center"><SvgIcon d={I.doc} size={32} className="text-red-400" /></div>
                    ) : (
                      <div className="w-full h-36 bg-gray-100 flex items-center justify-center"><SvgIcon d={I.image} size={32} className="text-gray-400" /></div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                      className="absolute top-1 right-1 p-1.5 bg-white/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      title="删除（需管理员密码）">
                      <SvgIcon d={I.trash} size={14} />
                    </button>
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-700 truncate font-medium" title={d.name}>{d.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-400">{fmtDate(d.createdAt)}</span>
                      <span className="text-[10px] text-gray-400">{fmtSize(d.fileSize)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onPointerDown={onPtrDown} onPointerMove={onPtrMove} onPointerUp={onPtrUp}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onWheel={onWh}
          onClick={(e) => { if (e.target === e.currentTarget) closePreview(); }}>
          <div className="flex items-center justify-between px-4 py-2 bg-black/80 text-white z-10">
            <span className="text-sm truncate flex-1">{preview.name}</span>
            <div className="flex items-center gap-3 text-xs">
              <span>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(5, zoom + 0.5))} className="p-1 hover:text-blue-400"><SvgIcon d={I.zoom} size={16} /></button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1 hover:text-blue-400">重置</button>
              <button onClick={closePreview} className="p-1 hover:text-red-400"><SvgIcon d={I.close} size={18} /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden" style={{ cursor: zoom > 1 ? "grab" : "default" }}>
            <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: isDragging || isPinching ? "none" : "transform 0.15s ease-out", transformOrigin: "center" }}>
              {isImg(preview.name) ? (
                <img src={`/api/serve-files?id=${preview.id}`} alt={preview.name} className="max-w-[90vw] max-h-[85vh] object-contain select-none" draggable={false} />
              ) : isPdf(preview.name) ? (
                <iframe src={`/api/serve-files?id=${preview.id}`} className="w-[95vw] h-[90vh] rounded" />
              ) : (
                <a href={`/api/serve-files?id=${preview.id}`} target="_blank" className="text-white text-lg underline">下载查看</a>
              )}
            </div>
          </div>
          <div className="px-4 py-2 bg-black/80 text-center text-white/60 text-xs z-10">
            {zoom > 1 ? "拖拽移动 | 滚轮缩放 | 双指捏合" : "滚轮或双指缩放"} | 删除需管理员密码
          </div>
        </div>
      )}
    </div>
  );
}
