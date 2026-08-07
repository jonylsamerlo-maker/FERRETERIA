import { API_BASE_URL } from "./appConfig";

const EXPORTAR_PRODUCTOS_URL = `${API_BASE_URL}/api/exportar-productos.php`;
const EXPORTAR_PRODUCTOS_PDF_URL = `${API_BASE_URL}/api/exportar-productos-pdf.php`;

function obtenerNombreArchivo(contentDisposition) {
  const coincidencia = contentDisposition?.match(/filename="([^"]+)"/);

  return coincidencia?.[1] || "inventario-ferreteria-jm.csv";
}

function obtenerNombreArchivoPdf(contentDisposition) {
  const coincidencia = contentDisposition?.match(/filename="([^"]+)"/);

  return coincidencia?.[1] || "inventario-ferreteria-jm.pdf";
}

export async function descargarProductosCsv() {
  const response = await fetch(EXPORTAR_PRODUCTOS_URL, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const texto = await response.text();
    const data = texto ? JSON.parse(texto) : {};

    throw new Error(data.message || "No se pudo descargar el inventario");
  }

  return {
    blob: await response.blob(),
    filename: obtenerNombreArchivo(response.headers.get("content-disposition")),
  };
}

export async function descargarProductosPdf() {
  const response = await fetch(EXPORTAR_PRODUCTOS_PDF_URL, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    const texto = await response.text();
    const data = texto ? JSON.parse(texto) : {};

    throw new Error(data.message || "No se pudo descargar el inventario PDF");
  }

  return {
    blob: await response.blob(),
    filename: obtenerNombreArchivoPdf(response.headers.get("content-disposition")),
  };
}
