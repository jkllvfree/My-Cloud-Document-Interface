import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { useImageResize } from '@/features/editor/hooks/useImageResize'; // 引入 Hook
import ImageToolbar from '@/features/editor/components/ImageToolbar';     // 引入工具栏

export default function ImageNodeView(props) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, alt, width, textAlign } = node.attrs;

  // 1. 使用 Hook 处理尺寸逻辑
  const { currentWidth, isResizing, handleMouseDown } = useImageResize(width, updateAttributes);

  // 2. 计算容器样式
  let containerClass = 'flex my-4 transition-all duration-200';
  if (textAlign === 'center') containerClass += ' justify-center';
  else if (textAlign === 'right') containerClass += ' justify-end';
  else containerClass += ' justify-start';

  return (
    <NodeViewWrapper className={containerClass}>
      <div 
        className={`relative group inline-block transition-all duration-200 ${
          selected ? 'ring-2 ring-blue-500 rounded z-10' : ''
        }`}
        style={{ width: `${currentWidth}px` }}
      >
        {/* 工具栏：只在选中时显示 */}
        {selected && (
          <ImageToolbar 
            textAlign={textAlign}
            onAlign={(align) => updateAttributes({ textAlign: align })}
            onDelete={deleteNode}
          />
        )}

        {/* 图片本体 */}
        <img
          src={src}
          alt={alt}
          draggable="false"
          className="block w-full h-auto rounded shadow-sm select-none"
        />

        {/* 拖曳手柄：只在选中时显示 */}
        {selected && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize z-20 hover:scale-125 transition-transform shadow-sm"
          />
        )}

        {/* 尺寸提示：只在拖曳时显示 */}
        {isResizing && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none fade-in">
            {Math.round(currentWidth)}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}