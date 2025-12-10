import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";

export default function Header({
  currentUser,
  avatarDisplay,
  selectedDoc,
  onRenameDoc, // 重命名回调
  onTitleChange, // 输入框变化回调
  onAvatarUpload, // 上传头像回调
  onOpenSettings, // 打开设置回调
  onLogout,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef(null);
  //是否选中文本框
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef(null);
  const inputRef = useRef(null);

  // 获取头像首字母
  const getAvatarFallback = () => {
    return currentUser?.nickname
      ? currentUser.nickname.charAt(0).toUpperCase()
      : "U";
  };

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  return (
    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
      {/* 左侧：面包屑 / 标题编辑 */}
      <div className="flex items-center text-sm text-gray-500">
        {selectedDoc ? (
          <>
            <span className="hover:text-gray-800 cursor-pointer">我的文档</span>
            <span className="mx-2">/</span>
            {isRenaming ? (
              // 模式 A：编辑模式 (显示输入框)
              <input
                ref={renameInputRef}
                type="text"
                value={selectedDoc.name}
                onChange={(e) => onTitleChange(e.target.value)}
                onBlur={(e) => {
                  onRenameDoc(e.target.value); // 保存
                  setIsRenaming(false);        // 变回文本
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.target.blur();
                }}
                // 样式：白色背景，带阴影，宽度自适应但有最大限制
                className="text-gray-900 font-medium border-none focus:ring-0 focus:outline-none bg-white shadow-sm px-2 rounded w-[200px] md:w-[300px]"
              />
            ) : (
              // 模式 B：浏览模式 (显示文本，超长省略)
              <span
                onClick={() => setIsRenaming(true)} // 点击切换到编辑模式
                // 样式：truncate 实现省略号，max-w 限制最大宽度
                className="text-gray-900 font-medium hover:bg-gray-100 px-2 py-1 rounded cursor-text transition-colors truncate max-w-[75px] md:max-w-[200px] inline-block align-middle select-none"
                title={selectedDoc.name} // 鼠标悬停显示全称
              >
                {selectedDoc.name}
              </span>
            )}
          </>
        ) : (
          <span>欢迎回来，{currentUser?.nickname}</span>
        )}
      </div>

      {/* 右侧：用户菜单 */}
      <div className="relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onAvatarUpload}
          className="hidden"
          accept="image/*"
        />

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        >
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            {currentUser?.nickname || "未命名用户"}
          </span>

          <div
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current.click();
            }}
            className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            title="点击更换头像"
          >
            {avatarDisplay ? (
              <img
                src={avatarDisplay}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold text-sm">
                {getAvatarFallback()}
              </span>
            )}
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-100">
            <div className="px-4 py-3 border-b border-gray-50 mb-1">
              <p className="text-sm font-bold text-gray-800">
                {currentUser?.nickname}
              </p>
            </div>

            <button
              onClick={() => {
                onOpenSettings("view");
                setShowUserMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <User size={16} /> 个人资料
            </button>

            <button
              onClick={() => {
                onOpenSettings("edit");
                setShowUserMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Settings size={16} /> 账号信息修改
            </button>

            <div className="h-px bg-gray-100 my-1"></div>
            <button
              onClick={onLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut size={16} /> 退出登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
