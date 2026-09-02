'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api, Practice, User, Role, PracticeStatus, getFileUrl } from '../../lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [practices, setPractices] = useState<Practice[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'practices' | 'users'>('practices');

  // Filtros y Paginación de notas
  const [filterStatus, setFilterStatus] = useState<PracticeStatus | 'ALL' | 'UNASSIGNED'>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [notesToShow, setNotesToShow] = useState(5);
  const scrollRefModal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setFilterStatus(user.role === 'ADMIN' ? 'UNASSIGNED' : 'IN_PROGRESS');
    }
  }, [user]);

  const filteredPractices = practices.filter((p) => {
    let matchStatus = true;
    if (filterStatus === 'UNASSIGNED') {
      matchStatus = !p.teacherId;
    } else if (filterStatus !== 'ALL') {
      matchStatus = p.status === filterStatus;
    }

    let matchDate = true;
    if (filterDate) {
      matchDate = p.createdAt?.startsWith(filterDate) || false;
    }

    return matchStatus && matchDate;
  });

  // Quick Bitácora Modal State
  const [selectedPracticeForNotes, setSelectedPracticeForNotes] = useState<Practice | null>(null);
  const [quickNoteContent, setQuickNoteContent] = useState('');
  const [quickNoteFile, setQuickNoteFile] = useState<File | null>(null);
  const [submittingNote, setSubmittingNote] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final del modal al abrirlo o cambiar notas (estilo chat)
  useEffect(() => {
    if (selectedPracticeForNotes && scrollRefModal.current) {
      scrollRefModal.current.scrollTop = scrollRefModal.current.scrollHeight;
    }
  }, [selectedPracticeForNotes, selectedPracticeForNotes?.notes?.length]);

  // New Practice Modal State
  const [showNewPracticeModal, setShowNewPracticeModal] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState('');
  const [practiceDesc, setPracticeDesc] = useState('');
  const [practiceStartDate, setPracticeStartDate] = useState('');
  const [practiceEndDate, setPracticeEndDate] = useState('');
  const [practiceActivities, setPracticeActivities] = useState('');
  const [practiceCompanyName, setPracticeCompanyName] = useState('');
  const [practiceCompanyAddress, setPracticeCompanyAddress] = useState('');
  const [practiceCompanyPhone, setPracticeCompanyPhone] = useState('');
  const [practiceCompanyDetails, setPracticeCompanyDetails] = useState('');
  const [practiceSupervisorName, setPracticeSupervisorName] = useState('');
  const [practiceSupervisorContact, setPracticeSupervisorContact] = useState('');
  const [practiceStudentId, setPracticeStudentId] = useState('');
  const [creatingPractice, setCreatingPractice] = useState(false);

  // New User Form State
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<Role>('STUDENT');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserEnrollment, setNewUserEnrollment] = useState('');
  const [newUserCareer, setNewUserCareer] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit User Form State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('STUDENT');
  const [editUserFirstName, setEditUserFirstName] = useState('');
  const [editUserLastName, setEditUserLastName] = useState('');
  const [editUserEnrollment, setEditUserEnrollment] = useState('');
  const [editUserCareer, setEditUserCareer] = useState('');
  const [editUserDepartment, setEditUserDepartment] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const practicesData = await api.getPractices();
      setPractices(practicesData);

      if (user.role === 'ADMIN') {
        const [teachersData, studentsData, usersData] = await Promise.all([
          api.getUsers('TEACHER'),
          api.getUsers('STUDENT'),
          api.getUsers(),
        ]);
        setTeachers(teachersData);
        setStudents(studentsData);
        setAllUsers(usersData);
      } else if (user.role === 'TEACHER') {
        const [teachersData, studentsData] = await Promise.all([
          api.getUsers('TEACHER'),
          api.getUsers('STUDENT'),
        ]);
        setTeachers(teachersData);
        setStudents(studentsData);
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cargar datos',
      });
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadData();
    }
  }, [user, loading, router, loadData]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPractice(true);
    setFeedbackMsg(null);
    try {
      await api.createPractice({
        title: practiceTitle,
        description: practiceDesc,
        startDate: practiceStartDate || undefined,
        endDate: practiceEndDate || undefined,
        activitiesDescription: practiceActivities,
        companyName: practiceCompanyName,
        companyAddress: practiceCompanyAddress,
        companyPhone: practiceCompanyPhone,
        companyDetails: practiceCompanyDetails,
        supervisorName: practiceSupervisorName,
        supervisorContact: practiceSupervisorContact,
        studentId: (user?.role === 'ADMIN' || user?.role === 'TEACHER') ? practiceStudentId : undefined,
      });
      setFeedbackMsg({ type: 'success', text: 'Práctica registrada exitosamente.' });
      setShowNewPracticeModal(false);
      setPracticeTitle('');
      setPracticeDesc('');
      setPracticeStartDate('');
      setPracticeEndDate('');
      setPracticeActivities('');
      setPracticeCompanyName('');
      setPracticeCompanyAddress('');
      setPracticeCompanyPhone('');
      setPracticeCompanyDetails('');
      setPracticeSupervisorName('');
      setPracticeSupervisorContact('');
      setPracticeStudentId('');
      await loadData();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al registrar la práctica',
      });
    } finally {
      setCreatingPractice(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setFeedbackMsg(null);
    try {
      await api.createUser({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        firstName: newUserFirstName,
        lastName: newUserLastName,
        enrollmentCode: newUserRole === 'STUDENT' ? newUserEnrollment : undefined,
        career: newUserRole === 'STUDENT' ? newUserCareer : undefined,
        department: newUserRole === 'TEACHER' ? newUserDepartment : undefined,
      });
      setFeedbackMsg({ type: 'success', text: 'Usuario registrado exitosamente.' });
      setShowNewUserModal(false);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserEnrollment('');
      setNewUserCareer('');
      setNewUserDepartment('');
      await loadData();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al registrar usuario',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleStartEditUser = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditUserEmail(targetUser.email);
    setEditUserPassword('');
    setEditUserRole(targetUser.role);
    setEditUserFirstName(
      targetUser.studentProfile?.firstName || targetUser.teacherProfile?.firstName || ''
    );
    setEditUserLastName(
      targetUser.studentProfile?.lastName || targetUser.teacherProfile?.lastName || ''
    );
    setEditUserEnrollment(targetUser.studentProfile?.enrollmentCode || '');
    setEditUserCareer(targetUser.studentProfile?.career || '');
    setEditUserPhone(targetUser.studentProfile?.phone || '');
    setEditUserDepartment(targetUser.teacherProfile?.department || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    setFeedbackMsg(null);
    try {
      await api.updateUser(editingUser.id, {
        email: editUserEmail,
        password: editUserPassword || undefined,
        role: editUserRole,
        firstName: editUserFirstName,
        lastName: editUserLastName,
        enrollmentCode: editUserRole === 'STUDENT' ? editUserEnrollment : undefined,
        career: editUserRole === 'STUDENT' ? editUserCareer : undefined,
        phone: editUserRole === 'STUDENT' ? editUserPhone : undefined,
        department: editUserRole === 'TEACHER' ? editUserDepartment : undefined,
      });
      setFeedbackMsg({ type: 'success', text: 'Datos de usuario actualizados correctamente.' });
      setEditingUser(null);
      await loadData();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar usuario',
      });
    } finally {
      setSavingUser(false);
    }
  };

  const handleUpdateStatus = async (practiceId: string, status: PracticeStatus) => {
    try {
      await api.updateStatus(practiceId, status);
      setFeedbackMsg({
        type: 'success',
        text: `Estado actualizado a ${status === 'FINISHED' ? 'FINALIZADA' : 'EN PROGRESO'}.`,
      });
      await loadData();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar estado',
      });
    }
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPracticeForNotes || !quickNoteContent.trim() || selectedPracticeForNotes.status === 'FINISHED') return;
    setSubmittingNote(true);
    try {
      await api.createNote({
        practiceId: selectedPracticeForNotes.id,
        content: quickNoteContent.trim(),
        file: quickNoteFile || undefined,
      });
      setQuickNoteContent('');
      setQuickNoteFile(null);
      if (quickFileInputRef.current) quickFileInputRef.current.value = '';
      await loadData();
      const updatedPractice = await api.getPractice(selectedPracticeForNotes.id);
      setSelectedPracticeForNotes(updatedPractice);
      setFeedbackMsg({ type: 'success', text: 'Nota agregada.' });
      setTimeout(() => {
        if (scrollRefModal.current) {
          scrollRefModal.current.scrollTop = scrollRefModal.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Error al agregar nota' });
    } finally {
      setSubmittingNote(false);
    }
  };

  const getStudentName = (p: Practice) => {
    if (p.student?.studentProfile) {
      return `${p.student.studentProfile.firstName} ${p.student.studentProfile.lastName}`;
    }
    return p.student?.email || 'Estudiante';
  };

  const getTeacherName = (p: Practice) => {
    if (p.teacher?.teacherProfile) {
      return `${p.teacher.teacherProfile.firstName} ${p.teacher.teacherProfile.lastName}`;
    }
    return p.teacher?.email || 'Sin Asignar';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition ${
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

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.role === 'ADMIN' && 'Gestión general de fichas de práctica, estudiantes y docentes.'}
            {user?.role === 'TEACHER' && 'Supervisión de prácticas asignadas y seguimiento de bitácora.'}
            {user?.role === 'STUDENT' && 'Registro de ficha de práctica, actividades y bitácora de seguimiento.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(user?.role === 'ADMIN' || user?.role === 'TEACHER' || (user?.role === 'STUDENT' && !practices.some((p) => p.status === 'IN_PROGRESS'))) && (
            <button
              onClick={() => setShowNewPracticeModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition"
            >
              + Registrar Nueva Práctica
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowNewUserModal(true)}
              className="inline-flex items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow transition"
            >
              + Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="flex border-b border-gray-200 space-x-8">
          <button
            onClick={() => setActiveTab('practices')}
            className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition ${
              activeTab === 'practices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Fichas de Prácticas ({practices.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Usuarios ({allUsers.length})
          </button>
        </div>
      )}

      {(user?.role !== 'ADMIN' || activeTab === 'practices') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">
              {user?.role === 'STUDENT' ? 'Mi Práctica Profesional' : 'Listado de Prácticas'}
            </h2>
            <span className="text-xs font-medium text-gray-500">Total: {practices.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PracticeStatus | 'ALL' | 'UNASSIGNED')}
              className="text-sm border-gray-300 rounded-lg px-3 py-1.5"
            >
              <option value="ALL">Todos los estados</option>
              {user.role === 'ADMIN' && <option value="UNASSIGNED">Sin asignar</option>}
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="FINISHED">Finalizada</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm border-gray-300 rounded-lg px-3 py-1.5"
            />
            <button
              onClick={() => { setFilterStatus('ALL'); setFilterDate(''); }}
              className="text-xs text-indigo-600 font-bold"
            >
              Limpiar filtros
            </button>
          </div>

          {loadingData ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
              <p className="text-sm text-gray-500">Cargando información...</p>
            </div>
          ) : practices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-2xl">
                📂
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">No hay prácticas registradas</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                  {user?.role === 'STUDENT'
                    ? 'Aún no has registrado tu práctica. Haz clic en "Registrar Nueva Práctica" para ingresar todos tus datos.'
                    : 'Actualmente no hay prácticas asignadas o registradas.'}
                </p>
              </div>
              {(user?.role === 'STUDENT' || user?.role === 'TEACHER') && (
                <button
                  onClick={() => setShowNewPracticeModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow transition"
                >
                  Registrar Ficha de Práctica
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPractices.map((practice) => {
                const isFinished = practice.status === 'FINISHED';
                const notesCount = practice.notes?.length || 0;

                return (
                  <div
                    key={practice.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isFinished
                              ? 'bg-gray-100 text-gray-700 border-gray-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isFinished ? 'FINALIZADA' : 'EN PROGRESO'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(practice.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 line-clamp-2">
                        {practice.title}
                      </h3>

                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Empresa:</span>
                          <span className="font-semibold text-gray-800">
                            {practice.companyName || 'No especificada'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 font-medium">Período:</span>
                          <span className="font-semibold text-gray-700">
                            {practice.startDate ? new Date(practice.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : '—'} a{' '}
                            {practice.endDate ? new Date(practice.endDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs pt-1">
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="text-gray-400 font-medium">Estudiante:</span>
                          <span className="font-semibold text-gray-900">{getStudentName(practice)}</span>
                        </div>
                        {practice.student?.studentProfile && (
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Carrera:</span>
                            <span>{practice.student.studentProfile.career}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="text-gray-400 font-medium">Docente Guía:</span>
                          <span
                            className={`font-semibold ${
                              practice.teacher ? 'text-indigo-700' : 'text-amber-600 italic'
                            }`}
                          >
                            {getTeacherName(practice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/practices/${practice.id}`}
                        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                      >
                        <span>📄 Ver Ficha Completa</span>
                      </Link>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setSelectedPracticeForNotes(practice)}
                          className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg shadow-sm"
                          title="Ver y agregar notas rápidas"
                        >
                          📝 ({notesCount})
                        </button>

                        {(user?.role === 'ADMIN' || (user?.role === 'TEACHER' && practice.teacherId === user?.id)) && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                practice.id,
                                isFinished ? 'IN_PROGRESS' : 'FINISHED'
                              )
                            }
                            className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition ${
                              isFinished
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            }`}
                          >
                            {isFinished ? 'Reabrir' : 'Finalizar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {user?.role === 'ADMIN' && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Gestión de Usuarios</h2>
            <button
              onClick={() => setShowNewUserModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow transition"
            >
              + Agregar Usuario
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Nombre Completo</th>
                  <th className="px-6 py-3">Correo</th>
                  <th className="px-6 py-3">Rol</th>
                  <th className="px-6 py-3">Detalle Perfil</th>
                  <th className="px-6 py-3">Fecha Registro</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allUsers.map((u) => {
                  const name =
                    u.studentProfile
                      ? `${u.studentProfile.firstName} ${u.studentProfile.lastName}`
                      : u.teacherProfile
                      ? `${u.teacherProfile.firstName} ${u.teacherProfile.lastName}`
                      : '—';

                  const detail =
                    u.studentProfile
                      ? `${u.studentProfile.career} (Matrícula: ${u.studentProfile.enrollmentCode})${
                          u.studentProfile.phone ? ` • Tel: ${u.studentProfile.phone}` : ''
                        }`
                      : u.teacherProfile
                      ? `Dpto: ${u.teacherProfile.department}`
                      : 'Administrador del Sistema';

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{name}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : u.role === 'TEACHER'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{detail}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStartEditUser(u)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editar Usuario</h3>
                <p className="text-xs text-gray-500">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editUserFirstName}
                    onChange={(e) => setEditUserFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={editUserLastName}
                    onChange={(e) => setEditUserLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="STUDENT">Estudiante</option>
                    <option value="TEACHER">Docente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nueva Contraseña <span className="font-normal text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    placeholder="Sin cambios"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {editUserRole === 'STUDENT' && (
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">N° Matrícula</label>
                      <input
                        type="text"
                        value={editUserEnrollment}
                        onChange={(e) => setEditUserEnrollment(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Carrera</label>
                      <input
                        type="text"
                        value={editUserCareer}
                        onChange={(e) => setEditUserCareer(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={editUserPhone}
                      onChange={(e) => setEditUserPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {editUserRole === 'TEACHER' && (
                <div className="pt-1 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={editUserDepartment}
                    onChange={(e) => setEditUserDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow transition disabled:opacity-50"
                >
                  {savingUser ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Bitácora Popup con estilo Chat */}
      {selectedPracticeForNotes && (
        <div className="fixed inset-0 !m-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Bitácora Rápida</h3>
                <p className="text-xs text-gray-500">{selectedPracticeForNotes.title}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPracticeForNotes(null);
                  setQuickNoteFile(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3" ref={scrollRefModal}>
              {(() => {
                const modalSortedNotes = [...(selectedPracticeForNotes.notes || [])].sort(
                  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                const modalVisibleNotes = modalSortedNotes.slice(-notesToShow);

                return modalSortedNotes.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hay notas registradas todavía.
                  </div>
                ) : (
                  <>
                    {notesToShow < modalSortedNotes.length && (
                      <button
                        onClick={() => {
                          const container = scrollRefModal.current;
                          const prevHeight = container?.scrollHeight || 0;
                          setNotesToShow((prev) => prev + 5);
                          setTimeout(() => {
                            if (container) {
                              container.scrollTop = container.scrollHeight - prevHeight;
                            }
                          }, 0);
                        }}
                        className="w-full py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-xl"
                      >
                        Cargar mensajes más antiguos
                      </button>
                    )}
                    {modalVisibleNotes.map((note) => {
                      const authorName = note.author
                        ? note.author.studentProfile
                          ? `${note.author.studentProfile.firstName} ${note.author.studentProfile.lastName}`
                          : note.author.teacherProfile
                          ? `${note.author.teacherProfile.firstName} ${note.author.teacherProfile.lastName}`
                          : note.author.email
                        : 'Sistema';

                      return (
                        <div
                          key={note.id}
                          className={`p-3 rounded-xl border ${
                            note.isSystem ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-900">{authorName}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(note.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {selectedPracticeForNotes.status !== 'FINISHED' && (
              <form onSubmit={handleAddQuickNote} className="p-3 bg-gray-50 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickNoteContent}
                    onChange={(e) => setQuickNoteContent(e.target.value)}
                    placeholder="Escribe una observación..."
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  />
                  <input
                    type="file"
                    ref={quickFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQuickNoteFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="quick-file-upload"
                  />
                  <label
                    htmlFor="quick-file-upload"
                    className="px-2.5 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 cursor-pointer shadow-sm"
                    title="Adjuntar archivo"
                  >
                    📎
                  </label>
                  <button
                    type="submit"
                    disabled={submittingNote || !quickNoteContent.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50"
                  >
                    {submittingNote ? '...' : 'Enviar'}
                  </button>
                </div>

                {quickNoteFile && (
                  <div className="flex items-center justify-between text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                    <span className="truncate">📎 {quickNoteFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickNoteFile(null);
                        if (quickFileInputRef.current) quickFileInputRef.current.value = '';
                      }}
                      className="text-red-500 font-bold ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {showNewPracticeModal && (
        <div className="fixed inset-0 !m-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Registrar Ficha de Práctica</h3>
                <p className="text-xs text-gray-500">Completa todos los antecedentes requeridos</p>
              </div>
              <button
                onClick={() => setShowNewPracticeModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePractice} className="space-y-4">
              {feedbackMsg?.type === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200">
                  {feedbackMsg.text}
                </div>
              )}

              {(user.role === 'ADMIN' || user.role === 'TEACHER') && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Seleccionar Estudiante
                  </label>
                  <select
                    value={practiceStudentId}
                    onChange={(e) => setPracticeStudentId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="">Selecciona un estudiante...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studentProfile
                          ? `${s.studentProfile.firstName} ${s.studentProfile.lastName} (${s.studentProfile.enrollmentCode})`
                          : s.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  📅 Detalles de la Práctica
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Título del Proyecto / Práctica
                  </label>
                  <input
                    type="text"
                    value={practiceTitle}
                    onChange={(e) => setPracticeTitle(e.target.value)}
                    placeholder="Ej: Desarrollo de Módulo de Trazabilidad"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={practiceStartDate}
                      onChange={(e) => setPracticeStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha de Término</label>
                    <input
                      type="date"
                      value={practiceEndDate}
                      onChange={(e) => setPracticeEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción General</label>
                  <textarea
                    value={practiceDesc}
                    onChange={(e) => setPracticeDesc(e.target.value)}
                    placeholder="Resumen general..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Descripción de las Actividades a Realizar
                  </label>
                  <textarea
                    value={practiceActivities}
                    onChange={(e) => setPracticeActivities(e.target.value)}
                    placeholder="Detalla las tareas, tecnologías y objetivos que llevarás a cabo..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  🏢 Datos de la Empresa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre / Razón Social</label>
                    <input
                      type="text"
                      value={practiceCompanyName}
                      onChange={(e) => setPracticeCompanyName(e.target.value)}
                      placeholder="Ej: InnovaTech SpA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono Empresa</label>
                    <input
                      type="text"
                      value={practiceCompanyPhone}
                      onChange={(e) => setPracticeCompanyPhone(e.target.value)}
                      placeholder="Ej: +56 2 2987 6543"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección Empresa</label>
                  <input
                    type="text"
                    value={practiceCompanyAddress}
                    onChange={(e) => setPracticeCompanyAddress(e.target.value)}
                    placeholder="Ej: Av. Andrés Bello 2450, Providencia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Otros Detalles de la Empresa</label>
                  <input
                    type="text"
                    value={practiceCompanyDetails}
                    onChange={(e) => setPracticeCompanyDetails(e.target.value)}
                    placeholder="Ej: Área de TI, modalidad híbrida..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  👔 Jefe Directo / Supervisor en la Empresa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre Supervisor</label>
                    <input
                      type="text"
                      value={practiceSupervisorName}
                      onChange={(e) => setPracticeSupervisorName(e.target.value)}
                      placeholder="Ej: Mario Gómez"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Contacto Supervisor</label>
                    <input
                      type="text"
                      value={practiceSupervisorContact}
                      onChange={(e) => setPracticeSupervisorContact(e.target.value)}
                      placeholder="Ej: mgomez@empresa.com / +56 9 8765 4321"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewPracticeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingPractice}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow disabled:opacity-50"
                >
                  {creatingPractice ? 'Registrando...' : 'Registrar Práctica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Registrar Nuevo Usuario</h3>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@sistema.cl"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rol</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="STUDENT">Estudiante</option>
                    <option value="TEACHER">Docente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {newUserRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">N° Matrícula</label>
                    <input
                      type="text"
                      value={newUserEnrollment}
                      onChange={(e) => setNewUserEnrollment(e.target.value)}
                      placeholder="Ej: 2026002"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Carrera</label>
                    <input
                      type="text"
                      value={newUserCareer}
                      onChange={(e) => setNewUserCareer(e.target.value)}
                      placeholder="Ej: Informática"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {newUserRole === 'TEACHER' && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    placeholder="Ej: Departamento de Computación"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow"
                >
                  {creatingUser ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}