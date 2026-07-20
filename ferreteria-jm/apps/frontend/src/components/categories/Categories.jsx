import { useEffect, useState } from "react";
import { getCategorias } from "../../modules/categorias/services/categoriaApi";
import "./Categories.css";

const iconosPorCategoria = {
  herramientas: "🔨",
  electricidad: "⚡",
  plomeria: "🚿",
  plomería: "🚿",
  pintura: "🎨",
  construccion: "🧱",
  construcción: "🧱",
  jardin: "🌱",
  jardín: "🌱",
};

function obtenerIcono(nombre) {
  return iconosPorCategoria[nombre?.trim().toLowerCase()] || "•";
}

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const categoriasVisibles = categories.filter(
    (category) => category.nombre?.trim().toLowerCase() !== "ofertas especiales"
  );

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getCategorias();

        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };

    cargarCategorias();
  }, []);

  return (
    <section className="categories">

      <div className="categories__container">

        <h2 className="categories__title">
          Explorar categorías
        </h2>

        <p className="categories__subtitle">
          Encontrá rápidamente lo que necesitás.
        </p>

        {loading && (
          <p className="categories__status">
            Cargando categorías...
          </p>
        )}

        {!loading && error && (
          <p className="categories__status categories__status--error">
            {error}
          </p>
        )}

        {!loading && !error && categoriasVisibles.length === 0 && (
          <p className="categories__status">
            No hay categorías disponibles.
          </p>
        )}

        {!loading && !error && categoriasVisibles.length > 0 && (
          <div className="categories__grid">

            {categoriasVisibles.map((category) => (

            <a
              key={category.categoria_id}
              className="categories__card"
              href={`/?categoria=${encodeURIComponent(category.nombre)}#productos`}
            >

              <span className="categories__icon">
                {obtenerIcono(category.nombre)}
              </span>

              <h3 className="categories__card-title">
                {category.nombre}
              </h3>

              {category.descripcion && (
                <p className="categories__description">
                  {category.descripcion}
                </p>
              )}

            </a>

            ))}

          </div>
        )}

      </div>

    </section>
  );
}

export default Categories;
