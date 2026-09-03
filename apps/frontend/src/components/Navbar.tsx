'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../lib/api';
export const roleLabels: Record<Role, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrador', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
  TEACHER: { label: 'Docente Guía', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  STUDENT: { label: 'Estudiante', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
};



export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleInfo = roleLabels[user.role] || { label: user.role, color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300' };

  const fullName =
    user.role === 'STUDENT' && user.studentProfile
      ? `${user.studentProfile.firstName} ${user.studentProfile.lastName}`
      : user.role === 'TEACHER' && user.teacherProfile
      ? `${user.teacherProfile.firstName} ${user.teacherProfile.lastName}`
      : user.email.split('@')[0];

  const subInfo =
    user.role === 'STUDENT' && user.studentProfile
      ? `${user.studentProfile.career} • Matrícula: ${user.studentProfile.enrollmentCode}`
      : user.role === 'TEACHER' && user.teacherProfile
      ? `Dpto: ${user.teacherProfile.department}`
      : 'Acceso Total';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight block leading-tight">
                Gestión de Prácticas
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Portal Universitario
              </span>
            </div>
          </div>

          {/* User Info & Logout (Always visible when logged in) */}
          <div className="flex items-center space-x-4">
            {/* User badge container */}
            <div className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-1.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center border border-indigo-200">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900 leading-tight">
                    {fullName}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${roleInfo.bg} ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>{subInfo}</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="inline-flex items-center px-3.5 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 border border-red-200 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Cerrar sesión"
            >
              <svg
                className="w-4 h-4 mr-1.5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
