'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, Practice, User, PracticeStatus, getFileUrl } from '../../../lib/api';
import { io } from 'socket.io-client';
import Link from 'next/link';

export default function PracticeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();

  // Estados de la práctica y datos
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<User[]>([]);

  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'detail' | 'notes') || 'detail';
  const setActiveTab = (tab: 'detail' | 'notes') => router.push(`?tab=${tab}`);

  const [notesToShow, setNotesToShow] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [practice?.notes, notesToShow]);

  // Modos de edición y alertas
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    
    socket.on('connect', () => {
      socket.emit('joinPracticeRoom', id);
    });

    socket.on('noteCreated', (newNote) => {
      // Actualizar el estado local con la nueva nota
      setPractice((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notes: [...(prev.notes || []), newNote],
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);
  // Campos del formulario de edición
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editActivities, setEditActivities] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');
  const [editCompanyPhone, setEditCompanyPhone] = useState('');
  const [editCompanyDetails, setEditCompanyDetails] = useState('');
  const [editSupervisorName, setEditSupervisorName] = useState('');
  const [editSupervisorContact, setEditSupervisorContact] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentCareer, setEditStudentCareer] = useState('');

  // Estados de notas y bitácora
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingNote, setSubmittingNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPractice = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const data = await api.getPractice(id);
      setPractice(data);

      setEditTitle(data.title || '');
      setEditDesc(data.description || '');
      setEditStartDate(data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '');
      setEditEndDate(data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '');
      setEditActivities(data.activitiesDescription || '');
      setEditCompanyName(data.companyName || '');
      setEditCompanyAddress(data.companyAddress || '');
      setEditCompanyPhone(data.companyPhone || '');
      setEditCompanyDetails(data.companyDetails || '');
      setEditSupervisorName(data.supervisorName || '');
      setEditSupervisorContact(data.supervisorContact || '');
      setEditStudentPhone(data.student?.studentProfile?.phone || '');
      setEditStudentCareer(data.student?.studentProfile?.career || '');

      if (user.role === 'ADMIN') {
        const teachersList = await api.getUsers('TEACHER');
        setTeachers(teachersList);
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cargar la práctica',
      });
    } finally {
      setLoading(false);
    }
  }, [id, user]);

    // Polling para actualizar bitácora en tiempo real
  useEffect(() => {
    if (activeTab !== 'notes') return;
    const interval = setInterval(loadPractice, 5000);
    return () => clearInterval(interval);
  }, [activeTab, loadPractice]);
  // # ponytail: polling en lugar de WebSockets; agregar WebSockets si se requiere tiempo real estricto.

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && id) {
      loadPractice();
    }
  }, [user, authLoading, id, router, loadPractice]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900">Práctica no encontrada</h2>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm"
        >
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const studentFullName = practice.student?.studentProfile
    ? `${practice.student.studentProfile.firstName} ${practice.student.studentProfile.lastName}`
    : practice.student?.email || '—';

  const teacherFullName = practice.teacher?.teacherProfile
    ? `${practice.teacher.teacherProfile.firstName} ${practice.teacher.teacherProfile.lastName}`
    : practice.teacher?.email || 'Sin Asignar';

  const canEdit =
    user?.role === 'ADMIN' ||
    (user?.role === 'TEACHER' && practice.teacherId === user.id);

  const isFinished = practice.status === 'FINISHED';

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const updated = await api.updatePractice(practice.id, {
        title: editTitle,
        description: editDesc,
        startDate: editStartDate || undefined,
        endDate: editEndDate || undefined,
        activitiesDescription: editActivities,
        companyName: editCompanyName,
        companyAddress: editCompanyAddress,
        companyPhone: editCompanyPhone,
        companyDetails: editCompanyDetails,
        supervisorName: editSupervisorName,
        supervisorContact: editSupervisorContact,
        studentPhone: user?.role === 'ADMIN' ? editStudentPhone : undefined,
        studentCareer: user?.role === 'ADMIN' ? editStudentCareer : undefined,
      });
      setPractice(updated);
      setIsEditing(false);
      setFeedbackMsg({ type: 'success', text: 'Ficha de práctica actualizada correctamente.' });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar los cambios',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || practice?.status === 'FINISHED') return;
    setSubmittingNote(true);
    try {
      await api.createNote({
        practiceId: practice.id,
        content: newNoteContent.trim(),
        file: selectedFile,
      });
      setNewNoteContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedbackMsg({ type: 'success', text: 'Nota agregada a la bitácora.' });
      await loadPractice();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al registrar la nota',
      });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.deleteNote(noteId);
      setFeedbackMsg({ type: 'success', text: 'Nota eliminada.' });
      await loadPractice();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al eliminar nota',
      });
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await api.updateNote(noteId, content);
      setEditingNoteId(null);
      setEditNoteContent('');
      setFeedbackMsg({ type: 'success', text: 'Nota actualizada.' });
      await loadPractice();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar nota',
      });
    }
  };

    const handleUpdateStatus = async (newStatus: PracticeStatus) => {
    try {
      const updated = await api.updateStatus(practice.id, newStatus);
      setPractice(updated);
      setFeedbackMsg({
        type: 'success',
        text: `Estado actualizado a ${newStatus === 'FINISHED' ? 'FINALIZADA' : 'EN PROGRESO'}.`,
      });
      await loadPractice();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar estado',
      });
    }
  };

  const handleAssignTeacher = async (teacherId: string) => {
    try {
      const updated = teacherId
        ? await api.assignTeacher(practice.id, teacherId)
        : await api.removeTeacher(practice.id);
      setPractice(updated);
      setFeedbackMsg({ type: 'success', text: teacherId ? 'Docente asignado.' : 'Docente desasignado.' });
      await loadPractice();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al asignar docente',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Panel Principal
        </Link>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{feedbackMsg.type === 'success' ? '✅' : '⚠️'}</span>
            <span className="text-sm font-medium">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-gray-400 hover:text-gray-600 font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                  practice.status === 'FINISHED'
                    ? 'bg-gray-100 text-gray-700 border-gray-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {practice.status === 'FINISHED' ? 'FINALIZADA' : 'EN PROGRESO'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Registrada: {new Date(practice.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{practice.title}</h1>
            <p className="text-sm text-gray-500">
              Estudiante: <span className="font-semibold text-gray-800">{studentFullName}</span> • Docente Guía:{' '}
              <span className={`font-semibold ${practice.teacher ? 'text-indigo-700' : 'text-amber-600'}`}>
                {teacherFullName}
              </span>
            </p>
          </div>
        </div>
        {/* Quick Actions (Role-based) */}
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">Docente:</span>
                <select
                  value={practice.teacherId || ''}
                  onChange={(e) => handleAssignTeacher(e.target.value)}
                  className="text-xs border border-gray-300 rounded-xl px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Sin Asignar</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.teacherProfile ? `${t.teacherProfile.firstName} ${t.teacherProfile.lastName}` : t.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(user?.role === 'ADMIN' || (user?.role === 'TEACHER' && practice.teacherId === user.id)) && (
              <button
                onClick={() => handleUpdateStatus(isFinished ? 'IN_PROGRESS' : 'FINISHED')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition shadow-sm ${
                  isFinished
                    ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {isFinished ? 'Reabrir Práctica' : 'Finalizar Práctica'}
              </button>
            )}

            {canEdit && !isEditing && activeTab === 'detail' && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                ✏️ Editar Ficha
              </button>
            )}
          </div>
      </div>

      <div className="flex border-b border-gray-200 pt-2 space-x-8">
        <button
          onClick={() => setActiveTab('detail')}
          className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'detail'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>📋</span>
          <span>Detalle Completo</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'notes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span>📝</span>
          <span>Bitácora de Observaciones ({practice.notes?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'detail' && (
        <div className="space-y-6">
          {isEditing ? (
            <form onSubmit={handleSaveDetails} className="bg-white rounded-2xl border border-indigo-200 shadow-lg p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Editar Información de la Ficha</h3>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'TEACHER'
                      ? 'Modifica los detalles de la práctica, empresa, actividades y supervisor.'
                      : 'Modificación total de la ficha de práctica (Administrador).'}
                  </p>
                </div>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {user?.role === 'ADMIN' ? 'Edición Administrador' : 'Edición Docente'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1.5">
                    <span>🎓</span>
                    <span>Datos del Estudiante</span>
                  </h4>
                  {user?.role === 'TEACHER' && (
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      🔒 Solo lectura para docentes
                    </span>
                  )}
                </div>

                {user?.role === 'TEACHER' ? (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 font-medium block">Nombre Completo:</span>
                      <span className="font-semibold text-gray-900 text-sm">{studentFullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">N° Matrícula:</span>
                      <span className="font-mono font-semibold text-gray-900">
                        {practice.student?.studentProfile?.enrollmentCode || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Carrera:</span>
                      <span className="font-semibold text-gray-900">
                        {practice.student?.studentProfile?.career || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block">Teléfono de Contacto:</span>
                      <span className="font-semibold text-gray-900">
                        {practice.student?.studentProfile?.phone || 'No registrado'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Carrera</label>
                      <input
                        type="text"
                        value={editStudentCareer}
                        onChange={(e) => setEditStudentCareer(e.target.value)}
                        placeholder="Ej: Ingeniería en Informática"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono Personal</label>
                      <input
                        type="text"
                        value={editStudentPhone}
                        onChange={(e) => setEditStudentPhone(e.target.value)}
                        placeholder="Ej: +56 9 1234 5678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1.5">
                  <span>📅</span>
                  <span>Detalles de la Práctica y Fechas</span>
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Título del Proyecto</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Término</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción General</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    placeholder="Resumen general del contexto de la práctica..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Descripción de las Actividades a Realizar
                  </label>
                  <textarea
                    value={editActivities}
                    onChange={(e) => setEditActivities(e.target.value)}
                    rows={4}
                    placeholder="Tareas específicas, tecnologías a usar, entregables esperados..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1.5">
                  <span>🏢</span>
                  <span>Datos de la Empresa</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Empresa</label>
                    <input
                      type="text"
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder="Ej: Tech Solutions SpA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono de la Empresa</label>
                    <input
                      type="text"
                      value={editCompanyPhone}
                      onChange={(e) => setEditCompanyPhone(e.target.value)}
                      placeholder="Ej: +56 2 2345 6789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección de la Empresa</label>
                  <input
                    type="text"
                    value={editCompanyAddress}
                    onChange={(e) => setEditCompanyAddress(e.target.value)}
                    placeholder="Ej: Av. Providencia 1234, Santiago"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Otros Detalles Relevantes</label>
                  <textarea
                    value={editCompanyDetails}
                    onChange={(e) => setEditCompanyDetails(e.target.value)}
                    rows={2}
                    placeholder="Giro, área de desempeño, modalidad (remoto/híbrido/presencial)..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center space-x-1.5">
                  <span>👔</span>
                  <span>Jefe Directo / Supervisor en la Empresa</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Supervisor</label>
                    <input
                      type="text"
                      value={editSupervisorName}
                      onChange={(e) => setEditSupervisorName(e.target.value)}
                      placeholder="Ej: Carlos Silva - Líder Técnico"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto del Supervisor</label>
                    <input
                      type="text"
                      value={editSupervisorContact}
                      onChange={(e) => setEditSupervisorContact(e.target.value)}
                      placeholder="Ej: csilva@empresa.com / +56 9 9876 5432"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow transition disabled:opacity-50"
                >
                  {saving ? 'Guardando Cambios...' : 'Guardar Ficha'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <span className="text-xl">🎓</span>
                  <h3 className="text-base font-bold text-gray-900">Datos del Estudiante</h3>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <dt className="text-gray-400 font-medium">Nombre Completo</dt>
                    <dd className="text-gray-900 font-semibold text-sm mt-0.5">{studentFullName}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">N° Matrícula</dt>
                    <dd className="text-gray-900 font-mono font-semibold mt-0.5">
                      {practice.student?.studentProfile?.enrollmentCode || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Carrera</dt>
                    <dd className="text-gray-900 font-semibold mt-0.5">
                      {practice.student?.studentProfile?.career || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Teléfono de Contacto</dt>
                    <dd className="text-gray-900 font-semibold mt-0.5">
                      {practice.student?.studentProfile?.phone || 'No registrado'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-400 font-medium">Correo Electrónico</dt>
                    <dd className="text-gray-900 font-mono mt-0.5">{practice.student?.email}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <span className="text-xl">🏢</span>
                  <h3 className="text-base font-bold text-gray-900">Empresa</h3>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div className="col-span-2">
                    <dt className="text-gray-400 font-medium">Razón Social / Nombre</dt>
                    <dd className="text-gray-900 font-semibold text-sm mt-0.5">
                      {practice.companyName || 'No especificada'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Teléfono</dt>
                    <dd className="text-gray-900 font-semibold mt-0.5">{practice.companyPhone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Dirección</dt>
                    <dd className="text-gray-900 font-semibold mt-0.5">{practice.companyAddress || '—'}</dd>
                  </div>
                  {practice.companyDetails && (
                    <div className="col-span-2">
                      <dt className="text-gray-400 font-medium">Detalles Relevantes</dt>
                      <dd className="text-gray-700 mt-0.5 whitespace-pre-wrap">{practice.companyDetails}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <span className="text-xl">📋</span>
                  <h3 className="text-base font-bold text-gray-900">Detalles y Actividades a Realizar</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-gray-400 font-medium">Fecha de Inicio</dt>
                        <dd className="text-gray-900 font-semibold text-sm mt-0.5">
                          {practice.startDate ? new Date(practice.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : 'Por definir'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Fecha de Término</dt>
                        <dd className="text-gray-900 font-semibold text-sm mt-0.5">
                          {practice.endDate ? new Date(practice.endDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : 'Por definir'}
                        </dd>
                      </div>
                    </div>
                    {practice.description && (
                      <div>
                        <dt className="text-gray-400 font-medium">Descripción General</dt>
                        <dd className="text-gray-700 mt-1 whitespace-pre-wrap">{practice.description}</dd>
                      </div>
                    )}
                  </div>

                  <div>
                    <dt className="text-gray-400 font-medium">Actividades a Realizar</dt>
                    <dd className="text-gray-800 font-medium mt-1 bg-gray-50 p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap min-h-[5rem]">
                      {practice.activitiesDescription || 'No se han detallado actividades aún.'}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <span className="text-xl">👔</span>
                  <h3 className="text-base font-bold text-gray-900">Jefe Directo / Supervisor en la Empresa</h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-gray-400 font-medium">Nombre del Supervisor</dt>
                    <dd className="text-gray-900 font-semibold text-sm mt-0.5">
                      {practice.supervisorName || 'No especificado'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-medium">Contacto del Supervisor</dt>
                    <dd className="text-gray-900 font-semibold text-sm mt-0.5">
                      {practice.supervisorContact || 'No especificado'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-gray-900">Bitácora y Seguimiento</h3>
              <p className="text-xs text-gray-500">
                Registro de avances, reuniones, observaciones y documentos adjuntos de la práctica.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto" ref={scrollRef}>
            {(!practice.notes || practice.notes.length === 0) ? (
              <div className="p-12 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <span className="text-3xl block mb-2">📝</span>
                Aún no hay notas u observaciones registradas en la bitácora.
              </div>
            ) : (
              <>
                {notesToShow < (practice.notes?.length || 0) && (
                  <div className="p-4 flex justify-center">
                    <button
                    onClick={() => {
                      const scrollContainer = scrollRef.current;
                      const prevScrollHeight = scrollContainer?.scrollHeight || 0;
                      setNotesToShow(notesToShow + 5);
                      
                      // Mantenemos la posición relativa al añadir nuevos mensajes arriba
                      setTimeout(() => {
                        if (scrollContainer) {
                          scrollContainer.scrollTop = (scrollContainer.scrollHeight || 0) - prevScrollHeight;
                        }
                      }, 0);
                    }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                    >
                      Ver más mensajes antiguos
                    </button>
                  </div>
                )}
                {(practice.notes || []).slice(0, notesToShow).reverse().map((note) => {
                  const authorName = note.author
                    ? note.author.studentProfile
                      ? `${note.author.studentProfile.firstName} ${note.author.studentProfile.lastName}`
                      : note.author.teacherProfile
                      ? `${note.author.teacherProfile.firstName} ${note.author.teacherProfile.lastName}`
                      : note.author.email
                    : 'Sistema';

                  const isWithinTimeLimit = (createdAt: string) => {
                    const diffMinutes = (new Date().getTime() - new Date(createdAt).getTime()) / 60000;
                    return diffMinutes < 5;
                  };

                  const canEditOrDelete =
                    user?.role === 'ADMIN' || (note.authorId === user?.id && isWithinTimeLimit(note.createdAt));

                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border ${
                        note.isSystem
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-white border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-gray-900">{authorName}</span>
                          {note.author && (
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                note.author.role === 'ADMIN'
                                  ? 'bg-purple-100 text-purple-700'
                                  : note.author.role === 'TEACHER'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {note.author.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                          {canEditOrDelete && !note.isSystem && (
                            <>
                              {editingNoteId === note.id ? (
                                <button
                                  onClick={() => handleUpdateNote(note.id, editNoteContent)}
                                  className="text-emerald-500 hover:text-emerald-700 text-xs font-bold"
                                  title="Guardar"
                                >
                                  💾
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditNoteContent(note.content);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-600 text-xs font-bold"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-red-400 hover:text-red-600 text-xs font-bold ml-1"
                                title="Eliminar nota"
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingNoteId === note.id ? (
                        <textarea
                          value={editNoteContent}
                          onChange={(e) => setEditNoteContent(e.target.value)}
                          className="w-full text-sm text-gray-700 p-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      )}

                      {note.attachments && note.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                            Archivos Adjuntos:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {note.attachments.map((att) => {
                              const fileDownloadUrl = getFileUrl(att.fileUrl);
                              const isImage = att.fileType.startsWith('image/');

                              return (
                                <a
                                  key={att.id}
                                  href={fileDownloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700 transition group shadow-sm"
                                  title={`Descargar ${att.fileName}`}
                                >
                                  <span>{isImage ? '🖼️' : '📎'}</span>
                                  <span className="truncate max-w-[200px]">{att.fileName}</span>
                                  <span className="text-indigo-400 group-hover:text-indigo-600">↓</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {practice.status !== 'FINISHED' ? (
            <form onSubmit={handleAddNote} className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Escribe una observación, avance o comentario en la bitácora..."
                  className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 cursor-pointer shadow-sm transition"
                  title="Adjuntar archivo (PDF, Imagen, Word, etc.)"
                >
                  📎 <span className="hidden sm:inline ml-1">Adjuntar</span>
                </label>
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteContent.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition disabled:opacity-50"
                >
                  {submittingNote ? 'Publicando...' : 'Publicar Nota'}
                </button>
              </div>
              {selectedFile && (
                <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs px-3 py-1.5 rounded-lg w-fit">
                  <span>📎 Archivo adjunto: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700 font-bold ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="p-4 bg-amber-50 border-t border-amber-100 text-amber-800 text-sm text-center font-semibold">
              Ya no se pueden agregar más notas, debido a que está finalizado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}