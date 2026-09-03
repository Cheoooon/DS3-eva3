export const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};
export const formatForFilter = (dateString?: string | Date | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

export const formatDateTime = (dateString?: string | Date | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
