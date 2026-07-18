import { API_BASE_URL } from '../../../config/appConfig';

const API_URL = `${API_BASE_URL}/api/categorias.php`;

export async function getCategorias() {
  const response = await fetch(API_URL);
  return response.json();
}
