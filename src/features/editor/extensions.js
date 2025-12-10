import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from '@/features/editor/nodes/ImageNodeView'; // 注意路径，指向你原有的组件

export const EDITOR_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({
    placeholder: '开始输入文档内容...',
  }),
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