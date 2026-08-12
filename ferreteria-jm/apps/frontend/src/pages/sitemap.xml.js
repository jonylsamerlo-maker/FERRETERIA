export const prerender = false;

import {
  esSlugProductoValido,
  obtenerProductosPublicos,
} from "../services/productoPublicoServer";

function obtenerSiteUrl() {
  const valor = import.meta.env.SITE_URL || process.env.SITE_URL;

  if (typeof valor !== "string" || valor.trim() === "") {
    return null;
  }

  try {
    const url = new URL(valor.trim());
    const hostname = url.hostname.toLowerCase();

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      hostname === "backend" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return null;
    }

    return url.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function escaparXml(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function crearEntradaUrl(url) {
  return `  <url>\n    <loc>${escaparXml(url)}</loc>\n  </url>`;
}

export async function GET() {
  const siteUrl = obtenerSiteUrl();

  if (!siteUrl) {
    console.error("SITE_URL no está configurada con una URL pública válida.");

    return new Response("No se pudo generar el sitemap.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  let productos;

  try {
    productos = await obtenerProductosPublicos();
  } catch (error) {
    console.error("No se pudo generar el sitemap dinámico.", error);

    return new Response("No se pudo generar el sitemap.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const urls = new Set([`${siteUrl}/`]);

  for (const producto of productos) {
    const slug = producto?.slug;

    if (!esSlugProductoValido(slug)) {
      console.warn("Producto público omitido del sitemap por slug inválido.");
      continue;
    }

    urls.add(`${siteUrl}/producto/${encodeURIComponent(slug)}`);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(urls, crearEntradaUrl),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
