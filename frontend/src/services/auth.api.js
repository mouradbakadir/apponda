import { apiClient } from './apiClient.js';

export async function login(email, password) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}