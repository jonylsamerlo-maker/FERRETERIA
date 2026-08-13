import { API_BASE_URL } from "../../../config/appConfig";
import {
  authenticatedFetch,
  clearCsrfToken,
} from "../../../config/authenticatedFetch";

const API_URL = `${API_BASE_URL}/api/login.php`;

export async function loginUsuario(datos) {
  clearCsrfToken();

  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  return response.json();
}

export async function obtenerSesionUsuario() {
  const response = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
}

export async function logoutUsuario() {
  try {
    const response = await authenticatedFetch(API_URL, {
      method: "DELETE",
    });

    return response.json();
  } finally {
    clearCsrfToken();
  }
}
