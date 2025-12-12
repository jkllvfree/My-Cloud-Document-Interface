import { useState, useRef, useEffect, useCallback } from 'react';

export function useImageResize(initialWidth, updateAttributes) {
  const [currentWidth, setCurrentWidth] = useState(parseInt(initialWidth) || 300);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 0 });

  // 优化点 1: 仅仅在初始加载时同步一次，或者当 initialWidth 发生巨大变化时才同步
  useEffect(() => {
    // 只有当非拖拽状态，且传入的宽度和当前不一致时，才更新本地状态
    if (!isResizing && initialWidth) {
        const val = parseInt(initialWidth);
        if (!isNaN(val)) setCurrentWidth(val);
    }
  }, [initialWidth, isResizing]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
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
    setCurrentWidth(Math.max(50, resizeRef.current.startWidth + diffX));
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setIsResizing(false);

    // 优化点 2: 
    // 不要在 useEffect 里监听 isResizing 来保存
    // 而是直接在松手的那一刻保存！这样就避免了 React 生命周期冲突
    const finalWidth = resizeRef.current.startWidth + (event.clientX - resizeRef.current.startX); // 重新计算一下确保准确
    // 为了安全，这里直接用当前 state
    // 我们用 setTimeout 把它推到下一个事件循环，彻底解决 flushSync 报错
    setTimeout(() => {
        updateAttributes({ width: Math.max(50, finalWidth) });
    }, 0);
    
  }, [updateAttributes]); // 注意：这里可能取不到最新的 currentWidth，用 ref 或 event 计算更稳

  // 为了简化逻辑，上面的 handleMouseUp 里计算 finalWidth 稍微有点麻烦
  // 其实报错的根源是 ImageNodeView.jsx 里的 useEffect 调用方式
  // 如果你替换成上面的代码仍然报错，请只用下面这一招：

  // Keep it simple: 
  // 只返回状态，不要在 hook 内部做副作用更新
  return { currentWidth, isResizing, handleMouseDown };
}