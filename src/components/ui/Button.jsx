import React from 'react';
import { Loader2 } from 'lucide-react';

export const PrimaryButton = ({ loading, children, ...props }) => (
  <button
    disabled={loading}
    className={`w-full flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors ${
      loading ? 'opacity-70 cursor-not-allowed' : ''
    }`}
    {...props}
  >
    {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : children}
  </button>
);