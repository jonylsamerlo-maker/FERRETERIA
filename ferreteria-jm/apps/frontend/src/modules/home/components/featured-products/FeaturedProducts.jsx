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
  const carouselRef = useRef(null);

  const ofertas = products.filter(
    (product) => product.categoria?.trim().toLowerCase() === "ofertas especiales"
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
    <section className="featured-products">

      <h2 className="featured-products__title">
        Ofertas especiales
      </h2>

      {loading && (
        <p className="featured-products__status">
          Cargando ofertas...
        </p>
      )}

      {!loading && error && (
        <p className="featured-products__status featured-products__status--error">
          {error}
        </p>
      )}

      {!loading && !error && ofertas.length === 0 && (
        <p className="featured-products__status">
          No hay ofertas especiales disponibles.
        </p>
      )}

      {!loading && !error && ofertas.length > 0 && (
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

            {ofertas.map((product) => (
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
