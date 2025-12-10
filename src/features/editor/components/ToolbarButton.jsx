import React from 'react';

export const ToolbarButton = ({ onClick, isActive, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    type="button" // 防止在 form 中意外提交
    className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
      isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);