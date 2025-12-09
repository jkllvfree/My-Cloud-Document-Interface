import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';

export default function ImageNodeView(props) {
  const { node, updateAttributes, deleteNode, selected } = props;
  const { src, alt, width, textAlign } = node.attrs;

  // 1. 本地状态：为了保证拖曳时 60fps 的丝滑，我们不直接改 TipTap 数据，而是改本地 state
  // 这里的 width 必须是具体的数值（去掉了 px），方便计算
  const [currentWidth, setCurrentWidth] = useState(
    parseInt(width) || 300 // 默认宽度 300
  );
  
  const [isResizing, setIsResizing] = useState(false);
  
  // 使用 Ref 记录拖曳开始时的瞬间状态，防止闭包陷阱
  const resizeRef = useRef({
    startX: 0,
    startWidth: 0,
  });

  // 同步外部数据的变化（比如撤销/重做后）
  useEffect(() => {
    if (width) {
      setCurrentWidth(parseInt(width));
    }
  }, [width]);

  // ==========================
  // 🖱️ 核心：手写拖曳逻辑
  // ==========================
  
  // 1. 鼠标按下 (MouseDown)
  const handleMouseDown = (e) => {
    // 💀 绝对关键：阻止事件冒泡！
    // 告诉 TipTap：“别管我，我现在只属于这个把手”
    e.preventDefault(); 
    e.stopPropagation(); 

    setIsResizing(true);

    // 记录初始位置
    resizeRef.current = {
      startX: e.clientX,
      startWidth: currentWidth, // 基于当前的宽度开始算
    };

    // 💀 关键：把监听器绑在 document 上
    // 这样哪怕你鼠标移出了编辑区，只要不松手，依然能拖动
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 2. 鼠标移动 (MouseMove)
  const handleMouseMove = useCallback((e) => {
    if (!resizeRef.current) return;

    const { startX, startWidth } = resizeRef.current;
    const diffX = e.clientX - startX; // 鼠标水平移动了多少像素

    // 计算新宽度 (最小限制 50px)
    let newWidth = Math.max(50, startWidth + diffX);
    
    // 限制最大宽度 (假设编辑器容器宽度大概是 800px，你可以根据实际情况调整)
    // 或者简单点，不限制上限，依靠 CSS 的 max-w-full
    
    setCurrentWidth(newWidth);
  }, []);

  // 3. 鼠标松开 (MouseUp)
  const handleMouseUp = useCallback(() => {
    // 移除全局监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    setIsResizing(false);

    // 🔥 只有在松手这一刻，才通知 TipTap 保存数据
    // 这样能极大减少卡顿，也不会搞乱历史记录
    // 注意：这里我们需要从 state 里拿最新的 currentWidth
    // 但由于闭包，直接用 updateAttributes 可能会拿到旧值
    // 所以我们在下面的 useEffect 监听 resizing 结束来触发保存，或者直接用 ref 里的值计算
    // 这里为了简单，我们利用 React state 的最新值：
    // 但在 useCallback 里拿不到最新的 state，所以我们换个思路：
    // 直接在 mousemove 里已经更新了 state，这里只负责清理副作用
    // 真正的保存逻辑，放在外面或者这里重新计算一次
  }, []);

  // 补充：由于 useCallback 闭包问题，我们在 useEffect 中监听 resizing 状态结束来保存
  useEffect(() => {
    // 如果刚才在拖曳，现在变成了 false，说明拖曳结束，保存！
    // 且宽度确实发生了变化
    if (!isResizing && parseInt(width) !== currentWidth) {
        updateAttributes({ width: `${currentWidth}px` });
    }
  }, [isResizing, currentWidth, updateAttributes, width]);


  // ==========================
  // 🎨 样式计算
  // ==========================
  
  let containerClass = 'flex my-4 transition-all duration-200';
  if (textAlign === 'center') containerClass += ' justify-center';
  else if (textAlign === 'right') containerClass += ' justify-end';
  else containerClass += ' justify-start';

  return (
    <NodeViewWrapper className={containerClass}>
      
      {/* 图片包裹容器：负责显示蓝框和工具栏 */}
      <div 
        className={`relative group inline-block transition-all duration-200 ${
          selected ? 'ring-2 ring-blue-500 rounded z-10' : ''
        }`}
        style={{ width: `${currentWidth}px` }} // 宽度由外层 div 控制
      >
        
        {/* 悬浮工具栏 (类似 Word，点击图片上方出现) */}
        {selected && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white shadow-xl border border-gray-200 p-1.5 rounded-lg z-50 animate-in fade-in zoom-in duration-200">
             <button 
                onClick={() => updateAttributes({ textAlign: 'left' })} 
                className={`p-1.5 rounded hover:bg-gray-100 ${textAlign === 'left' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
             >
                <AlignLeft size={16} />
             </button>
             <button 
                onClick={() => updateAttributes({ textAlign: 'center' })} 
                className={`p-1.5 rounded hover:bg-gray-100 ${textAlign === 'center' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
             >
                <AlignCenter size={16} />
             </button>
             <button 
                onClick={() => updateAttributes({ textAlign: 'right' })} 
                className={`p-1.5 rounded hover:bg-gray-100 ${textAlign === 'right' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
             >
                <AlignRight size={16} />
             </button>
             
             <div className="w-px h-4 bg-gray-300 mx-1"></div>
             
             <button 
                onClick={deleteNode} 
                className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-600"
                title="删除图片"
             >
                <Trash2 size={16} />
             </button>
          </div>
        )}

        {/* 🖼️ 图片本体 */}
        {/* draggable="false" 非常重要，防止浏览器原生的图片拖曳干扰 */}
        <img
          src={src}
          alt={alt}
          draggable="false"
          className="block w-full h-auto rounded shadow-sm select-none"
        />

        {/* 🔧 拖曳手柄 (右下角) */}
        {/* 只有选中时才显示 */}
        {selected && (
           <div
             onMouseDown={handleMouseDown}
             className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize z-20 hover:scale-125 transition-transform shadow-sm"
           >
             {/* 可以加一个小圆点装饰 */}
           </div>
        )}

        {/* 辅助显示尺寸 (拖曳时显示) */}
        {isResizing && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {currentWidth}px
          </div>
        )}

      </div>
    </NodeViewWrapper>
  );
}