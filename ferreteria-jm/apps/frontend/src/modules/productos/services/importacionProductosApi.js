import { API_BASE_URL } from "../../../config/appConfig";

const API_URL = `${API_BASE_URL}/api/importar-productos.php`;

export class ImportacionProductosError extends Error {
  constructor(message, status, errores = []) {
    super(message);
    this.name = "ImportacionProductosError";
    this.status = status;
    this.errores = errores;
  }
}

export async function importarProductos(productos) {
  const productosPermitidos = productos.map((producto) => ({
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    stock: producto.stock,
    categoria: producto.categoria,
  }));

  const response = await fetch(API_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productos: productosPermitidos }),
  });

  const texto = await response.text();
  let data = {};

  try {
    data = texto ? JSON.parse(texto) : {};
  } catch {
    throw new ImportacionProductosError(
      "El servidor devolvió una respuesta inválida.",
      response.status
    );
  }

  if (!response.ok || data.success === false) {
    throw new ImportacionProductosError(
      data.message || "No se pudieron importar los productos.",
      response.status,
      Array.isArray(data.errores) ? data.errores : []
    );
  }

  return data;
}
