-- Crear usuarios de prueba (password123)
INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@sistema.cl', '$2b$10$aUsqYTW96zg7.uBvfyoBn.RIy5aukupRFoCTMmDem7XTjt3I1r9CK', 'ADMIN', NOW(), NOW()),
('t0000000-0000-0000-0000-000000000001', 'profe@sistema.cl', '$2b$10$aUsqYTW96zg7.uBvfyoBn.RIy5aukupRFoCTMmDem7XTjt3I1r9CK', 'TEACHER', NOW(), NOW()),
('s0000000-0000-0000-0000-000000000001', 'alumno@sistema.cl', '$2b$10$aUsqYTW96zg7.uBvfyoBn.RIy5aukupRFoCTMmDem7XTjt3I1r9CK', 'STUDENT', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password;

INSERT INTO "TeacherProfile" (id, "userId", "firstName", "lastName", department) VALUES
('tp0000000000000000000000000000001', 't0000000-0000-0000-0000-000000000001', 'Profesor', 'Guía', 'Ingeniería')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "StudentProfile" (id, "userId", "firstName", "lastName", "enrollmentCode", career) VALUES
('sp0000000000000000000000000000001', 's0000000-0000-0000-0000-000000000001', 'Estudiante', 'Ejemplo', '2026001', 'Ingeniería Informática')
ON CONFLICT (id) DO NOTHING;
