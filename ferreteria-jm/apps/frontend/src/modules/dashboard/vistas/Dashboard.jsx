import { useEffect, useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    try {
      const usuarioGuardado = localStorage.getItem("usuario");

      if (!usuarioGuardado) {
        window.location.href = "/login";
        return;
      }

      const usuarioParseado = JSON.parse(usuarioGuardado);
      const rol = usuarioParseado?.rol?.trim().toUpperCase();

      if (!usuarioParseado || rol !== "ADMIN") {
        window.location.href = "/login";
        return;
      }

      setUsuario(usuarioParseado);
    } catch {
      localStorage.removeItem("usuario");
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (!usuario) {
    return null;
  }

  return (
    <main className="dashboard">
      <section className="dashboard__panel" aria-labelledby="dashboard-title">
        <aside className="dashboard__nav" aria-label="Accesos rápidos">
          <p className="dashboard__nav-title">Accesos rápidos</p>

          <a className="dashboard__nav-link" href="/productos">
            Productos
          </a>

          <a className="dashboard__nav-link" href="/categorias">
            Categorías
          </a>

          <button
            className="dashboard__nav-link dashboard__nav-button"
            type="button"
            aria-expanded={mostrarAyuda}
            aria-controls="dashboard-ayuda"
            onClick={() => setMostrarAyuda((estadoActual) => !estadoActual)}
          >
            {mostrarAyuda ? "Cerrar ayuda" : "Ayuda"}
          </button>

          <a
            className="dashboard__nav-link dashboard__nav-link--secondary"
            href="/"
          >
            Volver al inicio
          </a>
        </aside>

        <div className="dashboard__contenido">
          <div className="dashboard__card">
            <div className="dashboard__mark" aria-hidden="true" />

            <h1 id="dashboard-title" className="dashboard__title">
              Panel de Administración
            </h1>

            <p className="dashboard__welcome">
              Bienvenido, {usuario.nombre}
            </p>

            <button
              className="dashboard__logout"
              type="button"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>

          {mostrarAyuda && (
            <section
              id="dashboard-ayuda"
              className="dashboard__ayuda"
              aria-labelledby="ayuda-title"
            >
              <h2 id="ayuda-title" className="dashboard__ayuda-title">
                Guía para cargar imágenes
              </h2>

              <article className="dashboard__ayuda-bloque">
                <h3>¿Cómo cargar una foto?</h3>

                <ol>
                  <li>Ingresá a la sección Productos.</li>
                  <li>Completá los datos del producto.</li>
                  <li>Presioná el botón para seleccionar una imagen.</li>
                  <li>Revisá la vista previa.</li>
                  <li>Guardá el producto.</li>
                </ol>
              </article>

              <article className="dashboard__ayuda-bloque">
                <h3>Medidas recomendadas</h3>

                <ul>
                  <li>Resolución: 800 × 600 píxeles.</li>
                  <li>Orientación horizontal.</li>
                  <li>Relación de aspecto 4:3.</li>
                  <li>Peso recomendado: menos de 500 KB.</li>
                </ul>
              </article>

              <article className="dashboard__ayuda-bloque">
                <h3>Formatos admitidos</h3>

                <ul>
                  <li>WEBP: formato recomendado.</li>
                  <li>JPG o JPEG.</li>
                  <li>PNG.</li>
                </ul>
              </article>

              <article className="dashboard__ayuda-bloque">
                <h3>Consejos para obtener una buena imagen</h3>

                <ul>
                  <li>Mostrar el producto completo.</li>
                  <li>Usar buena iluminación.</li>
                  <li>Elegir un fondo limpio.</li>
                  <li>Evitar imágenes borrosas o estiradas.</li>
                  <li>No agregar textos ni marcas de agua.</li>
                </ul>
              </article>

              <article className="dashboard__ayuda-bloque">
                <h3>Ejemplo de prompt para generar una imagen</h3>

                <p className="dashboard__prompt">
                  Fotografía profesional de un taladro inalámbrico para una
                  tienda online de ferretería, producto completo y centrado,
                  fondo blanco limpio, iluminación de estudio, sin personas,
                  sin textos, formato horizontal 4:3 y resolución de 800 × 600
                  píxeles.
                </p>
              </article>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}