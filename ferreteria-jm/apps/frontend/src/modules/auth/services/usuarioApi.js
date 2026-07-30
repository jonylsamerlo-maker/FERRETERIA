import { API_BASE_URL } from "../../../config/appConfig";

const API_URL = `${API_BASE_URL}/api/login.php`;

export async function loginUsuario(datos) {
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
  const response = await fetch(API_URL, {
    method: "DELETE",
    credentials: "include",
  });

  return response.json();
}
