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
import {
  actualizarFeatureFlag,
  obtenerFeatureFlags,
} from "../../../config/featureFlagsApi";
import { descargarProductosCsv } from "../../../config/exportacionesApi";
import { getCategorias } from "../../categorias/services/categoriaApi";
import { getProductos } from "../../productos/services/productoApi";
import "./Dashboard.css";

const UMBRAL_STOCK_BAJO = 5;
const FEATURE_FLAGS_INICIALES = {
  exportar_excel: false,
  exportar_pdf: false,
};

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
  const [featureFlags, setFeatureFlags] = useState(FEATURE_FLAGS_INICIALES);
  const [guardandoFlag, setGuardandoFlag] = useState("");
  const [mensajeFlags, setMensajeFlags] = useState("");
  const [errorFlags, setErrorFlags] = useState("");
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [mensajeExportacion, setMensajeExportacion] = useState("");
  const [errorExportacion, setErrorExportacion] = useState("");

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

          const [productosData, categoriasData, featureFlagsData] = await Promise.all([
            getProductos(),
            getCategorias(),
            obtenerFeatureFlags(),
          ]);

          setProductos(Array.isArray(productosData) ? productosData : []);
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
          setFeatureFlags({
            exportar_excel: Boolean(featureFlagsData.exportar_excel),
            exportar_pdf: Boolean(featureFlagsData.exportar_pdf),
          });
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

  const configuracionesFunciones = [
    {
      clave: "exportar_excel",
      nombre: "Exportar a Excel",
      descripcion:
        "Permite descargar el inventario en un formato compatible con Excel.",
    },
    {
      clave: "exportar_pdf",
      nombre: "Exportar a PDF",
      descripcion: "Permite generar un informe imprimible del inventario.",
    },
  ];

  const handleCambiarFeatureFlag = async (clave) => {
    if (guardandoFlag) {
      return;
    }

    const estadoActual = Boolean(featureFlags[clave]);
    const nuevoEstado = !estadoActual;

    try {
      setGuardandoFlag(clave);
      setMensajeFlags("");
      setErrorFlags("");

      await actualizarFeatureFlag(clave, nuevoEstado);

      setFeatureFlags((flagsActuales) => ({
        ...flagsActuales,
        [clave]: nuevoEstado,
      }));

      setMensajeFlags("Configuración actualizada correctamente.");
    } catch (err) {
      setErrorFlags(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la configuración."
      );
    } finally {
      setGuardandoFlag("");
    }
  };

  const handleExportarExcel = async () => {
    if (!featureFlags.exportar_excel || descargandoExcel) {
      return;
    }

    try {
      setDescargandoExcel(true);
      setMensajeExportacion("");
      setErrorExportacion("");

      const { blob, filename } = await descargarProductosCsv();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = filename;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);

      setMensajeExportacion("Inventario descargado correctamente.");
    } catch (err) {
      setErrorExportacion(
        err instanceof Error
          ? err.message
          : "No se pudo descargar el inventario."
      );
    } finally {
      setDescargandoExcel(false);
    }
  };

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

                <button
                  className="dashboard__quick-action"
                  type="button"
                  onClick={handleExportarExcel}
                  disabled={!featureFlags.exportar_excel || descargandoExcel}
                >
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <FileSpreadsheet size={22} />
                  </span>
                  <span>
                    <strong>Exportar Excel</strong>
                    <small>
                      {descargandoExcel
                        ? "Descargando..."
                        : featureFlags.exportar_excel
                          ? "Descargar inventario CSV"
                          : "Desactivado"}
                    </small>
                  </span>
                </button>

                <button className="dashboard__quick-action" type="button" disabled>
                  <span className="dashboard__quick-icon" aria-hidden="true">
                    <FileDown size={22} />
                  </span>
                  <span>
                    <strong>Exportar PDF</strong>
                    <small>
                      {featureFlags.exportar_pdf
                        ? "Flag activo, implementación pendiente"
                        : "Próximamente"}
                    </small>
                  </span>
                </button>
              </div>

              {mensajeExportacion && (
                <p className="dashboard__export-message" role="status">
                  {mensajeExportacion}
                </p>
              )}

              {errorExportacion && (
                <p
                  className="dashboard__export-message dashboard__export-message--error"
                  role="alert"
                >
                  {errorExportacion}
                </p>
              )}
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
              className="dashboard__section dashboard__feature-flags"
              aria-labelledby="feature-flags-title"
            >
              <div className="dashboard__section-header">
                <div>
                  <p className="dashboard__section-kicker">Configuración</p>
                  <h2 id="feature-flags-title">Funciones disponibles</h2>
                </div>
              </div>

              <div className="dashboard__feature-list">
                {configuracionesFunciones.map((featureFlag) => {
                  const estaActivo = Boolean(featureFlags[featureFlag.clave]);
                  const estaGuardando = guardandoFlag === featureFlag.clave;

                  return (
                    <article
                      className="dashboard__feature-item"
                      key={featureFlag.clave}
                    >
                      <div className="dashboard__feature-copy">
                        <h3>{featureFlag.nombre}</h3>
                        <p>{featureFlag.descripcion}</p>
                        <span className="dashboard__feature-status">
                          {estaGuardando
                            ? "Guardando..."
                            : estaActivo
                              ? "Activa"
                              : "Desactivada"}
                        </span>
                      </div>

                      <button
                        className="dashboard__switch"
                        type="button"
                        role="switch"
                        aria-checked={estaActivo}
                        aria-label={`${featureFlag.nombre}: ${
                          estaActivo ? "activa" : "desactivada"
                        }`}
                        disabled={Boolean(guardandoFlag)}
                        onClick={() =>
                          handleCambiarFeatureFlag(featureFlag.clave)
                        }
                      >
                        <span aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>

              {mensajeFlags && (
                <p className="dashboard__flag-message" role="status">
                  {mensajeFlags}
                </p>
              )}

              {errorFlags && (
                <p
                  className="dashboard__flag-message dashboard__flag-message--error"
                  role="alert"
                >
                  {errorFlags}
                </p>
              )}
            </section>

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
