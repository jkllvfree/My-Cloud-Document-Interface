import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from 'lucide-react';

const ToolbarBtn = ({ active, onClick, children, danger }) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
      active ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
    } ${danger ? 'hover:bg-red-50 text-red-500 hover:text-red-600' : ''}`}
  >
    {children}
  </button>
);

export default function ImageToolbar({ textAlign, onAlign, onDelete }) {
  return (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white shadow-xl border border-gray-200 p-1.5 rounded-lg z-50 animate-in fade-in zoom-in duration-200">
      <ToolbarBtn active={textAlign === 'left'} onClick={() => onAlign('left')}>
        <AlignLeft size={16} />
      </ToolbarBtn>
      <ToolbarBtn active={textAlign === 'center'} onClick={() => onAlign('center')}>
        <AlignCenter size={16} />
      </ToolbarBtn>
      <ToolbarBtn active={textAlign === 'right'} onClick={() => onAlign('right')}>
        <AlignRight size={16} />
      </ToolbarBtn>

      <div className="w-px h-4 bg-gray-300 mx-1"></div>

      <ToolbarBtn danger onClick={onDelete}>
        <Trash2 size={16} />
      </ToolbarBtn>
    </div>
  );
}