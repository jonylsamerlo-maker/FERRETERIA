const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LONGITUD_MAXIMA_SLUG = 191;

export function esSlugProductoValido(slug) {
  return (
    typeof slug === "string" &&
    slug.length > 0 &&
    slug.length <= LONGITUD_MAXIMA_SLUG &&
    PATRON_SLUG.test(slug)
  );
}

export async function obtenerProductoPublicoPorSlug(slug) {
  if (!esSlugProductoValido(slug)) {
    return null;
  }

  const apiBaseUrl =
    import.meta.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    "http://backend";

  let endpoint;

  try {
    endpoint = new URL("/api/productos.php", `${apiBaseUrl.replace(/\/+$/, "")}/`);
  } catch (error) {
    console.error("La URL interna de productos no es válida.", error);
    throw new Error("No se pudo consultar el producto.");
  }

  endpoint.searchParams.set("slug", encodeURIComponent(slug));

  let response;

  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error("Falló la consulta interna del producto.", error);
    throw new Error("No se pudo consultar el producto.");
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    console.error(
      `El backend respondió ${response.status} al consultar un producto.`
    );
    throw new Error("No se pudo consultar el producto.");
  }

  try {
    const producto = await response.json();

    if (!producto || typeof producto !== "object" || Array.isArray(producto)) {
      throw new TypeError("La respuesta no contiene un producto válido.");
    }

    return producto;
  } catch (error) {
    console.error("El backend devolvió un producto inválido.", error);
    throw new Error("No se pudo consultar el producto.");
  }
}

export async function obtenerProductosPublicos() {
  const apiBaseUrl =
    import.meta.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    "http://backend";

  let endpoint;

  try {
    endpoint = new URL("/api/productos.php", `${apiBaseUrl.replace(/\/+$/, "")}/`);
  } catch (error) {
    console.error("La URL interna de productos no es válida.", error);
    throw new Error("No se pudo consultar el catálogo.");
  }

  endpoint.searchParams.set("scope", "public");

  let response;

  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    console.error("Falló la consulta interna del catálogo público.", error);
    throw new Error("No se pudo consultar el catálogo.");
  }

  if (!response.ok) {
    console.error(
      `El backend respondió ${response.status} al consultar el catálogo público.`
    );
    throw new Error("No se pudo consultar el catálogo.");
  }

  try {
    const productos = await response.json();

    if (!Array.isArray(productos)) {
      throw new TypeError("La respuesta no contiene un listado válido.");
    }

    return productos;
  } catch (error) {
    console.error("El backend devolvió un catálogo público inválido.", error);
    throw new Error("No se pudo consultar el catálogo.");
  }
}
