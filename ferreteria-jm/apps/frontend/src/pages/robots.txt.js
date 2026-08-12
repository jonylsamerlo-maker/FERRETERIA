export const prerender = false;

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

export function GET() {
  const siteUrl = obtenerSiteUrl();
  const lineas = [
    "User-agent: *",
    "Allow: /",
    "",
    "Disallow: /login",
    "Disallow: /dashboard",
    "Disallow: /productos",
    "Disallow: /categorias",
    "Disallow: /carrito",
  ];

  if (siteUrl) {
    lineas.push("", `Sitemap: ${siteUrl}/sitemap.xml`);
  } else {
    console.error("SITE_URL no está configurada con una URL pública válida.");
  }

  return new Response(`${lineas.join("\n")}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
