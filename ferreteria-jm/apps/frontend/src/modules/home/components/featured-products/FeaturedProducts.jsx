import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../../../../config/appConfig";
import { getProductos } from "../../../productos/services/productoApi";
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

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const carouselRef = useRef(null);

  const productosGenerales = products.filter(
    (product) =>
      categoriaSeleccionada
        ? product.categoria?.trim().toLowerCase() ===
          categoriaSeleccionada.trim().toLowerCase()
        : product.categoria?.trim().toLowerCase() !== "ofertas especiales"
  );

  const moverCarousel = (direction) => {
    if (!carouselRef.current) {
      return;
    }

    carouselRef.current.scrollBy({
      left: direction * carouselRef.current.clientWidth,
      behavior: "smooth",
    });
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

      <h2 className="featured-products__title">
        {categoriaSeleccionada
          ? `Productos de ${categoriaSeleccionada}`
          : "Productos disponibles"}
      </h2>

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

      {!loading && !error && productosGenerales.length > 0 && (
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

            {productosGenerales.map((product) => (
              <div className="featured-products__item" key={product.producto_id}>
                <ProductCard
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
