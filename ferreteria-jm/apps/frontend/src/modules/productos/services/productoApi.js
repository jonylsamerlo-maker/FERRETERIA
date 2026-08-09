import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/productos.php`;
const UPLOAD_URL = `${API_BASE_URL}/api/upload.php`;

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const texto = await response.text();

  let data;

  if (contentType?.includes('application/json') && texto) {
    data = JSON.parse(texto);
  } else {
    data = {
      mensaje: texto || 'El servidor devolvió una respuesta inválida',
    };
  }

  if (!response.ok) {
    const error = new Error(
      data.mensaje ||
        data.message ||
        'Ocurrió un error al procesar el producto'
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getProductos() {
  const response = await fetch(API_URL, {
    cache: 'no-store',
    credentials: 'include',
  });

  return handleResponse(response);
}

export async function getProductosPublicos() {
  const response = await fetch(`${API_URL}?scope=public`, {
    cache: 'no-store',
    credentials: 'include',
  });

  return handleResponse(response);
}

export async function getProductosAdmin() {
  const response = await fetch(`${API_URL}?scope=admin`, {
    cache: 'no-store',
    credentials: 'include',
  });

  return handleResponse(response);
}

export async function getProductoPorId(id) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`,
    {
      cache: 'no-store',
      credentials: 'include',
    }
  );

  return handleResponse(response);
}

export async function subirImagen(archivo) {
  const formData = new FormData();

  formData.append('imagen', archivo);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  return handleResponse(response);
}

export async function crearProducto(datos) {
  const response = await fetch(API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  return handleResponse(response);
}

export async function actualizarProducto(id, datos) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    }
  );

  return handleResponse(response);
}

export async function actualizarPublicado(id, publicado) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicado }),
    }
  );

  return handleResponse(response);
}

export async function eliminarProducto(id) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  return handleResponse(response);
}
