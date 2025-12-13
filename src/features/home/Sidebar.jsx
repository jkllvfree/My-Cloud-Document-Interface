import React, { useState } from 'react';
import { FileText, Plus, Folder, User, Users } from 'lucide-react';
import FileTree from '@/components/FileTree'; // 注意调整引用路径



export default function Sidebar({ fileTreeRef, onSelectDoc, currentUser, personalData, sharedData, onRefresh }) {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

 return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Logo 区域 */}
      <div className="h-14 flex items-center px-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
          <FileText className="text-white" size={18} />
        </div>
        <span className="font-bold text-gray-700 text-lg">Cloud Docs</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
        
        {/* === 上半部分：我的空间 === */}
        <div>
          {/* 新建按钮 (只控制我的空间) */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
            >
              <Plus size={16} />
              新建文档 / 文件夹
            </button>

            {showCreateMenu && (
              <>
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg z-50 overflow-hidden animate-in fade-in zoom-in duration-100">
                  <button
                    onClick={() => {
                      // 这里的 fileTreeRef 指向的是"我的文件"这棵树
                      fileTreeRef.current?.triggerRootCreate('document');
                      setShowCreateMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-blue-500" /> 新建文档
                  </button>
                  <button
                    onClick={() => {
                      fileTreeRef.current?.triggerRootCreate('folder');
                      setShowCreateMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Folder size={14} className="text-yellow-500" /> 新建文件夹
                  </button>
                </div>
                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)} />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            <User size={12} /> 我的文件
          </div>

          {/* 我的文件树 (Ref 绑在这里) */}
          <FileTree
            ref={fileTreeRef} // Ref 给这个，因为新建按钮只操作这个
            treeData={personalData} // ✅ 传入数据
            allowCreate={true}      // ✅ 允许创建
            onRefresh={onRefresh}   // ✅ 传入刷新回调
            onSelectDoc={onSelectDoc}
            currentUser={currentUser}
          />
        </div>

        {/* 分割线 */}
        <div className="border-t border-gray-200 mx-2"></div>

        {/* === 下半部分：与我共享 === */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            <Users size={12} /> 与我共享
          </div>

          {/* 共享文件树 (没有 Ref，因为不能在根目录新建) */}
          <FileTree
            treeData={sharedData}   // ✅ 传入共享数据
            allowCreate={false}     // ✅ 禁止创建
            onRefresh={onRefresh}
            onSelectDoc={onSelectDoc}
            currentUser={currentUser}
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center bg-gray-50 flex-shrink-0">
        已使用 12MB / 1GB
      </div>
    </div>
  );
}