"use client";

interface FilePreviewModalProps {
  fileId: number;
  fileName: string;
  onClose: () => void;
  onDelete?: (fileId: number) => void;
}

export function FilePreviewModal({ fileId, fileName, onClose, onDelete }: FilePreviewModalProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
  const isPdf = /\.pdf$/i.test(fileName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1 mr-4">{fileName}</h3>
          <div className="flex items-center gap-2">
            <a
              href={`/api/files/serve?id=${fileId}`}
              download={fileName}
              className="text-xs text-blue-600 hover:underline"
            >
              下载
            </a>
            <a
              href={`/api/files/serve?id=${fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              新窗口打开
            </a>
            {onDelete && (
              <button
                onClick={() => onDelete(fileId)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline ml-1"
              >
                删除
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-1">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-b-xl min-h-[300px]">
          {isImage ? (
            <img
              src={`/api/files/serve?id=${fileId}`}
              alt={fileName}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow"
            />
          ) : isPdf ? (
            <iframe
              src={`/api/files/serve?id=${fileId}`}
              className="w-full h-[75vh] rounded-lg"
              title={fileName}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">📎</p>
              <p className="text-gray-500 mb-4">此文件类型暂不支持在线预览</p>
              <a
                href={`/api/files/serve?id=${fileId}`}
                download={fileName}
                className="text-blue-600 hover:underline text-sm"
              >
                点击下载
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
