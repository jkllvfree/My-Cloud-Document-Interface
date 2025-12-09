import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'; // 引入 ReactNodeViewRenderer
import ImageNodeView from './ImageNodeView'; // 引入刚才写的组件
import StarterKit from '@tiptap/starter-kit';
// 引入新插件
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';

import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, 
  Link as LinkIcon, Image as ImageIcon, 
  Save, Undo, Redo 
} from 'lucide-react';

const EXTENSIONS = [
  StarterKit,
  Underline,
  Link.configure({
    openOnClick: false,
    autolink: true,
  }),
  Placeholder.configure({
    placeholder: '开始输入文档内容...',
  }),
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          renderHTML: attributes => ({
            width: attributes.width,
          }),
        },
        textAlign: {
          default: 'left',
          renderHTML: attributes => ({
            style: `text-align: ${attributes.textAlign}`,
          }),
        },
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer(ImageNodeView);
    },
  }).configure({
    inline: true,
    allowBase64: true,
  }),
];


// 简单的按钮组件封装
const MenuButton = ({ onClick, isActive, children, title, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
      isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

export default function TipTapEditor({ docId, initialContent, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  
  // 用于点击“插入图片”按钮时，触发隐藏的文件选择框
  const imageInputRef = useRef(null);

  // 初始化编辑器
  const editor = useEditor({
    // 解决 Duplicate extension 警告：确保这里每个插件只出现一次
    extensions: EXTENSIONS,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none text-base leading-7 prose-headings:font-bold prose-headings:tracking-tight prose-p:my-2 prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline focus:outline-none min-h-[500px] p-8',
      },
    },
  });
  // 监听 docId 变化，重置内容
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      // 使用 setTimeout(..., 0) 将更新推迟到渲染周期之后
      setTimeout(() => {
        try {
          // 只有当内容真正不同的时候才更新，防止光标跳动（可选优化）
          const currentContent = JSON.stringify(editor.getJSON());
          if (currentContent !== initialContent) {
             const content = JSON.parse(initialContent);
             editor.commands.setContent(content);
          }
        } catch (e) {
          // 如果解析失败，可能是纯文本
          if (editor.getText() !== initialContent) {
            editor.commands.setContent(initialContent);
          }
        }
      }, 0);
    }
  }, [docId, initialContent, editor]);



  // === 功能逻辑 ===

  // 1. 插入链接
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    let url = window.prompt('请输入链接地址', previousUrl);

    if (url === null) return; // 取消
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // 自动补全协议
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);


  // 2. 触发图片上传
  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  // 3. 处理图片选择与上传
  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 构造 FormData
    const formData = new FormData();
    formData.append('file', file);

    try {

      const response = await fetch('http://localhost:8080/api/file/upload/image', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.code === 200) {
        const url = result.data; // 获取图片 URL
        // 核心：在编辑器光标处插入图片
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        alert("图片上传失败: " + result.msg);
      }
    } catch (err) {
      console.error(err);
      alert("网络错误");
    } finally {
      // 清空 input，防止选同一张图不触发 onChange
      event.target.value = ''; 
    }
  };

  // 4. 保存文档
  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    const json = editor.getJSON();
    await onSave(JSON.stringify(json));
    setIsSaving(false);
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      
      {/* 隐藏的文件输入框，用于上传图片 */}
      <input 
        type="file" 
        ref={imageInputRef} 
        onChange={handleImageChange} 
        className="hidden" 
        accept="image/*"
      />

      {/* === 工具栏 === */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
        
        {/* 撤销/重做 */}
        <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销">
          <Undo size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做">
          <Redo size={18} />
        </MenuButton>
        
        <div className="w-px h-5 bg-gray-300 mx-1"></div>

        {/* 基础格式 */}
        <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="加粗">
          <Bold size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="斜体">
          <Italic size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="下划线">
          <UnderlineIcon size={18} />
        </MenuButton>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>

        {/* 标题 */}
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="大标题">
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="小标题">
          <Heading2 size={18} />
        </MenuButton>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>

        {/* 插入对象 */}
        <MenuButton onClick={setLink} isActive={editor.isActive('link')} title="插入链接">
          <LinkIcon size={18} />
        </MenuButton>
        
        {/* 图片上传按钮 */}
        <MenuButton onClick={triggerImageUpload} title="插入图片">
          <ImageIcon size={18} />
        </MenuButton>

        {/* 保存按钮 (右侧) */}
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
        >
          <Save size={16} />
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* === 编辑区域 === */}
      <div className="flex-1 overflow-y-auto cursor-text bg-white" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}