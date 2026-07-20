import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/productos.php`;
const UPLOAD_URL = `${API_BASE_URL}/api/upload.php`;

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');

  let data;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    const texto = await response.text();

    data = {
      mensaje: texto || 'El servidor devolvió una respuesta inválida',
    };
  }

  if (!response.ok) {
    throw new Error(
      data.mensaje || 'Ocurrió un error al procesar el producto'
    );
  }

  return data;
}

export async function getProductos() {
  const response = await fetch(API_URL);

  return handleResponse(response);
}

export async function getProductoPorId(id) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`
  );

  return handleResponse(response);
}

export async function subirImagen(archivo) {
  const formData = new FormData();

  formData.append('imagen', archivo);

  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
}

export async function crearProducto(datos) {
  const response = await fetch(API_URL, {
    method: 'POST',
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    }
  );

  return handleResponse(response);
}

export async function eliminarProducto(id) {
  const response = await fetch(
    `${API_URL}?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    }
  );

  return handleResponse(response);
}