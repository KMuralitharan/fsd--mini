// API Client Wrapper for EnglishConnect

const BASE_URL = '/api';

export async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('ec_token');

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        localStorage.removeItem('ec_token');
        localStorage.removeItem('ec_user');
        window.dispatchEvent(new Event('auth_change'));
      }
      throw new Error(json.error || `Request failed with status ${res.status}`);
    }

    return json;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}
