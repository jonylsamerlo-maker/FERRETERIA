import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../../../../config/appConfig";
import { agregarAlCarrito } from "../../../../services/cartStorage";
import { getProductos } from "../../../productos/services/productoApi";
import ChatBot from "../../../chatbot/components/ChatBot.jsx";
import "./FeaturedProducts.css";
import ProductCard from "../product-card/ProductCard.index";

function obtenerProductos(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function resolverImagen(imagen) {
  if (!imagen) {
    return "";
  }

  if (imagen.startsWith("http")) {
    return imagen;
  }

  return `${API_BASE_URL}/${imagen}`;
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const carouselRef = useRef(null);
  const busquedaRef = useRef(null);

  const productosGenerales = useMemo(
    () =>
      products.filter((product) =>
        categoriaSeleccionada
          ? normalizarTexto(product.categoria) ===
            normalizarTexto(categoriaSeleccionada)
          : normalizarTexto(product.categoria) !== "ofertas especiales"
      ),
    [products, categoriaSeleccionada]
  );
  const busquedaNormalizada = normalizarTexto(busqueda);
  const productosFiltrados = useMemo(() => {
    if (!busquedaNormalizada) {
      return productosGenerales;
    }

    return productosGenerales.filter((product) => {
      const campos = [
        product.nombre,
        product.descripcion,
        product.categoria,
        product.codigo,
      ];

      return campos.some((campo) =>
        normalizarTexto(campo).includes(busquedaNormalizada)
      );
    });
  }, [productosGenerales, busquedaNormalizada]);
  const textoResultados = `${productosFiltrados.length} ${
    productosFiltrados.length === 1
      ? "producto encontrado"
      : "productos encontrados"
  }`;

  const moverCarousel = (direction) => {
    if (!carouselRef.current) {
      return;
    }

    carouselRef.current.scrollBy({
      left: direction * carouselRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  const handleAgregarDesdeChatbot = (producto) =>
    agregarAlCarrito({
      id: producto.producto_id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      imagen: resolverImagen(producto.imagen),
      stock: Number(producto.stock) || 0,
    });

  const handleLimpiarBusqueda = () => {
    setBusqueda("");
    window.setTimeout(() => {
      busquedaRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategoriaSeleccionada(params.get("categoria") || "");
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductos();

        setProducts(obtenerProductos(data));
      } catch (err) {
        setError(err.message || "No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  return (
    <section className="featured-products" id="productos">
      <ChatBot
        productos={products}
        addToCart={handleAgregarDesdeChatbot}
      />

      <h2 className="featured-products__title">
        {categoriaSeleccionada
          ? `Productos de ${categoriaSeleccionada}`
          : "Productos disponibles"}
      </h2>

      {!loading && !error && products.length > 0 && (
        <div className="featured-products__search">
          <label
            className="featured-products__search-label"
            htmlFor="home-busqueda-productos"
          >
            Encontrá lo que necesitás
          </label>

          <div className="featured-products__search-row">
            <input
              id="home-busqueda-productos"
              className="featured-products__search-input"
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por nombre, código o categoría..."
              ref={busquedaRef}
              autoComplete="off"
            />

            <button
              className="featured-products__search-clear"
              type="button"
              onClick={handleLimpiarBusqueda}
              disabled={!busqueda}
              aria-label="Limpiar búsqueda de productos"
            >
              Limpiar
            </button>
          </div>

          <p
            className="featured-products__search-count"
            role="status"
            aria-live="polite"
          >
            {textoResultados}
          </p>
        </div>
      )}

      {loading && (
        <p className="featured-products__status">
          Cargando productos...
        </p>
      )}

      {!loading && error && (
        <p className="featured-products__status featured-products__status--error">
          {error}
        </p>
      )}

      {!loading && !error && productosGenerales.length === 0 && (
        <p className="featured-products__status">
          {categoriaSeleccionada
            ? "No hay productos disponibles para esta categoría."
            : "No hay productos disponibles."}
        </p>
      )}

      {!loading &&
        !error &&
        productosGenerales.length > 0 &&
        productosFiltrados.length === 0 && (
          <p className="featured-products__status">
            No encontramos productos para tu búsqueda. Probá con otro nombre o categoría.
          </p>
        )}

      {!loading && !error && productosFiltrados.length > 0 && (
        <div className="featured-products__carousel">
          <button
            type="button"
            className="featured-products__control featured-products__control--prev"
            aria-label="Anterior"
            onClick={() => moverCarousel(-1)}
          >
            Anterior
          </button>

          <div className="featured-products__grid" ref={carouselRef}>

            {productosFiltrados.map((product) => (
              <div className="featured-products__item" key={product.producto_id}>
                <ProductCard
                  id={product.producto_id}
                  image={resolverImagen(product.imagen)}
                  title={product.nombre}
                  description={product.descripcion}
                  price={product.precio}
                  stock={product.stock}
                  category={product.categoria}
                />
              </div>
            ))}

          </div>

          <button
            type="button"
            className="featured-products__control featured-products__control--next"
            aria-label="Siguiente"
            onClick={() => moverCarousel(1)}
          >
            Siguiente
          </button>
        </div>
      )}

    </section>
  );
}

export default FeaturedProducts;
