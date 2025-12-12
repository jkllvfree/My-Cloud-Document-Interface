import React, { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { EDITOR_EXTENSIONS } from '@/features/editor/extensions'; // 引入配置
import EditorToolbar from '@/features/editor/components/EditorToolbar';      // 引入工具栏
import { fileService } from '@/api/file';                       // 引入 API

export default function TipTapEditor({ docId, initialContent, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef(null);

  // 初始化编辑器
  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none text-base leading-7 prose-headings:font-bold prose-headings:tracking-tight prose-p:my-2 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline focus:outline-none min-h-[500px] p-8',
      },
      handleDOMEvents: {
        click: (view, event) => {
          // 1. 检查是否按下了 Ctrl 键 (Windows) 或 Meta 键 (Mac 的 Command)
          const isModifierPressed = event.ctrlKey || event.metaKey;

          if (isModifierPressed) {
            const link = event.target.closest('a');

            if (link && link.href) {
              // 3. 手动在新标签页打开
              window.open(link.href, '_blank');
              return true; // 阻止编辑器的默认行为
            }
          }
          return false; // 其他情况交给编辑器默认处理
        },
      },
    },
  });

  // 监听 docId 变化，重置内容
  useEffect(() => {
    if (!editor || initialContent === undefined) return;
    
    // 延迟执行以避免渲染冲突
    setTimeout(() => {
      try {
        const currentContent = JSON.stringify(editor.getJSON());
        if (currentContent !== initialContent) {
          // 尝试解析 JSON，如果失败则作为纯文本处理
          try {
            const content = JSON.parse(initialContent);
            editor.commands.setContent(content);
          } catch {
            editor.commands.setContent(initialContent);
          }
        }
      } catch (e) {
        console.warn("Content sync error", e);
      }
    }, 0);
  }, [docId, initialContent, editor]);

  // 处理图片上传
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await fileService.uploadImage(file);
      if (result.code === 200) {
        editor.chain().focus().setImage({ src: result.data }).run();
      } else {
        alert("图片上传失败: " + result.msg);
      }
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      event.target.value = ''; // 清空 input
    }
  };

  // 处理保存
  const handleSaveDoc = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const json = editor.getJSON();
      await onSave(JSON.stringify(json));
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* 隐藏的文件输入框 */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*"
      />

      {/* 独立的工具栏组件 */}
      <EditorToolbar 
        editor={editor} 
        onImageClick={() => imageInputRef.current?.click()}
        onSave={handleSaveDoc}
        isSaving={isSaving}
      />

      {/* 编辑区域 */}
      <div 
        className="flex-1 overflow-y-auto cursor-text bg-white" 
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}