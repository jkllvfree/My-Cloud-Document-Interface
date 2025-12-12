import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from '@/features/editor/nodes/ImageNodeView'; // 注意路径，指向你原有的组件

export const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({
    placeholder: '开始输入文档内容...',
  }),
  Link.configure({
    openOnClick: false, // 编辑模式下点击不直接跳转

    // 🔥 样式核心：在这里强制加上 Tailwind 类名，保证它一定变蓝！
    HTMLAttributes: {
      class: 'text-blue-600 underline cursor-pointer hover:text-blue-800',
      target: '_blank', // 默认在新标签页打开
    },
  }),
  Underline,
  // 图片扩展的高级配置
  Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          renderHTML: attributes => ({ width: attributes.width }),
        },
        textAlign: {
          default: 'left',
          renderHTML: attributes => ({ style: `text-align: ${attributes.textAlign}` }),
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
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
];