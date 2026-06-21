"use client";

import { useState } from "react";

interface ChecklistItemData {
  id: number;
  content: string;
  isCompleted: boolean;
  order: number;
}

interface ChecklistItemProps {
  item: ChecklistItemData;
  onToggle: (id: number, isCompleted: boolean) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
}

export function ChecklistItemView({ item, onToggle, onEdit, onDelete }: ChecklistItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(item.id, editContent.trim());
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
        <input
          type="text"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          autoFocus
        />
        <button onClick={handleSave} className="text-sm text-blue-600 hover:text-blue-800">保存</button>
        <button onClick={() => setEditing(false)} className="text-sm text-gray-400 hover:text-gray-600">取消</button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${item.isCompleted ? "opacity-60" : ""}`}>
      <input
        type="checkbox"
        checked={item.isCompleted}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      <span className={`flex-1 text-sm ${item.isCompleted ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-200"}`}>
        {item.content}
      </span>
      {/* 移动端始终显示，桌面端 hover 显示 */}
      <div className="flex md:opacity-0 md:group-hover:opacity-100 gap-1 transition-opacity">
        <button
          onClick={() => { setEditContent(item.content); setEditing(true); }}
          className="min-w-[36px] min-h-[36px] text-xs text-gray-400 hover:text-blue-600 px-1"
        >
          编辑
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="min-w-[36px] min-h-[36px] text-xs text-gray-400 hover:text-red-600 px-1"
        >
          删除
        </button>
      </div>
    </div>
  );
}
