"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

interface Template {
  id: number;
  name: string;
  category: string;
  defaultDays: number;
  description: string | null;
}

interface NodeFormProps {
  initial?: {
    id?: number;
    name: string;
    description: string;
    order: number;
    startDate: string;
    endDate: string;
    templateId?: number | null;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export function NodeForm({ initial, onSubmit, onCancel }: NodeFormProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [startDate, setStartDate] = useState(initial?.startDate || "");
  const [endDate, setEndDate] = useState(initial?.endDate || "");
  const [templateId, setTemplateId] = useState(initial?.templateId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 加载模板列表
    fetch("/api/templates")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTemplates(res.data);
      })
      .catch(() => {});
  }, []);

  // 选择模板时自动填充名称和描述
  const handleTemplateChange = (tplId: string) => {
    setTemplateId(tplId);
    if (tplId) {
      const tpl = templates.find((t) => t.id === parseInt(tplId));
      if (tpl) {
        setName(tpl.name);
        setDescription(tpl.description || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("节点名称不能为空");
      return;
    }

    setLoading(true);
    setError("");

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      startDate: startDate || null,
      endDate: endDate || null,
      templateId: templateId ? parseInt(templateId as string) : null,
    };

    const url = initial?.id
      ? `/api/nodes/${initial.id}`
      : "/api/nodes";

    const res = await apiFetch(url, {
      method: initial?.id ? "PUT" : "POST",
      body: JSON.stringify(body),
    });

    if (res.success) {
      onSubmit();
    } else {
      setError(res.error || "操作失败");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* 模板选择（仅新建时显示） */}
      {!initial?.id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            从模板创建（可选）
          </label>
          <select
            value={templateId as string}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">自定义节点</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.category}] {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          节点名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="输入节点名称"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          placeholder="节点描述（可选）"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" loading={loading}>
          {initial?.id ? "保存修改" : "创建节点"}
        </Button>
      </div>
    </form>
  );
}
