import { useState, useRef, useEffect, useCallback } from 'react';

export function useImageResize(initialWidth, updateAttributes) {
  const [currentWidth, setCurrentWidth] = useState(parseInt(initialWidth) || 300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });

  // 同步外部属性变化 (Undo/Redo 时)
  useEffect(() => {
    setCurrentWidth(parseInt(initialWidth) || 300);
  }, [initialWidth]);

  // 结束拖曳时保存
  useEffect(() => {
    // 只有当停止拖曳且宽度确实改变时才更新 Tiptap 属性
    if (!isResizing && parseInt(initialWidth) !== currentWidth) {
      updateAttributes({ width: currentWidth });
    }
  }, [isResizing, currentWidth, initialWidth, updateAttributes]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止 Tiptap 获取焦点
    setIsResizing(true);
    
    resizeRef.current = {
      startX: e.clientX,
      startWidth: currentWidth,
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!resizeRef.current) return;
    const diffX = e.clientX - resizeRef.current.startX;
    // 限制最小 50px
    setCurrentWidth(Math.max(50, resizeRef.current.startWidth + diffX));
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setIsResizing(false);
  }, [handleMouseMove]);

  return {
    currentWidth,
    isResizing,
    handleMouseDown
  };
}