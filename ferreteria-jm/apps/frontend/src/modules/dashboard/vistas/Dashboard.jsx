import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  FileDown,
  FileSpreadsheet,
  FileUp,
  FolderTree,
  HelpCircle,
  Home,
  Eye,
  EyeOff,
  ImageOff,
  LogOut,
  PackagePlus,
  Percent,
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
import {
  descargarProductosCsv,
  descargarProductosPdf,
} from "../../../config/exportacionesApi";
import { getCategorias } from "../../categorias/services/categoriaApi";
import { importarProductos } from "../../productos/services/importacionProductosApi";
import { getProductosAdmin } from "../../productos/services/productoApi";
import "./Dashboard.css";

const UMBRAL_STOCK_BAJO = 5;
const FEATURE_FLAGS_INICIALES = {
  exportar_excel: false,
  exportar_pdf: false,
  importar_productos: false,
};
const CABECERA_IMPORTACION_PRODUCTOS = [
  "codigo",
  "nombre",
  "descripcion",
  "precio",
  "stock",
  "categoria",
];

function normalizarComparacion(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

function crearFilaCsv(celdas, numeroFila) {
  return {
    numeroFila,
    codigo: celdas[0]?.trim() ?? "",
    nombre: celdas[1]?.trim() ?? "",
    descripcion: celdas[2]?.trim() ?? "",
    precio: celdas[3]?.trim() ?? "",
    stock: celdas[4]?.trim() ?? "",
    categoria: celdas[5]?.trim() ?? "",
  };
}

function parsearCsvPuntoYComa(contenido) {
  const filas = [];
  let fila = [];
  let celda = "";
  let entreComillas = false;
  let numeroFila = 1;

  for (let i = 0; i < contenido.length; i += 1) {
    const caracter = contenido[i];
    const siguiente = contenido[i + 1];

    if (caracter === '"') {
      if (entreComillas && siguiente === '"') {
        celda += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
      continue;
    }

    if (caracter === ";" && !entreComillas) {
      fila.push(celda);
      celda = "";
      continue;
    }

    if ((caracter === "\n" || caracter === "\r") && !entreComillas) {
      if (caracter === "\r" && siguiente === "\n") {
        i += 1;
      }

      fila.push(celda);
      filas.push({ celdas: fila, numeroFila });
      numeroFila += 1;
      fila = [];
      celda = "";
      continue;
    }

    celda += caracter;
  }

  if (entreComillas) {
    throw new Error("El CSV contiene comillas sin cerrar.");
  }

  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push({ celdas: fila, numeroFila });
  }

  return filas.filter(({ celdas }) =>
    celdas.some((valor) => String(valor ?? "").trim() !== "")
  );
}

function validarCabecera(celdas) {
  const cabecera = [...celdas];

  if (cabecera.length > 0) {
    cabecera[0] = cabecera[0].replace(/^\uFEFF/, "");
  }

  const columnas = cabecera.map(normalizarComparacion);
  const columnasValidas =
    columnas.length === CABECERA_IMPORTACION_PRODUCTOS.length &&
    CABECERA_IMPORTACION_PRODUCTOS.every(
      (columna, indice) => columnas[indice] === columna
    );

  return columnasValidas;
}

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

function formatearErrorBackendImportacion(error) {
  const mensaje =
    error instanceof Error
      ? error.message
      : "No se pudieron importar los productos.";
  const errores = Array.isArray(error?.errores) ? error.errores : [];

  if (errores.length === 0) {
    return mensaje;
  }

  const detalles = errores.slice(0, 5).map((errorFila) => {
    const fila = errorFila.fila ? `Fila ${errorFila.fila}` : "Lote";
    const campo = errorFila.campo ? `, ${errorFila.campo}` : "";
    const detalle = errorFila.mensaje || "Dato inválido";

    return `${fila}${campo}: ${detalle}`;
  });
  const restantes = errores.length - detalles.length;

  return [
    mensaje,
    ...detalles,
    restantes > 0 ? `Y ${restantes} error(es) más.` : "",
  ].filter(Boolean).join(" ");
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
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [mensajeExportacion, setMensajeExportacion] = useState("");
  const [errorExportacion, setErrorExportacion] = useState("");
  const [archivoImportacion, setArchivoImportacion] = useState(null);
  const [procesandoImportacion, setProcesandoImportacion] = useState(false);
  const [importandoProductos, setImportandoProductos] = useState(false);
  const [confirmacionImportacionAbierta, setConfirmacionImportacionAbierta] =
    useState(false);
  const [mensajeImportacion, setMensajeImportacion] = useState("");
  const [errorImportacion, setErrorImportacion] = useState("");
  const [filasImportacion, setFilasImportacion] = useState([]);
  const archivoImportacionRef = useRef(null);
  const botonImportarRef = useRef(null);
  const modalImportacionRef = useRef(null);
  const botonConfirmarImportacionRef = useRef(null);

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
            getProductosAdmin(),
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
            importar_productos: featureFlagsData?.importar_productos === true,
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

  const cerrarConfirmacionImportacion = () => {
    if (importandoProductos) {
      return;
    }

    setConfirmacionImportacionAbierta(false);
    window.setTimeout(() => botonImportarRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (!confirmacionImportacionAbierta) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botonConfirmarImportacionRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !importandoProductos) {
        cerrarConfirmacionImportacion();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const elementosEnfocables = modalImportacionRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elementos = Array.from(elementosEnfocables ?? []).filter(
        (elemento) => !elemento.disabled
      );

      if (elementos.length === 0) {
        return;
      }

      const primerElemento = elementos[0];
      const ultimoElemento = elementos[elementos.length - 1];

      if (event.shiftKey && document.activeElement === primerElemento) {
        event.preventDefault();
        ultimoElemento.focus();
      }

      if (!event.shiftKey && document.activeElement === ultimoElemento) {
        event.preventDefault();
        primerElemento.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmacionImportacionAbierta, importandoProductos]);

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
  const totalProductos = productos.length;
  const productosPublicados = productos.filter(
    (producto) => Number(producto.publicado) === 1
  ).length;
  const productosNoPublicados = productos.filter(
    (producto) => Number(producto.publicado) === 0
  ).length;
  const productosSinImagen = productos.filter(
    (producto) =>
      producto.imagen == null || String(producto.imagen).trim() === ""
  ).length;
  const totalCategorias = categorias.length;
  const porcentajePublicados =
    totalProductos > 0
      ? Math.round((productosPublicados / totalProductos) * 100)
      : 0;
  const obtenerValorMetrica = (valor) => {
    if (cargandoDatos) {
      return "...";
    }

    return errorDatos ? "—" : valor;
  };
  const productosRecientes = [...productos]
    .sort((productoA, productoB) => {
      const fechaA = String(productoA.fecha_creacion ?? "").trim();
      const fechaB = String(productoB.fecha_creacion ?? "").trim();

      if (fechaA && fechaB && fechaA !== fechaB) {
        return fechaB.localeCompare(fechaA);
      }

      return Number(productoB.producto_id) - Number(productoA.producto_id);
    })
    .slice(0, 5);
  const fechaActual = formatearFechaActual();
  const esAdmin = usuario?.rol?.trim().toUpperCase() === "ADMIN";
  const resumenImportacion = {
    total: filasImportacion.length,
    validos: filasImportacion.filter((fila) => fila.estado === "VÁLIDO").length,
    errores: filasImportacion.filter((fila) => fila.estado === "ERROR").length,
    conflictos: filasImportacion.filter((fila) => fila.estado === "CONFLICTO").length,
  };
  const importacionDisponible = Boolean(featureFlags.importar_productos);
  const puedeImportar =
    esAdmin &&
    importacionDisponible &&
    Boolean(archivoImportacion) &&
    filasImportacion.length > 0 &&
    resumenImportacion.validos > 0 &&
    resumenImportacion.errores === 0 &&
    resumenImportacion.conflictos === 0 &&
    !procesandoImportacion &&
    !importandoProductos;
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
      valor: obtenerValorMetrica(totalProductos),
      detalle: "Total del catálogo",
      icono: Boxes,
    },
    {
      titulo: "Publicados",
      valor: obtenerValorMetrica(productosPublicados),
      detalle: "Visibles en la tienda",
      icono: Eye,
    },
    {
      titulo: "No publicados",
      valor: obtenerValorMetrica(productosNoPublicados),
      detalle: "Pendientes u ocultos",
      icono: EyeOff,
    },
    {
      titulo: "Sin imagen",
      valor: obtenerValorMetrica(productosSinImagen),
      detalle: "Requieren una imagen",
      icono: ImageOff,
    },
    {
      titulo: "Categorías",
      valor: obtenerValorMetrica(totalCategorias),
      detalle: "Rubros disponibles",
      icono: Tags,
    },
    {
      titulo: "Publicados %",
      valor: obtenerValorMetrica(`${porcentajePublicados}%`),
      detalle: "Catálogo visible",
      icono: Percent,
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

  const handleExportarPdf = async () => {
    if (!featureFlags.exportar_pdf || descargandoPdf) {
      return;
    }

    try {
      setDescargandoPdf(true);
      setMensajeExportacion("");
      setErrorExportacion("");

      const { blob, filename } = await descargarProductosPdf();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");

      enlace.href = url;
      enlace.download = filename;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);

      setMensajeExportacion("PDF descargado correctamente.");
    } catch (err) {
      setErrorExportacion(
        err instanceof Error
          ? err.message
          : "No se pudo descargar el inventario PDF."
      );
    } finally {
      setDescargandoPdf(false);
    }
  };

  const validarFilasImportacion = (filasCsv) => {
    const categoriasPorNombre = new Map(
      categorias.map((categoria) => [
        normalizarComparacion(categoria.nombre),
        categoria,
      ])
    );
    const codigosExistentes = new Set(
      productos
        .map((producto) => normalizarCodigo(producto.codigo))
        .filter(Boolean)
    );
    const conteoCodigosCsv = new Map();
    const filasNormalizadas = filasCsv.map(({ celdas, numeroFila }) => {
      const fila = crearFilaCsv(celdas, numeroFila);
      const codigoNormalizado = normalizarCodigo(fila.codigo);

      if (codigoNormalizado) {
        conteoCodigosCsv.set(
          codigoNormalizado,
          (conteoCodigosCsv.get(codigoNormalizado) ?? 0) + 1
        );
      }

      return fila;
    });

    return filasNormalizadas.map((fila) => {
      const mensajes = [];
      const conflictos = [];
      const codigoNormalizado = normalizarCodigo(fila.codigo);
      const categoriaNormalizada = normalizarComparacion(fila.categoria);
      const categoriaExistente = categoriasPorNombre.get(categoriaNormalizada);
      const precioNumero = Number(fila.precio);
      const stockNumero = Number(fila.stock);

      if (!fila.codigo) {
        mensajes.push("Código obligatorio");
      }

      if (!fila.nombre) {
        mensajes.push("Nombre obligatorio");
      }

      if (!fila.precio || !Number.isFinite(precioNumero) || precioNumero < 0) {
        mensajes.push("Precio inválido");
      }

      if (
        !fila.stock ||
        !Number.isInteger(stockNumero) ||
        stockNumero < 0
      ) {
        mensajes.push("Stock inválido");
      }

      if (!fila.categoria || !categoriaExistente) {
        mensajes.push("Categoría inexistente");
      }

      if (codigoNormalizado && (conteoCodigosCsv.get(codigoNormalizado) ?? 0) > 1) {
        conflictos.push("Código duplicado en CSV");
      }

      if (codigoNormalizado && codigosExistentes.has(codigoNormalizado)) {
        conflictos.push("El código ya existe");
      }

      const estado =
        mensajes.length > 0
          ? "ERROR"
          : conflictos.length > 0
            ? "CONFLICTO"
            : "VÁLIDO";

      return {
        ...fila,
        precio: fila.precio,
        stock: fila.stock,
        categoria: categoriaExistente?.nombre ?? fila.categoria,
        estado,
        estadoClase:
          estado === "VÁLIDO"
            ? "valido"
            : estado === "ERROR"
              ? "error"
              : "conflicto",
        mensajes: [...mensajes, ...conflictos],
      };
    });
  };

  const procesarArchivoImportacion = async (archivo) => {
    setArchivoImportacion(archivo ?? null);
    setFilasImportacion([]);
    setErrorImportacion("");
    setMensajeImportacion("");

    if (!archivo) {
      setErrorImportacion("Seleccioná un archivo CSV.");
      return;
    }

    const nombreArchivo = archivo.name.toLowerCase();
    const esCsv =
      nombreArchivo.endsWith(".csv") ||
      archivo.type === "text/csv" ||
      archivo.type === "application/vnd.ms-excel";

    if (!esCsv) {
      setErrorImportacion("El archivo debe tener formato CSV.");
      return;
    }

    if (archivo.size === 0) {
      setErrorImportacion("El archivo CSV está vacío.");
      return;
    }

    try {
      setProcesandoImportacion(true);
      const contenido = await archivo.text();
      const contenidoSinBom = contenido.replace(/^\uFEFF/, "");

      if (!contenidoSinBom.trim()) {
        setErrorImportacion("El archivo CSV está vacío.");
        return;
      }

      const filasCsv = parsearCsvPuntoYComa(contenidoSinBom);

      if (filasCsv.length === 0) {
        setErrorImportacion("El archivo CSV está vacío.");
        return;
      }

      const [cabecera, ...filasDatos] = filasCsv;

      if (!cabecera || !validarCabecera(cabecera.celdas)) {
        setErrorImportacion(
          "El encabezado debe ser: codigo;nombre;descripcion;precio;stock;categoria"
        );
        return;
      }

      if (filasDatos.length === 0) {
        setErrorImportacion("El CSV no contiene filas de productos.");
        return;
      }

      setFilasImportacion(validarFilasImportacion(filasDatos));
    } catch (err) {
      setFilasImportacion([]);
      setErrorImportacion(
        err instanceof Error
          ? err.message
          : "No se pudo leer el archivo CSV."
      );
    } finally {
      setProcesandoImportacion(false);
    }
  };

  const handleSeleccionarArchivoImportacion = (event) => {
    procesarArchivoImportacion(event.target.files?.[0] ?? null);
  };

  const abrirConfirmacionImportacion = () => {
    if (!puedeImportar) {
      return;
    }

    setErrorImportacion("");
    setMensajeImportacion("");
    setConfirmacionImportacionAbierta(true);
  };

  const handleConfirmarImportacion = async () => {
    if (!puedeImportar || importandoProductos) {
      return;
    }

    const productosParaImportar = filasImportacion
      .filter((fila) => fila.estado === "VÁLIDO")
      .map((fila) => ({
        codigo: fila.codigo,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        precio: Number(fila.precio),
        stock: Number(fila.stock),
        categoria: fila.categoria,
      }));

    try {
      setImportandoProductos(true);
      setErrorImportacion("");
      setMensajeImportacion("");

      const respuesta = await importarProductos(productosParaImportar);
      const cantidadImportada = Number(respuesta.importados);
      const cantidadConfirmada = Number.isInteger(cantidadImportada)
        ? cantidadImportada
        : productosParaImportar.length;

      setArchivoImportacion(null);
      setFilasImportacion([]);
      setConfirmacionImportacionAbierta(false);
      setMensajeImportacion(
        `Se importaron ${cantidadConfirmada} productos correctamente.`
      );

      if (archivoImportacionRef.current) {
        archivoImportacionRef.current.value = "";
      }

      try {
        const productosActualizados = await getProductosAdmin();
        setProductos(
          Array.isArray(productosActualizados) ? productosActualizados : []
        );
      } catch (err) {
        setErrorDatos(
          err instanceof Error
            ? err.message
            : "Los productos se importaron, pero no se pudo actualizar el panel."
        );
      }

      window.setTimeout(() => archivoImportacionRef.current?.focus(), 0);
    } catch (err) {
      setErrorImportacion(formatearErrorBackendImportacion(err));
      setConfirmacionImportacionAbierta(false);
      window.setTimeout(() => botonImportarRef.current?.focus(), 0);
    } finally {
      setImportandoProductos(false);
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

        <button
          className="dashboard__quick-action"
          type="button"
          onClick={handleExportarPdf}
          disabled={!featureFlags.exportar_pdf || descargandoPdf}
        >
          <span className="dashboard__quick-icon" aria-hidden="true">
            <FileDown size={22} />
          </span>
          <span>
            <strong>Exportar PDF</strong>
            <small>
              {descargandoPdf
                ? "Generando PDF..."
                : featureFlags.exportar_pdf
                  ? "Descargar inventario PDF"
                  : "Desactivado"}
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

      <section
        className="dashboard__section dashboard__section--plain dashboard__import"
        aria-labelledby="importacion-productos-title"
      >
        <div className="dashboard__section-header">
          <div>
            <p className="dashboard__section-kicker">Importación</p>
            <h3 id="importacion-productos-title">Vista previa CSV</h3>
          </div>
        </div>

        {!importacionDisponible && (
          <p className="dashboard__import-note" role="status">
            La importación de productos está desactivada.
          </p>
        )}

        <div className="dashboard__import-controls">
          <label className="dashboard__file-label" htmlFor="productos-csv">
            <FileUp aria-hidden="true" size={20} />
            Seleccionar CSV
          </label>
          <input
            id="productos-csv"
            className="dashboard__file-input"
            type="file"
            accept=".csv,text/csv"
            ref={archivoImportacionRef}
            disabled={
              !importacionDisponible ||
              cargandoDatos ||
              procesandoImportacion ||
              importandoProductos ||
              confirmacionImportacionAbierta
            }
            onChange={handleSeleccionarArchivoImportacion}
          />

          <button
            className="dashboard__import-button"
            type="button"
            ref={botonImportarRef}
            disabled={!puedeImportar}
            aria-disabled={!puedeImportar}
            onClick={abrirConfirmacionImportacion}
          >
            <FileUp aria-hidden="true" size={18} />
            {importandoProductos ? "Importando..." : "Importar productos"}
          </button>
        </div>

        {archivoImportacion && (
          <p className="dashboard__import-filename">
            Archivo: <strong>{archivoImportacion.name}</strong>
          </p>
        )}

        {procesandoImportacion && (
          <p className="dashboard__empty" role="status">
            Procesando CSV...
          </p>
        )}

        {errorImportacion && (
          <p
            className="dashboard__export-message dashboard__export-message--error"
            role="alert"
          >
            {errorImportacion}
          </p>
        )}

        {mensajeImportacion && (
          <p className="dashboard__export-message" role="status">
            {mensajeImportacion}
          </p>
        )}

        {filasImportacion.length > 0 && (
          <>
            <div
              className="dashboard__import-summary"
              aria-label="Resumen de validación"
            >
              <span>Total: <strong>{resumenImportacion.total}</strong></span>
              <span>Válidos: <strong>{resumenImportacion.validos}</strong></span>
              <span>Errores: <strong>{resumenImportacion.errores}</strong></span>
              <span>Conflictos: <strong>{resumenImportacion.conflictos}</strong></span>
            </div>

            {resumenImportacion.validos === 0 && (
              <p className="dashboard__import-note" role="status">
                No existen productos válidos para importar.
              </p>
            )}

            <div className="dashboard__table-wrap">
              <table className="dashboard__table dashboard__import-table">
                <thead>
                  <tr>
                    <th>Nº fila</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {filasImportacion.map((fila) => (
                    <tr
                      className={`dashboard__import-row dashboard__import-row--${fila.estadoClase}`}
                      key={`${fila.numeroFila}-${fila.codigo}-${fila.nombre}`}
                    >
                      <td>{fila.numeroFila}</td>
                      <td>{fila.codigo || "-"}</td>
                      <td>{fila.nombre || "-"}</td>
                      <td>{fila.precio || "-"}</td>
                      <td>{fila.stock || "-"}</td>
                      <td>{fila.categoria || "-"}</td>
                      <td>
                        <span className="dashboard__import-state">
                          {fila.estado}
                        </span>
                        <span className="dashboard__import-messages">
                          {fila.mensajes.length > 0
                            ? fila.mensajes.join("; ")
                            : "Fila válida"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
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

      <section className="dashboard__section dashboard__section--plain">
        <div className="dashboard__section-header">
          <div>
            <p className="dashboard__section-kicker">CSV</p>
            <h3>Importar productos desde Excel</h3>
          </div>
        </div>

        <div className="dashboard__ayuda">
          <article className="dashboard__ayuda-bloque">
            <h4>Preparar el archivo</h4>
            <p>
              Podés preparar muchos productos en Excel o LibreOffice y
              guardarlos como CSV para revisar la importación en el Dashboard.
            </p>

            <ul>
              <li>codigo</li>
              <li>nombre</li>
              <li>descripcion</li>
              <li>precio</li>
              <li>stock</li>
              <li>categoria</li>
            </ul>
          </article>

          <article className="dashboard__ayuda-bloque">
            <h4>Ejemplo</h4>
            <div className="dashboard__table-wrap">
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th>codigo</th>
                    <th>nombre</th>
                    <th>descripcion</th>
                    <th>precio</th>
                    <th>stock</th>
                    <th>categoria</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>HM-100</td>
                    <td>Martillo</td>
                    <td>Martillo mango de madera</td>
                    <td>12500</td>
                    <td>10</td>
                    <td>Herramientas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard__ayuda-bloque">
            <h4>Pasos</h4>
            <ol className="dashboard__tips-list">
              <li>Crear o abrir el archivo con Excel o LibreOffice.</li>
              <li>Mantener exactamente las columnas indicadas.</li>
              <li>Elegir Guardar como.</li>
              <li>Seleccionar formato CSV.</li>
              <li>Utilizar punto y coma (;) como separador.</li>
              <li>Guardar en UTF-8.</li>
              <li>Entrar al Dashboard y seleccionar Importar productos.</li>
              <li>Seleccionar el archivo.</li>
              <li>
                Revisar la vista previa y corregir errores antes de importar.
              </li>
            </ol>
          </article>

          <article className="dashboard__ayuda-bloque">
            <h4>Validaciones</h4>
            <p>
              Las categorías utilizadas en el archivo deben existir previamente
              en Ferretería JM.
            </p>
            <p>La vista previa puede detectar:</p>
            <ul>
              <li>precio inválido</li>
              <li>stock inválido</li>
              <li>categoría inexistente</li>
              <li>código repetido dentro del archivo</li>
              <li>código de producto ya existente</li>
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

      {esAdmin && confirmacionImportacionAbierta && (
        <div
          className="dashboard__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarConfirmacionImportacion();
            }
          }}
        >
          <div
            className="dashboard__modal"
            ref={modalImportacionRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-importacion-title"
            aria-describedby="confirmar-importacion-description"
          >
            <p className="dashboard__section-kicker">Confirmar importación</p>
            <h2 id="confirmar-importacion-title">
              Se importarán {resumenImportacion.validos} productos
            </h2>
            <p id="confirmar-importacion-description">
              Los productos se crearán como No publicados y sin imagen. Luego
              deberán revisarse, agregarles una imagen y publicarlos.
            </p>

            <div className="dashboard__modal-actions">
              <button
                className="dashboard__modal-button dashboard__modal-button--secondary"
                type="button"
                disabled={importandoProductos}
                onClick={cerrarConfirmacionImportacion}
              >
                Cancelar
              </button>
              <button
                className="dashboard__modal-button dashboard__modal-button--primary"
                type="button"
                ref={botonConfirmarImportacionRef}
                disabled={importandoProductos}
                onClick={handleConfirmarImportacion}
              >
                <FileUp aria-hidden="true" size={18} />
                {importandoProductos
                  ? "Importando..."
                  : `Importar ${resumenImportacion.validos} productos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
