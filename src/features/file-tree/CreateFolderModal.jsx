import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { folderService } from '@/api/folder';

export default function CreateFolderModal({ isOpen, onClose, parentId, parentName, currentUser, onSuccess }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return alert("名称不能为空");
    setLoading(true);
    try {
      const res = await folderService.createFolder(name, parentId, currentUser.id);
      if (res.code === 200) {
        setName('');
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-80 p-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800">新建文件夹 <span className="text-xs font-normal text-gray-500">({parentName})</span></h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="文件夹名称"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">取消</button>
          <button onClick={handleSubmit} disabled={loading} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1">
            {loading && <Loader2 size={12} className="animate-spin" />} 创建
          </button>
        </div>
      </div>
    </div>
  );
}