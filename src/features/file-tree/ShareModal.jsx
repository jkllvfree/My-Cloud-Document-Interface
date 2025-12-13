// src/features/file-tree/ShareModal.jsx
import React, { useState, useEffect, useCallback } from "react";
import { X, Search, User, Trash2, Check, Shield, Eye } from "lucide-react";
import { permissionService } from "@/api/permission";
import { userService } from "@/api/user";

export default function ShareModal({
  isOpen,
  onClose,
  docId,
  docName,
  currentUser,
}) {
  const [activeTab, setActiveTab] = useState("add"); // 'add' | 'list'
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // === 搜索相关状态 ===
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPermission, setSelectedPermission] = useState("viewer"); // 默认只读

  // === 1. 加载现有成员 ===
  const fetchMembers = useCallback(async () => {
    if (!docId) return;
    setLoadingMembers(true);
    try {
      const res = await permissionService.getMembers(docId);
      if (res.code === 200) {
        // setMembers(res.data || []);
        const realList = res.data.members || [];
        setMembers(realList);
        console.log("后端返回的成员数据:", res.data);
      }
    } catch (error) {
      console.error(error);
      setMembers([]); // 出错也重置为空数组
    } finally {
      setLoadingMembers(false);
    }
  }, [docId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, fetchMembers]);

  // === 2. 处理搜索 (简单的防抖逻辑) ===
  useEffect(() => {
    const timer = setTimeout(async () => {
      //搜索框为空时，清空列表
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const res = await userService.searchUsers(searchQuery);
        if (res.code === 200) {
          const userList = res.data || [];
          // 3. 过滤掉自己
          // 假设 currentUser.id 是当前登录用户 ID
          const filteredList = userList.filter((u) => u.id !== currentUser?.id);
          setSearchResults(filteredList);
        }
      } catch (e) {
        console.error("搜索请求失败:", e);
        setSearchResults([]); // 出错置空
      }
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [searchQuery, currentUser]);

  // === 3. 添加成员 ===
  const handleAdd = async (user) => {
    try {
      const res = await permissionService.addMember({
        documentId: docId,
        userId: user.userId,
        permissionTypeStr: selectedPermission,
      });

      if (res.code === 200) {
        alert(`已邀请 ${user.nickname} 协作`);
        setSearchQuery(""); // 清空搜索
        setSearchResults([]);
        fetchMembers(); // 刷新列表
      } else {
        console.error("添加协作者失败:", e);
        alert(res.msg);
      }
    } catch (e) {
      console.error("没有执行成功，添加协作者失败:", e);
      alert("添加失败");
    }
  };

  // === 4. 移除成员 ===
  const handleRemove = async (userId) => {
    if (!window.confirm("确定要移除该协作者吗？")) return;
    try {
      const res = await permissionService.removeMember({ docId, userId });
      if (res.code === 200) fetchMembers();
    } catch (e) {
      alert("移除失败");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col max-h-[85vh]">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">协作管理</h3>
            <p className="text-xs text-gray-500 truncate max-w-[300px]">
              文档：{docName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 搜索添加区域 */}
        <div className="p-6 border-b border-gray-100">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            邀请新成员
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="搜索用户ID或昵称..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500"
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
            >
              <option value="viewer">只读</option>
              <option value="editor">可编辑</option>
            </select>
          </div>

          {/* 搜索结果下拉 */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-100 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
              {searchResults.map((user) => {
                // 检查是否已经在成员列表中
                const isMember = members.some((m) => m.userId === user.userId);
                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          user.nickname[0]
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {user.nickname}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {user.userId}
                        </div>
                      </div>
                    </div>
                    {isMember ? (
                      <span className="text-xs text-gray-400 px-2">已加入</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(user)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                      >
                        添加
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 成员列表区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            现有成员 ({members.length})
          </label>

          {loadingMembers ? (
            <div className="text-center py-4 text-gray-400 text-xs">
              加载中...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">
              暂无其他协作者
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                      {/* 这里假设 member 对象里包含了 userInfo，或者后端直接返回了 avatarUrl */}
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {member.nickname || "用户 " + member.userId}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {/* 权限标签 */}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            member.permissionType === "editor"
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {member.permissionType === "editor" ? (
                            <Shield size={10} />
                          ) : (
                            <Eye size={10} />
                          )}
                          {member.permissionType === "editor"
                            ? "编辑者"
                            : "阅读者"}
                        </span>
                        {/* 如果是 Owner */}
                        {member.permissionType === "owner" && (
                          <span className="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-100">
                            所有者
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 只有 Owner 可以移除别人，且不能移除自己 */}
                  {/* 这里简单判断：只要不是 owner 类型的记录就可以被移除 (实际逻辑应该还要判断 currentUser 是否是 owner) */}
                  {member.permissionType !== "owner" && (
                    <button
                      onClick={() => handleRemove(member.userId)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="移除成员"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
