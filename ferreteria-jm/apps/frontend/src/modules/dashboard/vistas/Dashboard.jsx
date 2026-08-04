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
  Settings,
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
  const [seccionActiva, setSeccionActiva] = useState("inicio");
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

        if (!["ADMIN", "EMPLEADO"].includes(rol)) {
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

          const consultas = [
            getProductos(),
            getCategorias(),
          ];

          if (rol === "ADMIN") {
            consultas.push(obtenerFeatureFlags());
          }

          const [productosData, categoriasData, featureFlagsData] = await Promise.all(
            consultas
          );

          setProductos(Array.isArray(productosData) ? productosData : []);
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
          setFeatureFlags({
            exportar_excel: Boolean(featureFlagsData?.exportar_excel),
            exportar_pdf: Boolean(featureFlagsData?.exportar_pdf),
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
  const esAdmin = usuario?.rol?.trim().toUpperCase() === "ADMIN";
  const seccionesMenu = [
    {
      id: "inicio",
      nombre: "Inicio",
      icono: Home,
    },
    {
      id: "productos",
      nombre: "Productos",
      icono: PackagePlus,
    },
    {
      id: "categorias",
      nombre: "Categorías",
      icono: FolderTree,
    },
    {
      id: "exportaciones",
      nombre: "Exportaciones",
      icono: FileSpreadsheet,
      soloAdmin: true,
    },
    {
      id: "configuracion",
      nombre: "Configuración",
      icono: Settings,
      soloAdmin: true,
    },
    {
      id: "ayuda",
      nombre: "Ayuda",
      icono: HelpCircle,
    },
  ].filter((seccion) => esAdmin || !seccion.soloAdmin);

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

  const renderTarjetasResumen = () => (
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
  );

  const renderActividadReciente = () => (
    <section
      className="dashboard__section dashboard__section--plain"
      aria-labelledby="recent-title"
    >
      <div className="dashboard__section-header">
        <div>
          <p className="dashboard__section-kicker">Inventario</p>
          <h3 id="recent-title">Actividad reciente</h3>
        </div>
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
  );

  const renderInicio = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Resumen</p>
        <h2>Inicio</h2>
        <p>
          Bienvenido, {usuario.nombre}. Estos son los datos principales del
          panel.
        </p>
        <p className="dashboard__date">
          <CalendarDays aria-hidden="true" size={18} />
          {fechaActual}
        </p>
      </div>

      {renderTarjetasResumen()}
    </div>
  );

  const renderProductos = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Catálogo</p>
        <h2>Productos</h2>
        <p>
          Administrá el catálogo, precios, stock e imágenes de los productos.
        </p>
      </div>

      <div className="dashboard__info-grid">
        <article className="dashboard__info-card">
          <p>Total de productos</p>
          <strong>{cargandoDatos ? "..." : productos.length}</strong>
        </article>

        <article className="dashboard__info-card">
          <p>Stock bajo</p>
          <strong>{cargandoDatos ? "..." : productosStockBajo.length}</strong>
        </article>
      </div>

      <a className="dashboard__primary-link" href="/productos">
        Administrar productos
        <ArrowUpRight aria-hidden="true" size={18} />
      </a>

      {renderActividadReciente()}
    </div>
  );

  const renderCategorias = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Organización</p>
        <h2>Categorías</h2>
        <p>
          Organizá los productos en categorías para facilitar su administración.
        </p>
      </div>

      <div className="dashboard__info-grid">
        <article className="dashboard__info-card">
          <p>Total de categorías</p>
          <strong>{cargandoDatos ? "..." : categorias.length}</strong>
        </article>
      </div>

      <a className="dashboard__primary-link" href="/categorias">
        Administrar categorías
        <ArrowUpRight aria-hidden="true" size={18} />
      </a>
    </div>
  );

  const renderExportaciones = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Descargas</p>
        <h2>Exportaciones</h2>
        <p>
          Descargá herramientas disponibles para trabajar con el inventario.
        </p>
      </div>

      <div className="dashboard__quick-grid">
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
    </div>
  );

  const renderConfiguracion = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Configuración</p>
        <h2>Configuración de funciones</h2>
        <p>Activá o desactivá funciones disponibles del panel.</p>
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
                onClick={() => handleCambiarFeatureFlag(featureFlag.clave)}
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
    </div>
  );

  const renderAyuda = () => (
    <div className="dashboard__workspace-stack">
      <div className="dashboard__workspace-header">
        <p className="dashboard__section-kicker">Buenas prácticas</p>
        <h2>Ayuda</h2>
      </div>

      <section className="dashboard__section dashboard__section--plain">
        <h3>Consejos rápidos</h3>
        <ul className="dashboard__tips-list">
          <li>Mantener actualizado el stock.</li>
          <li>Verificar productos sin stock.</li>
          <li>Exportar inventario periódicamente.</li>
        </ul>
      </section>

      <section className="dashboard__section dashboard__section--plain">
        <div className="dashboard__section-header">
          <div>
            <p className="dashboard__section-kicker">Guía</p>
            <h3>Guía de imágenes</h3>
          </div>
        </div>

        <div id="dashboard-ayuda" className="dashboard__ayuda">
          <article className="dashboard__ayuda-bloque">
            <h4>Medidas recomendadas</h4>
            <ul>
              <li>Resolución: 800 x 600 píxeles.</li>
              <li>Formato recomendado: WEBP.</li>
              <li>Peso recomendado: menos de 500 KB.</li>
            </ul>
          </article>

          <article className="dashboard__ayuda-bloque">
            <h4>Imagen de producto</h4>
            <ul>
              <li>Mostrar el producto completo.</li>
              <li>Usar buena iluminación.</li>
              <li>Evitar textos o marcas de agua.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );

  const renderSeccionActiva = () => {
    if (seccionActiva === "productos") {
      return renderProductos();
    }

    if (seccionActiva === "categorias") {
      return renderCategorias();
    }

    if (seccionActiva === "exportaciones" && esAdmin) {
      return renderExportaciones();
    }

    if (seccionActiva === "configuracion" && esAdmin) {
      return renderConfiguracion();
    }

    if (seccionActiva === "ayuda") {
      return renderAyuda();
    }

    return renderInicio();
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

        <section className="dashboard__workspace">
          <nav
            className="dashboard__sidebar"
            aria-label="Secciones del panel"
          >
            {seccionesMenu.map((seccion) => {
              const Icono = seccion.icono;
              const estaActiva = seccionActiva === seccion.id;

              return (
                <button
                  className={
                    estaActiva
                      ? "dashboard__nav-button dashboard__nav-button--active"
                      : "dashboard__nav-button"
                  }
                  type="button"
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  aria-current={estaActiva ? "page" : undefined}
                  aria-pressed={estaActiva}
                >
                  <Icono aria-hidden="true" size={20} />
                  <span>{seccion.nombre}</span>
                </button>
              );
            })}
          </nav>

          <section
            className="dashboard__workspace-panel"
            aria-live="polite"
          >
            {renderSeccionActiva()}
          </section>
        </section>
      </section>
    </main>
  );
}
