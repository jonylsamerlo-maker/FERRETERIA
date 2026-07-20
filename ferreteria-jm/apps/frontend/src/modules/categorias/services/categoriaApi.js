import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/categorias.php`;

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Ocurrió un error al procesar la categoría');
  }

  return data;
}

export async function getCategorias() {
  const response = await fetch(API_URL);
  const data = await handleResponse(response);
  return data.data || [];
}

export async function crearCategoria(categoria) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoria),
  });

  return handleResponse(response);
}

export async function actualizarCategoria(id, categoria) {
  const response = await fetch(`${API_URL}?id=${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoria),
  });

  return handleResponse(response);
}

export async function eliminarCategoria(id) {
  const response = await fetch(`${API_URL}?id=${id}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
}
