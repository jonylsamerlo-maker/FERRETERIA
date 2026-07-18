import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/productos.php`;

export async function getProductos() {
  const response = await fetch(API_URL);
  return response.json();
}
