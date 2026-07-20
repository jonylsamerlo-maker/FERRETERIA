import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/productos.php`;
const UPLOAD_URL = `${API_BASE_URL}/api/upload.php`;

async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || 'Ocurrió un error al procesar el producto');
  }

  return data;
}

export async function getProductos() {
  const response = await fetch(API_URL);
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
