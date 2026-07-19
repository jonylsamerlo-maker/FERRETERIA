import { useEffect, useState } from "react";
import "./Carousel.css";

function Carousel({ slides = [] }) {
  const carouselSlides =
    slides.length > 0
      ? slides
      : [
          {
            id: "fallback-1",
            imagenUrl: "http://via.placeholder.com/800x500?text=Herramientas",
            titulo: "Herramientas destacadas",
            descripcion: "Enseguida vas a ver las imágenes reales del carrusel.",
            categoria: "",
          },
        ];

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
      <div className="ferreteria-carousel__viewport">
        <img
          key={activeSlide.id}
          className="ferreteria-carousel__image"
          src={activeSlide.imagenUrl}
          alt={activeSlide.titulo}
        />

        <div
          key={`${activeSlide.id}-overlay`}
          className="ferreteria-carousel__overlay"
        >
          {activeTag && (
            <span className="ferreteria-carousel__tag">
              {activeTag}
            </span>
          )}

          <h3 className="ferreteria-carousel__title">
            {activeSlide.titulo}
          </h3>

          <p className="ferreteria-carousel__description">
            {activeSlide.descripcion}
          </p>
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

      {carouselSlides.length > 1 && (
        <div className="ferreteria-carousel__dots">
          {carouselSlides.map((slide, index) => (
            <button
              key={slide.id}
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
