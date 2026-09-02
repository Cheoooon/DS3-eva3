'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 text-white font-black text-4xl shadow-xl">
          P
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
          Sistema de Prácticas Profesionales
        </h1>
        <p className="text-lg text-gray-600 max-w-lg mx-auto">
          Plataforma integral para el registro, asignación docente y seguimiento de bitácoras de prácticas profesionales.
        </p>
        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition duration-150"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
