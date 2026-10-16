import axios from 'axios';

// Se quita cualquier "/" final del valor de VITE_API_URL para evitar rutas
// con doble slash (ej. "https://localhost:5000//api/drivers"), sin importar
// cómo lo haya escrito quien configuró el .env.
const rawBaseURL = import.meta.env.VITE_API_URL || 'https://api-delivery-qo2j.onrender.com/api';
const baseURL = rawBaseURL.replace(/\/+$/, '');
 
export const api = axios.create({ baseURL, timeout: 20000 });
 
// ---------------------------------------------------------------- sesión
const TOKEN_KEY = 'delivery.token';
 
// localStorage puede fallar (modo privado, datos bloqueados): nunca debe romper la app.
export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sin persistencia */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* nada */ }
  },
};
 
let memoryToken = tokenStore.get();
let onUnauthorized = () => {};
 
export const setSessionToken = (token) => {
  memoryToken = token;
  if (token) tokenStore.set(token); else tokenStore.clear();
};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
 
api.interceptors.request.use((config) => {
  if (memoryToken) config.headers.Authorization = `Bearer ${memoryToken}`;
  return config;
});
 
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // Un 401 en cualquier ruta que no sea el login = sesión vencida o cuenta desactivada.
    if (err.response?.status === 401 && !url.includes('/auth/login') && memoryToken) {
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);
 
/** Convierte cualquier error de axios en un texto claro para mostrar en pantalla. */
export const errorMessage = (err) => {
  if (err?.response) {
    const data = err.response.data;
    if (data?.message) return data.message;
    if (err.response.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
    if (err.response.status === 403) return 'No tienes permiso para hacer esto.';
    if (err.response.status === 404) return 'No se encontró lo que buscabas.';
    return `La API respondió con error ${err.response.status}.`;
  }
  if (err?.code === 'ECONNABORTED') return 'La API tardó demasiado en responder.';
  if (err?.message === 'Network Error') return 'No se pudo conectar con la API. ¿Está encendida y VITE_API_URL es correcta?';
  return err?.message || 'Error desconocido.';
};
 
// ---------------------------------------------------------------- auth
export const login = (email, password) => api.post('/auth/login', { email, password }).then(r => r.data);
export const register = (payload) => api.post('/auth/register', payload).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/password', { currentPassword, newPassword });
 
// ---------------------------------------------------------------- usuarios (admin)
export const getUsers = (role) => api.get('/users', { params: { role } }).then(r => r.data);
export const createUser = (payload) => api.post('/users', payload).then(r => r.data);
export const setUserActive = (id, isActive) => api.put(`/users/${id}/active`, { isActive });
export const resetUserPassword = (id, newPassword) => api.put(`/users/${id}/password`, { newPassword });
 
// ---------------------------------------------------------------- repartidores
export const getDrivers = (status) => api.get('/drivers', { params: { status } }).then(r => r.data);
export const getMyDriver = () => api.get('/drivers/me').then(r => r.data);
export const createDriver = (payload) => api.post('/drivers', payload).then(r => r.data);
export const updateDriverLocation = (id, payload) => api.put(`/drivers/${id}/location`, payload);
export const updateDriverStatus = (id, status) => api.put(`/drivers/${id}/status`, { status });
 
// ---------------------------------------------------------------- pedidos
export const getOrders = (status) => api.get('/orders', { params: { status } }).then(r => r.data);
export const getMyOrders = () => api.get('/orders/mine').then(r => r.data);
export const createOrder = (payload) => api.post('/orders', payload).then(r => r.data);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
 
// ---------------------------------------------------------------- asignaciones
export const getAssignments = (status) => api.get('/assignments', { params: { status } }).then(r => r.data);
export const getMyAssignments = () => api.get('/assignments/mine').then(r => r.data);
export const optimizeAssignments = () => api.post('/assignments/optimize').then(r => r.data);
export const previewAssignments = () => api.get('/assignments/preview').then(r => r.data);
export const completeAssignment = (id) => api.put(`/assignments/${id}/complete`);
export const cancelAssignment = (id) => api.put(`/assignments/${id}/cancel`);
 
// ---------------------------------------------------------------- geocodificación
// OpenStreetMap Nominatim (sin API key). Si el texto no menciona el país, se agrega
// uno por defecto: sin ese contexto, nombres como "Sumpango" suelen devolver vacío.
const DEFAULT_GEOCODE_CONTEXT = 'Guatemala';
 
export const geocodeAddress = async (address) => {
  const query = /guatemala/i.test(address) ? address : `${address}, ${DEFAULT_GEOCODE_CONTEXT}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`No se encontró la dirección: "${query}". Intenta ser más específico (ej. agrega zona, colonia o ciudad).`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
};
 
// Nombre aproximado de un punto del mapa. Es opcional: si falla, se usa un texto genérico.
export const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  const data = await res.json();
  return data.display_name || null;
};