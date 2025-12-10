import React from 'react';
import { FileText } from 'lucide-react';
import TipTapEditor from '@/components/TipTapEditor';

export default function EditorArea({ selectedDoc, docContent, docLoading, onSaveDoc }) {
  if (!selectedDoc) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <FileText size={40} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">没有打开的文档</h3>
        <p className="text-sm mt-2">从左侧选择一个文件开始编辑</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
      <div className="h-full p-4 md:p-8 overflow-hidden">
        {docLoading ? (
          <div className="text-center mt-20 text-gray-400">正在读取文档...</div>
        ) : (
          <TipTapEditor
            docId={selectedDoc.id}
            initialContent={docContent}
            onSave={onSaveDoc}
          />
        )}
      </div>
    </div>
  );
}