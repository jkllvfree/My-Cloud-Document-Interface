import React, { useState } from 'react';
import { X, Loader2, FileText, CheckCircle2, FilePlus, Calendar, Users } from 'lucide-react';
import { folderService } from '@/api/folder';
import { DOC_TEMPLATES } from '@/constants/templates'; // 确保这个路径正确

// 图标映射放在组件内部或单独的文件
const IconMap = { FilePlus, Calendar, Users };

export default function CreateDocModal({ isOpen, onClose, parentId, parentName,  onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return alert("名称不能为空");
    setLoading(true);

    const template = DOC_TEMPLATES.find(t => t.id === selectedTemplateId);
    const content = template ? template.content : "";

    try {
      const res = await folderService.createDocument({
        name: name, 
        folderId: parentId, 
        content: content});
      if (res.code === 200) {
        setName('');
        setSelectedTemplateId('blank');
        onSuccess();
        onClose();
      } else {
        alert(res.msg || "创建失败");
      }
    } catch (err) {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">新建文档</h3>
            <span className="text-xs text-gray-500">位置: {parentName}</span>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧：模板列表 */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-3 overflow-y-auto space-y-2">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">选择模板</div>
            {DOC_TEMPLATES.map(template => {
              const Icon = IconMap[template.icon] || FileText;
              const isSelected = selectedTemplateId === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`cursor-pointer p-3 rounded-lg flex flex-col gap-2 border transition-all ${
                    isSelected ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500" : "bg-white border-transparent hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-1.5 rounded-md ${isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                      <Icon size={18} />
                    </div>
                    {isSelected && <CheckCircle2 size={16} className="text-blue-500" />}
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}>{template.name}</div>
                </div>
              );
            })}
          </div>

          {/* 右侧：表单 */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">文档名称</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="请输入文档标题"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">模板说明</label>
              <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 h-32 text-sm text-gray-600">
                {DOC_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">取消</button>
              <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
                {loading && <Loader2 size={16} className="animate-spin" />} 立即创建
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}