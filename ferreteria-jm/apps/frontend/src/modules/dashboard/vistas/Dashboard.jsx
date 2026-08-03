import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  FolderTree,
  HelpCircle,
  Home,
  LogOut,
  PackagePlus,
  Tags,
} from "lucide-react";
import {
  logoutUsuario,
  obtenerSesionUsuario,
} from "../../auth/services/usuarioApi";
import { getCategorias } from "../../categorias/services/categoriaApi";
import { getProductos } from "../../productos/services/productoApi";
import "./Dashboard.css";

const UMBRAL_STOCK_BAJO = 5;

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function formatearFechaActual() {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState("");

  useEffect(() => {
    const validarSesion = async () => {
      try {
        const respuesta = await obtenerSesionUsuario();

        if (!respuesta.success || !respuesta.usuario) {
          localStorage.removeItem("usuario");
          sessionStorage.removeItem("usuario");
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }

        const rol = respuesta.usuario?.rol?.trim().toUpperCase();

        if (rol !== "ADMIN") {
          localStorage.removeItem("usuario");
          sessionStorage.removeItem("usuario");
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          window.location.href = "/login";
          return;
        }

        localStorage.setItem("usuario", JSON.stringify(respuesta.usuario));
        setUsuario(respuesta.usuario);

        try {
          setCargandoDatos(true);
          setErrorDatos("");

          const [productosData, categoriasData] = await Promise.all([
            getProductos(),
            getCategorias(),
          ]);

          setProductos(Array.isArray(productosData) ? productosData : []);
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (err) {
          setErrorDatos(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los datos del panel"
          );
        } finally {
          setCargandoDatos(false);
        }
      } catch {
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("usuario");
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
      }
    };

    validarSesion();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUsuario();
    } catch {
      // El cierre local se mantiene aunque falle la llamada al backend.
    }

    localStorage.removeItem("usuario");
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const productosStockBajo = productos.filter(
    (producto) => Number(producto.stock) < UMBRAL_STOCK_BAJO
  );
  const productosRecientes = productos.slice(0, 5);
  const fechaActual = formatearFechaActual();

  const tarjetasResumen = [
    {
      titulo: "Productos",
      valor: cargandoDatos ? "..." : productos.length,
      detalle: "Total cargado",
      icono: Boxes,
    },
    {
      titulo: "Categorías",
      valor: cargandoDatos ? "..." : categorias.length,
      detalle: "Rubros disponibles",
      icono: Tags,
    },
    {
      titulo: "Stock bajo",
      valor: cargandoDatos ? "..." : productosStockBajo.length,
      detalle: `Menor a ${UMBRAL_STOCK_BAJO} unidades`,
      icono: AlertTriangle,
    },
  ];

  if (!usuario) {
    return (
      <main className="dashboard">
        <p className="dashboard__loading" role="status">
          Validando sesión...
        </p>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <section className="dashboard__shell" aria-labelledby="dashboard-title">
        <header className="dashboard__hero">
          <div className="dashboard__hero-copy">
            <p className="dashboard__eyebrow">Ferretería JM</p>

            <h1 id="dashboard-title" className="dashboard__title">
              Panel Administrativo
            </h1>

            <p className="dashboard__welcome">
              Bienvenido, {usuario.nombre}
            </p>

            <p className="dashboard__date">
              <CalendarDays aria-hidden="true" size={18} />
              {fechaActual}
            </p>
          </div>

          <div className="dashboard__hero-actions">
            <a className="dashboard__ghost-link" href="/">
              <Home aria-hidden="true" size={18} />
              Inicio
            </a>

            <button
              className="dashboard__logout"
              type="button"
              onClick={handleLogout}
            >
              <LogOut aria-hidden="true" size={18} />
              Cerrar sesión
            </button>
          </div>
        </header>

        {errorDatos && (
          <p className="dashboard__alert" role="alert">
            {errorDatos}
          </p>
        )}

        <section
          className="dashboard__summary"
          aria-label="Resumen administrativo"
        >
          {tarjetasResumen.map((tarjeta) => {
            const Icono = tarjeta.icono;

            return (
              <article className="dashboard__summary-card" key={tarjeta.titulo}>
                <div className="dashboard__summary-icon" aria-hidden="true">
                  <Icono size={24} />
                </div>

                <div>
                  <p className="dashboard__summary-title">{tarjeta.titulo}</p>
                  <p className="dashboard__summary-value">{tarjeta.valor}</p>
                  <p className="dashboard__summary-detail">{tarjeta.detalle}</p>
                </div>
              </article>
            );
          })}
        </section>

        <section className="dashboard__main-grid">
          <div className="dashboard__primary-column">
            <section className="dashboard__section" aria-labelledby="quick-title">
              <div className="dashboard__section-header">
                <div>
                  <p className="dashboard__section-kicker">Trabajo diario</p>
                  <h2 id="quick-title">Accesos rápidos</h2>
                </div>
              </div>

              <div className="dashboard__quick-grid">
                <a className="dashboard__quick-action" href="/productos">
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <PackagePlus size={22} />
                  </span>
                  <span>
                    <strong>Nuevo Producto</strong>
                    <small>Gestionar inventario</small>
                  </span>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>

                <a className="dashboard__quick-action" href="/categorias">
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <FolderTree size={22} />
                  </span>
                  <span>
                    <strong>Nueva Categoría</strong>
                    <small>Organizar rubros</small>
                  </span>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </a>

                <button className="dashboard__quick-action" type="button" disabled>
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <FileSpreadsheet size={22} />
                  </span>
                  <span>
                    <strong>Exportar Excel</strong>
                    <small>Próximamente</small>
                  </span>
                </button>

                <button className="dashboard__quick-action" type="button" disabled>
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <FileDown size={22} />
                  </span>
                  <span>
                    <strong>Exportar PDF</strong>
                    <small>Próximamente</small>
                  </span>
                </button>
              </div>
            </section>

            <section
              className="dashboard__section"
              aria-labelledby="recent-title"
            >
              <div className="dashboard__section-header">
                <div>
                  <p className="dashboard__section-kicker">Inventario</p>
                  <h2 id="recent-title">Actividad reciente</h2>
                </div>

                <a className="dashboard__section-link" href="/productos">
                  Ver productos
                </a>
              </div>

              {cargandoDatos ? (
                <p className="dashboard__empty">Cargando productos...</p>
              ) : productosRecientes.length === 0 ? (
                <p className="dashboard__empty">No hay productos cargados.</p>
              ) : (
                <div className="dashboard__table-wrap">
                  <table className="dashboard__table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                      </tr>
                    </thead>

                    <tbody>
                      {productosRecientes.map((producto) => (
                        <tr key={producto.producto_id}>
                          <td>{producto.nombre}</td>
                          <td>{producto.categoria || "Sin categoría"}</td>
                          <td>{formatearPrecio(producto.precio)}</td>
                          <td>
                            <span
                              className={
                                Number(producto.stock) < UMBRAL_STOCK_BAJO
                                  ? "dashboard__stock dashboard__stock--low"
                                  : "dashboard__stock"
                              }
                            >
                              {producto.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard__side-column">
            <section
              className="dashboard__section dashboard__tips"
              aria-labelledby="tips-title"
            >
              <div className="dashboard__section-header">
                <div>
                  <p className="dashboard__section-kicker">Buenas prácticas</p>
                  <h2 id="tips-title">Consejos rápidos</h2>
                </div>
              </div>

              <ul className="dashboard__tips-list">
                <li>Mantener actualizado el stock.</li>
                <li>Verificar productos sin stock.</li>
                <li>Exportar inventario periódicamente.</li>
              </ul>
            </section>

            <section className="dashboard__section dashboard__help">
              <button
                className="dashboard__help-toggle"
                type="button"
                aria-expanded={mostrarAyuda}
                aria-controls="dashboard-ayuda"
                onClick={() => setMostrarAyuda((estadoActual) => !estadoActual)}
              >
                <HelpCircle aria-hidden="true" size={20} />
                {mostrarAyuda ? "Cerrar ayuda" : "Guía de imágenes"}
              </button>

              {mostrarAyuda && (
                <div id="dashboard-ayuda" className="dashboard__ayuda">
                  <article className="dashboard__ayuda-bloque">
                    <h3>Medidas recomendadas</h3>
                    <ul>
                      <li>Resolución: 800 x 600 píxeles.</li>
                      <li>Formato recomendado: WEBP.</li>
                      <li>Peso recomendado: menos de 500 KB.</li>
                    </ul>
                  </article>

                  <article className="dashboard__ayuda-bloque">
                    <h3>Imagen de producto</h3>
                    <ul>
                      <li>Mostrar el producto completo.</li>
                      <li>Usar buena iluminación.</li>
                      <li>Evitar textos o marcas de agua.</li>
                    </ul>
                  </article>
                </div>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
