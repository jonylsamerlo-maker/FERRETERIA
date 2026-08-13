import { API_BASE_URL } from "./appConfig";
import { authenticatedFetch } from "./authenticatedFetch";

const API_URL = `${API_BASE_URL}/api/feature-flags.php`;

async function handleResponse(response) {
  const texto = await response.text();
  const data = texto ? JSON.parse(texto) : {};

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || "No se pudo procesar la configuración de funciones"
    );
  }

  return data;
}

export async function obtenerFeatureFlags() {
  const response = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return handleResponse(response);
}

export async function actualizarFeatureFlag(clave, habilitado) {
  const response = await authenticatedFetch(API_URL, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clave,
      habilitado,
    }),
  });

  return handleResponse(response);
}
