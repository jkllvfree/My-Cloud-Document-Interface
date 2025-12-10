import React from 'react';
import LoginForm from '@/features/auth/LoginForm';

export default function AuthPage({ onLoginSuccess }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* 所有的卡片细节都在 LoginForm 里 */}
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
}