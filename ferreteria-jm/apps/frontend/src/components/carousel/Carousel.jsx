import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/appConfig";
import { getProductos } from "../../modules/productos/services/productoApi";
import "./Carousel.css";

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

function Carousel() {
  const [carouselSlides, setCarouselSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);

  const safeIndex =
    activeIndex >= carouselSlides.length ? 0 : activeIndex;

  const activeSlide = carouselSlides[safeIndex];

  const activeTag =
    activeSlide?.categoria &&
    activeSlide.categoria.toLowerCase() !== "carousel"
      ? activeSlide.categoria
      : "";

  useEffect(() => {
    const cargarOfertas = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProductos();
        const productos = obtenerProductos(data);

        const ofertas = productos.filter(
          (producto) =>
            producto.categoria?.trim().toLowerCase() === "ofertas especiales"
        );

        setCarouselSlides(ofertas);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las ofertas.");
      } finally {
        setLoading(false);
      }
    };

    cargarOfertas();
  }, []);

  useEffect(() => {
    if (activeIndex >= carouselSlides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, carouselSlides.length]);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;

    const intervalId = setInterval(() => {
      setActiveIndex((current) =>
        current === carouselSlides.length - 1 ? 0 : current + 1
      );
    }, 4500);

    return () => clearInterval(intervalId);
  }, [carouselSlides.length]);

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? carouselSlides.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === carouselSlides.length - 1 ? 0 : current + 1
    );
  };

  return (
    <section className="ferreteria-carousel">
      {loading ? (
        <div className="ferreteria-carousel__status">
          Cargando ofertas...
        </div>
      ) : error ? (
        <div className="ferreteria-carousel__status ferreteria-carousel__status--error">
          {error}
        </div>
      ) : carouselSlides.length === 0 ? (
        <div className="ferreteria-carousel__status">
          No hay ofertas especiales disponibles.
        </div>
      ) : (
        <div className="ferreteria-carousel__viewport">
          <div className="ferreteria-carousel__image-frame">
            <img
              key={activeSlide.producto_id}
              className="ferreteria-carousel__image"
              src={resolverImagen(activeSlide.imagen)}
              alt={activeSlide.nombre}
            />
          </div>

          <div
            key={`${activeSlide.producto_id}-overlay`}
            className="ferreteria-carousel__overlay"
          >
            {activeTag && (
              <span className="ferreteria-carousel__tag">
                {activeTag}
              </span>
            )}

            <h3 className="ferreteria-carousel__title">
              {activeSlide.nombre}
            </h3>

            {activeSlide.descripcion && (
              <p className="ferreteria-carousel__description">
                {activeSlide.descripcion}
              </p>
            )}

            <div className="ferreteria-carousel__details">
              <span className="ferreteria-carousel__price">
                ${activeSlide.precio}
              </span>

              <span className="ferreteria-carousel__stock">
                Stock: {activeSlide.stock}
              </span>
            </div>
          </div>

          {carouselSlides.length > 1 && (
            <>
              <button
                type="button"
                className="ferreteria-carousel__control ferreteria-carousel__control--prev"
                onClick={showPrevious}
                aria-label="Slide anterior"
              >
                ‹
              </button>

              <button
                type="button"
                className="ferreteria-carousel__control ferreteria-carousel__control--next"
                onClick={showNext}
                aria-label="Siguiente slide"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}

      {!loading && !error && carouselSlides.length > 1 && (
        <div className="ferreteria-carousel__dots">
          {carouselSlides.map((slide, index) => (
            <button
              key={slide.producto_id}
              type="button"
              className={`ferreteria-carousel__dot ${
                index === safeIndex
                  ? "ferreteria-carousel__dot--active"
                  : ""
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default Carousel;
