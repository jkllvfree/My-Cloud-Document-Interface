import React from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, 
  Heading1, Heading2, 
  Link as LinkIcon, Image as ImageIcon, 
  Save, Undo, Redo 
} from 'lucide-react';
import { ToolbarButton } from '@/features/editor/components/ToolbarButton';

export default function EditorToolbar({ editor, onImageClick, onSave, isSaving }) {
  if (!editor) return null;

  // 链接设置逻辑可以保留在 Toolbar 里，或者传进来
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    let url = window.prompt('请输入链接地址', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
      {/* 撤销/重做 */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="撤销">
        <Undo size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="重做">
        <Redo size={18} />
      </ToolbarButton>
      
      <div className="w-px h-5 bg-gray-300 mx-1"></div>

      {/* 基础格式 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="加粗">
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="斜体">
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="下划线">
        <UnderlineIcon size={18} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1"></div>

      {/* 标题 */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="大标题">
        <Heading1 size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="小标题">
        <Heading2 size={18} />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1"></div>

      {/* 插入对象 */}
      <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="插入链接">
        <LinkIcon size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={onImageClick} title="插入图片">
        <ImageIcon size={18} />
      </ToolbarButton>

      {/* 保存按钮 */}
      <button 
        onClick={onSave}
        disabled={isSaving}
        className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
      >
        <Save size={16} />
        {isSaving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}