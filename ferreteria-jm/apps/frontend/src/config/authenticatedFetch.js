import { API_BASE_URL } from './appConfig';

const CSRF_URL = `${API_BASE_URL}/api/csrf.php`;
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let csrfToken = null;
let csrfRequest = null;

async function requestCsrfToken() {
  const response = await fetch(CSRF_URL, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || typeof data.csrf_token !== 'string' || !data.csrf_token) {
    const error = new Error(data.message || 'No se pudo obtener el token CSRF.');
    error.status = response.status;
    throw error;
  }

  csrfToken = data.csrf_token;
  return csrfToken;
}

async function getCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  if (!csrfRequest) {
    csrfRequest = requestCsrfToken().finally(() => {
      csrfRequest = null;
    });
  }

  return csrfRequest;
}

export function clearCsrfToken() {
  csrfToken = null;
  csrfRequest = null;
}

export async function authenticatedFetch(input, init = {}) {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});

  if (MUTATION_METHODS.has(method)) {
    headers.set('X-CSRF-Token', await getCsrfToken());
  }

  return fetch(input, {
    ...init,
    method,
    credentials: 'include',
    headers,
  });
}
