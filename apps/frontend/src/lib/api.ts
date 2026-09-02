export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type PracticeStatus = 'IN_PROGRESS' | 'FINISHED';

export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  enrollmentCode: string;
  career: string;
  phone?: string | null;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  department: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  studentProfile?: StudentProfile | null;
  teacherProfile?: TeacherProfile | null;
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface Note {
  id: string;
  practiceId: string;
  authorId?: string | null;
  author?: User | null;
  isSystem: boolean;
  content: string;
  attachments?: NoteAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Practice {
  id: string;
  status: PracticeStatus;
  title: string;
  description?: string | null;
  
  // Fechas y Actividades
  startDate?: string | null;
  endDate?: string | null;
  activitiesDescription?: string | null;
  
  // Empresa
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyDetails?: string | null;
  
  // Jefe Directo
  supervisorName?: string | null;
  supervisorContact?: string | null;

  studentId: string;
  student?: User;
  teacherId?: string | null;
  teacher?: User | null;
  notes?: Note[];
  createdAt: string;
  updatedAt: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getFileUrl(fileUrl: string): string {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  return `${API_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Error ${res.status}: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.message) {
        errorMsg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
    } catch {
      // Ignorar error al parsear JSON
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>('/auth/me'),

  getPractices: () => request<Practice[]>('/practices'),

  getPractice: (id: string) => request<Practice>(`/practices/${id}`),

  createPractice: (data: {
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    activitiesDescription?: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyDetails?: string;
    supervisorName?: string;
    supervisorContact?: string;
    studentId?: string;
  }) =>
    request<Practice>('/practices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePractice: (
    id: string,
    data: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      activitiesDescription?: string;
      companyName?: string;
      companyAddress?: string;
      companyPhone?: string;
      companyDetails?: string;
      supervisorName?: string;
      supervisorContact?: string;
      status?: PracticeStatus;
      studentPhone?: string;
      studentCareer?: string;
    }
  ) =>
    request<Practice>(`/practices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  assignTeacher: (practiceId: string, teacherId?: string) =>
    request<Practice>(`/practices/${practiceId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ teacherId }),
    }),

  removeTeacher: (practiceId: string) =>
    request<Practice>(`/practices/${practiceId}/remove-teacher`, {
      method: 'PATCH',
    }),

  updateStatus: (practiceId: string, status: PracticeStatus) =>
    request<Practice>(`/practices/${practiceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getUsers: (role?: Role) =>
    request<User[]>(`/users${role ? `?role=${role}` : ''}`),

  createUser: (data: {
    email: string;
    password: string;
    role: Role;
    firstName: string;
    lastName: string;
    enrollmentCode?: string;
    career?: string;
    department?: string;
  }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (
    id: string,
    data: {
      email?: string;
      password?: string;
      role?: Role;
      firstName?: string;
      lastName?: string;
      enrollmentCode?: string;
      career?: string;
      department?: string;
      phone?: string;
    }
  ) =>
    request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  createNote: (data: { practiceId: string; content: string; file?: File | null }) => {
    if (data.file) {
      const formData = new FormData();
      formData.append('practiceId', data.practiceId);
      formData.append('content', data.content);
      formData.append('file', data.file);

      return request<Note>('/notes', {
        method: 'POST',
        body: formData,
      });
    }

    return request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify({
        practiceId: data.practiceId,
        content: data.content,
      }),
    });
  },

  deleteNote: (id: string) =>
    request<{ message: string }>(`/notes/${id}`, {
      method: 'DELETE',
    }),
  updateNote: (id: string, content: string) =>
    request<Note>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),
};
