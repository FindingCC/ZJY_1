"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface DropZoneProps {
  onFiles: (files: FileList) => void;
  loading?: boolean;
}

export function DropZone({ onFiles, loading }: DropZoneProps) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);

      // 优先处理 DataTransferItemList（可获取文件夹中的文件）
      const items = e.dataTransfer.items;
      if (items) {
        const fileEntries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) fileEntries.push(entry);
        }
        if (fileEntries.length > 0) {
          collectFiles(fileEntries).then((files) => {
            if (files.length > 0) {
              // 构造 FileList-like 对象
              const dt = new DataTransfer();
              files.forEach((f) => dt.items.add(f));
              onFiles(dt.files);
            }
          });
          return;
        }
      }

      // 回退：使用 files 属性
      if (e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    },
    [onFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragover(true);
  };

  const handleDragLeave = () => setDragover(false);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-colors cursor-pointer ${
        dragover
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.dwg,.zip,.rar"
      />

      {loading ? (
        <div className="space-y-2">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-gray-500">正在导入并分类文件...</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-4xl">📁</p>
          <p className="text-gray-600 font-medium">拖放文件或文件夹到此处</p>
          <p className="text-sm text-gray-400">支持图片、PDF、Office文档、CAD图纸</p>
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          >
            选择文件
          </Button>
        </div>
      )}
    </div>
  );
}

/** 递归从 FileSystemEntry 树中收集所有文件 */
async function collectFiles(entries: FileSystemEntry[]): Promise<File[]> {
  const files: File[] = [];
  for (const entry of entries) {
    if (entry.isFile) {
      const file = await getFile(entry as FileSystemFileEntry);
      if (file) files.push(file);
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const subEntries = await readAllEntries(dirReader);
      const subFiles = await collectFiles(subEntries);
      files.push(...subFiles);
    }
  }
  return files;
}

function getFile(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file((file) => resolve(file), () => resolve(null));
  });
}

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const read = () => {
      reader.readEntries((entries) => {
        if (entries.length === 0) {
          resolve(all);
        } else {
          all.push(...entries);
          read();
        }
      });
    };
    read();
  });
}
