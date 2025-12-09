import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  Folder
} from 'lucide-react';

// 注意：根据你刚才整理的目录结构，这里要往上找一级 (..) 再进 components
import FileTree from '../components/FileTree';
import TipTapEditor from '../components/TipTapEditor';
import SettingsModal from '../components/SettingsModal';

export default function HomePage({ currentUser, onLogout, onUpdateUser }) {
  // ==================== 1. 状态管理 ====================
  
  // UI 状态
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // 文档相关状态
  const [selectedDoc, setSelectedDoc] = useState(null);     // 当前选中的文档对象 (id, title)
  const [docContent, setDocContent] = useState('');         // 当前文档的详细内容 (JSON String)
  const [docLoading, setDocLoading] = useState(false);      // 文档加载状态

  // 头像上传相关状态
  const fileInputRef = useRef(null);
  const [avatarDisplay, setAvatarDisplay] = useState(currentUser?.avatarUrl);
//修改用户信息状态
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('view');

  //  定义一个 ref 来引用 FileTree
  const fileTreeRef = useRef(null);
  
  // 定义新建菜单下拉框的状态
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // 监听 currentUser 变化更新头像显示
  useEffect(() => {
    setAvatarDisplay(currentUser?.avatarUrl);
  }, [currentUser]);


  // ==================== 2. 核心逻辑函数 ====================

  // --- A. 获取文档详情 (当选中左侧文档时触发) ---
  useEffect(() => {
    if (selectedDoc) {
      setDocLoading(true);
      // 请求后端获取详情 (注意：后端接口地址要对)
      fetch(`http://localhost:8080/api/document/detail/${selectedDoc.id}`)
        .then(res => res.json())
        .then(result => {
          if (result.code === 200) {
            // 设置内容，TipTapEditor 会监听到这个变化并更新
            setDocContent(result.data.content);
          }
        })
        .catch(err => console.error("加载文档失败", err))
        .finally(() => setDocLoading(false));
    }
  }, [selectedDoc]); 


  // --- B. 保存文档内容 (这是你刚才报错缺失的函数！) ---
  const handleSaveDoc = async (newContent) => {
    if (!selectedDoc) return;
    try {
      const response = await fetch('http://localhost:8080/api/document/update/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDoc.id,
          newName: null,  // 不改名字
          newContent: newContent
        })
      });
      const result = await response.json();
      if (result.code === 200) {
        console.log("保存成功");
        // 你可以在这里加一个 toast 提示
      } else {
        alert("保存失败: " + result.msg);
      }
    } catch (err) {
      console.error(err);
      alert("保存时网络错误");
    }
  };


  // --- C. 头像上传逻辑 ---
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/file/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.code === 200) {
        const newUrl = result.data;
        setAvatarDisplay(newUrl);
        
        // 同步更新到数据库
        await fetch('http://localhost:8080/api/user/update-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              avatarUrl: newUrl
            })
        });
        console.log("头像更新完成");
      }
    } catch (error) {
      console.error(error);
      alert("头像上传失败");
    }
  };

  // --- D. 辅助函数 ---
  const getAvatarFallback = () => {
    if (!currentUser || !currentUser.nickname) return 'U';
    return currentUser.nickname.charAt(0).toUpperCase();
  };

  const handleUserUpdate = (updatedInfo) => {
     console.log("用户信息已更新，正在同步前端显示...", updatedInfo);
     
     // 关键：这里调用父组件传下来的 onUpdateUser (App.jsx里的逻辑)
     // 如果 App.jsx 里的 onUpdateUser 只是更新 state，那页面就不会刷新，只会变数据
     if (onUpdateUser) {
         onUpdateUser(updatedInfo);
     }
  };

  const handleRenameDoc = async (newName) => {
    if (!selectedDoc || !newName.trim()) return;
    
    // 乐观更新：先在前端改了再说，让界面反应快一点
    const oldName = selectedDoc.name;
    setSelectedDoc(prev => ({ ...prev, name: newName }));

    try {
      // 调用后端重命名接口 (你需要确保后端有这个接口，或者复用 update 接口)
      const response = await fetch('http://localhost:8080/api/document/update/info', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDoc.id,
          newName: newName,
          newContent: null
        })
      });
      const result = await response.json();
      
      if (result.code !== 200) {
        // 失败了改回去
        setSelectedDoc(prev => ({ ...prev, name: oldName }));
        alert("重命名失败: " + result.msg);
      } else {
        console.log("重命名成功，刷新左侧列表...");
        fileTreeRef.current?.refresh(selectedDoc.folderId);
      }
    } catch (err) {
      setSelectedDoc(prev => ({ ...prev, name: oldName }));
      console.error(err);
    }
  };

  // ==================== 3. 页面渲染 (JSX) ====================
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* --- 左侧侧边栏 --- */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <FileText className="text-white" size={18} />
          </div>
          <span className="font-bold text-gray-700 text-lg">Cloud Docs</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          
          <div className="relative mb-4">
             <button 
               onClick={() => setShowCreateMenu(!showCreateMenu)} // 切换下拉菜单
               className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
             >
               <Plus size={16} />
               新建文档 / 文件夹
             </button>

             {/* 简单的下拉菜单 */}
             {showCreateMenu && (
               <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg z-50 animate-in fade-in zoom-in duration-100 overflow-hidden">
                  <button 
                    onClick={() => {
                        // 调用子组件方法在根目录创建
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
             )}
             
             {/* 点击外部关闭遮罩 (简单实现) */}
             {showCreateMenu && (
                <div className="fixed inset-0 z-40" onClick={() => setShowCreateMenu(false)}></div>
             )}
          </div>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            我的文件
          </div>

          {/* 文件树组件：当点击文档时，更新 selectedDoc */}
          <FileTree
            ref={fileTreeRef} 
            onSelectDoc={(doc) => setSelectedDoc(doc)} 
            currentUser={currentUser}
          />
            
        </div>

        <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          已使用 12MB / 1GB
        </div>
      </div>


      {/* --- 右侧主体区域 --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 顶部 Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
          <div className="flex items-center text-sm text-gray-500">
             {selectedDoc ? (
               <>
                <span className="hover:text-gray-800 cursor-pointer">我的文档</span>
                <span className="mx-2">/</span>
                <input 
                  type="text"
                  value={selectedDoc.name} // 绑定 name
                  onChange={(e) => setSelectedDoc({...selectedDoc, name: e.target.value})} // 输入时实时更新本地状态
                  onBlur={(e) => handleRenameDoc(e.target.value)} // ✨ 失去焦点时（点别处时）发送请求保存
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                      e.target.blur(); // 按回车也保存
                    }
                  }}
                  className="text-gray-900 font-medium border-none focus:ring-0 focus:outline-none bg-transparent hover:bg-gray-100 px-2 rounded transition-colors"
                  style={{ width: `${Math.max(selectedDoc.name.length * 14, 100)}px` }} // 简单自适应宽度
                />
               </>
             ) : (
               <span>欢迎回来，{currentUser?.nickname}</span>
             )}
          </div>

          <div className="relative">
            {/* 隐藏的文件上传 input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />

            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                {currentUser?.nickname || '未命名用户'}
              </span>
              
              <div 
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleAvatarClick(); 
                }}
                className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                title="点击更换头像"
              >
                {avatarDisplay ? (
                  <img src={avatarDisplay} alt="avatar" className="w-full h-full object-cover" />
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
                  <p className="text-sm font-bold text-gray-800">{currentUser?.nickname}</p>
                </div>

                {/* 🌟 按钮 1：个人资料 (View Mode) */}
                <button 
                  onClick={() => {
                    setSettingsTab('view'); // 设定为查看模式
                    setShowSettings(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <User size={16} /> 个人资料
                </button>
                
                {/* 🌟 按钮 2：账号信息修改 (Edit Mode) */}
                <button 
                  onClick={() => {
                    setSettingsTab('edit'); // 设定为编辑模式
                    setShowSettings(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings size={16} /> 账号信息修改
                </button>



                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={onLogout} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <LogOut size={16} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- 核心编辑区域 --- */}
        <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
          {selectedDoc ? (
            <div className="h-full p-4 md:p-8 overflow-hidden">
               {docLoading ? (
                  <div className="text-center mt-20 text-gray-400">正在读取文档...</div>
               ) : (
                  // 使用 TipTapEditor，传入 docId 确保切换文档时重置
                  // 传入 handleSaveDoc 函数给子组件调用
                  <TipTapEditor 
                    docId={selectedDoc.id} 
                    initialContent={docContent} 
                    onSave={handleSaveDoc} 
                  />
               )}
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
               <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                 <FileText size={40} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-600">没有打开的文档</h3>
               <p className="text-sm mt-2">从左侧选择一个文件开始编辑</p>
            </div>
          )}
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
        onUpdateUser={handleUserUpdate}
        initialTab={settingsTab}
        onLogout={onLogout}
      />
    </div>
  );
}