import { useEffect, useState } from "react";
import "./Dashboard.css";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");

    if (!usuarioGuardado) {
      window.location.href = "/login";
      return;
    }

    try {
      const usuarioParseado = JSON.parse(usuarioGuardado);

      if (!usuarioParseado) {
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

          <a className="dashboard__nav-link dashboard__nav-link--secondary" href="/">
            Volver al inicio
          </a>
        </aside>

        <div className="dashboard__card">
          <div className="dashboard__mark" aria-hidden="true" />

          <h1 id="dashboard-title" className="dashboard__title">
            Panel de Administración
          </h1>

          <p className="dashboard__welcome">Bienvenido, {usuario.nombre}</p>

          <button
            className="dashboard__logout"
            type="button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}
