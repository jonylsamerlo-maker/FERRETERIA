import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/producto-imagenes.php`;

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
        'Ocurrió un error al procesar las imágenes del producto'
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getProductoImagenes(productoId) {
  const response = await fetch(
    `${API_URL}?producto_id=${encodeURIComponent(productoId)}`,
    {
      cache: 'no-store',
      credentials: 'include',
    }
  );

  return handleResponse(response);
}

export async function agregarProductoImagen(productoId, ruta) {
  const response = await fetch(API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ producto_id: productoId, ruta }),
  });

  return handleResponse(response);
}

export async function marcarImagenPrincipal(productoId, imagenId) {
  const response = await fetch(API_URL, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      producto_id: productoId,
      imagen_id: imagenId,
    }),
  });

  return handleResponse(response);
}

export async function eliminarProductoImagen(productoId, imagenId) {
  const response = await fetch(
    `${API_URL}?producto_id=${encodeURIComponent(productoId)}&imagen_id=${encodeURIComponent(imagenId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  return handleResponse(response);
}
