import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../../../config/appConfig';
import { getCategorias } from '../../categorias/services/categoriaApi';
import { obtenerSesionUsuario } from '../../auth/services/usuarioApi';
import {
  actualizarProducto,
  actualizarPublicado,
  crearProducto,
  eliminarProducto,
  getProductosAdmin,
  subirImagen,
} from '../services/productoApi';
import './Productos.css';

const formularioInicial = {
  codigo: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  categoria_id: '',
  imagen: null,
  imagenActual: '',
};

const imagenRecomendada = {
  ancho: 800,
  alto: 600,
  pesoMaximoMb: 2,
};
const UMBRAL_STOCK_BAJO = 5;

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim().toLowerCase();
}

export default function Productos() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productoEditandoId, setProductoEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [actualizandoPublicadoId, setActualizandoPublicadoId] =
    useState(null);
  const [imagenVistaPrevia, setImagenVistaPrevia] = useState(null);
  const [autorizado, setAutorizado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalErrorPublicacion, setModalErrorPublicacion] = useState({
    abierto: false,
    mensaje: '',
  });
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPublicacion, setFiltroPublicacion] = useState('todos');
  const [filtroImagen, setFiltroImagen] = useState('todas');
  const [filtroStock, setFiltroStock] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const botonAgregarRef = useRef(null);
  const disparadorModalRef = useRef(null);
  const modalRef = useRef(null);
  const primerCampoRef = useRef(null);
  const busquedaRef = useRef(null);
  const modalErrorPublicacionRef = useRef(null);
  const botonEntendidoRef = useRef(null);
  const disparadorErrorPublicacionRef = useRef(null);
  const modalEliminacionRef = useRef(null);
  const botonCancelarEliminacionRef = useRef(null);
  const disparadorEliminacionRef = useRef(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const [productosData, categoriasData] = await Promise.all([
        getProductosAdmin(),
        getCategorias(),
      ]);

      setProductos(
        Array.isArray(productosData) ? productosData : []
      );

      setCategorias(
        Array.isArray(categoriasData) ? categoriasData : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los datos'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const validarSesion = async () => {
      try {
        const respuesta = await obtenerSesionUsuario();

        if (!respuesta.success || !respuesta.usuario) {
          localStorage.removeItem('usuario');
          sessionStorage.removeItem('usuario');
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        const rol = respuesta.usuario?.rol?.trim().toUpperCase();

        if (!['ADMIN', 'EMPLEADO'].includes(rol)) {
          localStorage.removeItem('usuario');
          sessionStorage.removeItem('usuario');
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        localStorage.setItem('usuario', JSON.stringify(respuesta.usuario));
        setEsAdmin(rol === 'ADMIN');
        setAutorizado(true);
        await cargarDatos();
      } catch {
        localStorage.removeItem('usuario');
        sessionStorage.removeItem('usuario');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    };

    validarSesion();
  }, []);

  useEffect(() => {
    if (!formulario.imagen) {
      setImagenVistaPrevia(null);
      return undefined;
    }

    let componenteActivo = true;
    const urlTemporal = URL.createObjectURL(formulario.imagen);
    const imagen = new Image();
    const pesoMb =
      formulario.imagen.size / 1024 / 1024;

    setImagenVistaPrevia({
      url: urlTemporal,
      ancho: null,
      alto: null,
      pesoMb,
    });

    imagen.onload = () => {
      if (!componenteActivo) {
        return;
      }

      setImagenVistaPrevia({
        url: urlTemporal,
        ancho: imagen.naturalWidth,
        alto: imagen.naturalHeight,
        pesoMb,
      });
    };

    imagen.onerror = () => {
      if (!componenteActivo) {
        return;
      }

      setImagenVistaPrevia({
        url: urlTemporal,
        ancho: null,
        alto: null,
        pesoMb,
      });
    };

    imagen.src = urlTemporal;

    return () => {
      componenteActivo = false;
      URL.revokeObjectURL(urlTemporal);
    };
  }, [formulario.imagen]);

  useEffect(() => {
    if (!modalAbierto) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primerCampoRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cerrarModal();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elementosEnfocables = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elementos = Array.from(
        elementosEnfocables ?? []
      ).filter((elemento) => !elemento.disabled);

      if (elementos.length === 0) {
        return;
      }

      const primerElemento = elementos[0];
      const ultimoElemento =
        elementos[elementos.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === primerElemento
      ) {
        event.preventDefault();
        ultimoElemento.focus();
      }

      if (
        !event.shiftKey &&
        document.activeElement === ultimoElemento
      ) {
        event.preventDefault();
        primerElemento.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalAbierto]);

  const cerrarModalErrorPublicacion = () => {
    setModalErrorPublicacion({
      abierto: false,
      mensaje: '',
    });
    window.setTimeout(() => {
      disparadorErrorPublicacionRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!modalErrorPublicacion.abierto) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonEntendidoRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cerrarModalErrorPublicacion();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elementosEnfocables =
        modalErrorPublicacionRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      const elementos = Array.from(
        elementosEnfocables ?? []
      ).filter((elemento) => !elemento.disabled);

      if (elementos.length === 0) {
        return;
      }

      const primerElemento = elementos[0];
      const ultimoElemento = elementos[elementos.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === primerElemento
      ) {
        event.preventDefault();
        ultimoElemento.focus();
      }

      if (
        !event.shiftKey &&
        document.activeElement === ultimoElemento
      ) {
        event.preventDefault();
        primerElemento.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalErrorPublicacion.abierto]);

  const cerrarModalEliminacion = () => {
    if (eliminandoId !== null) {
      return;
    }

    setProductoAEliminar(null);
    window.setTimeout(() => {
      disparadorEliminacionRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!productoAEliminar) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonCancelarEliminacionRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && eliminandoId === null) {
        cerrarModalEliminacion();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elementosEnfocables =
        modalEliminacionRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      const elementos = Array.from(
        elementosEnfocables ?? []
      ).filter((elemento) => !elemento.disabled);

      if (elementos.length === 0) {
        return;
      }

      const primerElemento = elementos[0];
      const ultimoElemento = elementos[elementos.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === primerElemento
      ) {
        event.preventDefault();
        ultimoElemento.focus();
      }

      if (
        !event.shiftKey &&
        document.activeElement === ultimoElemento
      ) {
        event.preventDefault();
        primerElemento.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [productoAEliminar, eliminandoId]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: files ? files[0] || null : value,
    }));
  };

  const limpiarFormulario = (formularioHtml = null) => {
    setFormulario(formularioInicial);
    setProductoEditandoId(null);
    setError('');
    formularioHtml?.reset();
  };

  const cerrarModal = () => {
    limpiarFormulario();
    setModalAbierto(false);
    window.setTimeout(() => {
      disparadorModalRef.current?.focus();
    }, 0);
  };

  const handleAbrirNuevoProducto = () => {
    if (!esAdmin) {
      return;
    }

    disparadorModalRef.current = botonAgregarRef.current;
    setFormulario(formularioInicial);
    setProductoEditandoId(null);
    setMensaje('');
    setError('');
    setModalAbierto(true);
  };

  const validarFormulario = () => {
    if (!formulario.codigo.trim()) {
      return 'El código es obligatorio.';
    }

    if (!formulario.nombre.trim()) {
      return 'El nombre es obligatorio.';
    }

    if (formulario.precio === '') {
      return 'El precio es obligatorio.';
    }

    if (Number(formulario.precio) < 0) {
      return 'El precio no puede ser negativo.';
    }

    if (formulario.stock === '') {
      return 'El stock es obligatorio.';
    }

    if (Number(formulario.stock) < 0) {
      return 'El stock no puede ser negativo.';
    }

    if (!formulario.categoria_id) {
      return 'Seleccioná una categoría.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!esAdmin) {
      return;
    }

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      setMensaje('');
      return;
    }

    try {
      setGuardando(true);
      setMensaje('');
      setError('');

      let rutaImagen = formulario.imagenActual;

      if (formulario.imagen) {
        const imagenSubida = await subirImagen(
          formulario.imagen
        );

        rutaImagen = imagenSubida.ruta;
      }

      const datosProducto = {
        codigo: formulario.codigo.trim(),
        nombre: formulario.nombre.trim(),
        descripcion:
          formulario.descripcion.trim() || null,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        categoria_id: Number(formulario.categoria_id),
        imagen: rutaImagen || null,
      };

      if (productoEditandoId !== null) {
        await actualizarProducto(
          productoEditandoId,
          datosProducto
        );

        setMensaje('Producto actualizado correctamente.');
      } else {
        await crearProducto(datosProducto);

        setMensaje('Producto creado correctamente.');
      }

      limpiarFormulario(event.currentTarget);
      setModalAbierto(false);
      window.setTimeout(() => {
        disparadorModalRef.current?.focus();
      }, 0);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar el producto'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (producto, event) => {
    if (!esAdmin) {
      return;
    }

    disparadorModalRef.current =
      event?.currentTarget ?? botonAgregarRef.current;
    setProductoEditandoId(producto.producto_id);

    setFormulario({
      codigo: producto.codigo ?? '',
      nombre: producto.nombre ?? '',
      descripcion: producto.descripcion ?? '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      categoria_id: String(
        producto.categoria_id ?? ''
      ),
      imagen: null,
      imagenActual: producto.imagen ?? '',
    });

    setMensaje('');
    setError('');
    setModalAbierto(true);
  };

  const handleCancelarEdicion = () => {
    cerrarModal();
  };

  const handleSolicitarEliminar = (producto, event) => {
    if (!esAdmin) {
      return;
    }

    disparadorEliminacionRef.current =
      event?.currentTarget ?? null;
    setMensaje('');
    setError('');
    setProductoAEliminar(producto);
  };

  const handleEliminar = async () => {
    if (!esAdmin || !productoAEliminar || eliminandoId !== null) {
      return;
    }

    const producto = productoAEliminar;

    try {
      setEliminandoId(producto.producto_id);
      setMensaje('');
      setError('');

      await eliminarProducto(producto.producto_id);

      if (
        productoEditandoId === producto.producto_id
      ) {
        limpiarFormulario();
      }

      setMensaje('Producto eliminado correctamente.');
      setProductoAEliminar(null);
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el producto'
      );
      setProductoAEliminar(null);
      window.setTimeout(() => {
        disparadorEliminacionRef.current?.focus();
      }, 0);
    } finally {
      setEliminandoId(null);
    }
  };

  const handleCambiarPublicacion = async (producto, event) => {
    if (!esAdmin || actualizandoPublicadoId !== null) {
      return;
    }

    const nuevoEstado =
      Number(producto.publicado) === 1 ? 0 : 1;

    if (nuevoEstado === 1) {
      disparadorErrorPublicacionRef.current =
        event?.currentTarget ?? null;
    }

    try {
      setActualizandoPublicadoId(producto.producto_id);
      setMensaje('');
      setError('');

      const respuesta = await actualizarPublicado(
        producto.producto_id,
        nuevoEstado
      );
      const estadoConfirmado =
        respuesta?.publicado === undefined
          ? nuevoEstado
          : Number(respuesta.publicado) === 1
            ? 1
            : 0;

      setProductos((productosActuales) =>
        productosActuales.map((productoActual) =>
          productoActual.producto_id === producto.producto_id
            ? {
                ...productoActual,
                publicado: estadoConfirmado,
              }
            : productoActual
        )
      );
      setMensaje(
        estadoConfirmado === 1
          ? 'Producto publicado correctamente.'
          : 'Producto ocultado correctamente.'
      );
    } catch (err) {
      const mensajeError =
        err instanceof Error
          ? err.message
          : 'No se pudo cambiar la publicación del producto';

      if (
        nuevoEstado === 1 &&
        Number(err?.status) === 422
      ) {
        setError('');
        setModalErrorPublicacion({
          abierto: true,
          mensaje: mensajeError,
        });
      } else {
        setError(mensajeError);
      }
    } finally {
      setActualizandoPublicadoId(null);
    }
  };

  const obtenerImagen = (ruta) => {
    if (!ruta) {
      return '';
    }

    return ruta.startsWith('http')
      ? ruta
      : `${API_BASE_URL}/${ruta}`;
  };

  const formatearPesoImagen = (pesoMb) =>
    `${pesoMb.toFixed(2)} MB`;

  const obtenerMensajesImagen = () => {
    if (!imagenVistaPrevia) {
      return [];
    }

    const superaPeso =
      imagenVistaPrevia.pesoMb >
      imagenRecomendada.pesoMaximoMb;
    const superaResolucion =
      imagenVistaPrevia.ancho !== null &&
      imagenVistaPrevia.alto !== null &&
      (imagenVistaPrevia.ancho >
        imagenRecomendada.ancho ||
        imagenVistaPrevia.alto >
          imagenRecomendada.alto);

    if (!superaPeso && !superaResolucion) {
      return [
        {
          tipo: 'success',
          texto: 'Imagen apta para subir.',
        },
      ];
    }

    const mensajes = [];

    if (superaPeso) {
      mensajes.push({
        tipo: 'warning',
        texto:
          'La imagen supera el tamaño recomendado de 2 MB. Se recomienda reducirla u optimizarla antes de subirla para mejorar el rendimiento del sitio.',
      });
    }

    if (superaResolucion) {
      mensajes.push({
        tipo: 'warning',
        texto:
          'La resolución es superior a la recomendada. Se aconseja utilizar una imagen cercana a 800 × 600 px para mejorar la velocidad de carga del sitio.',
      });
    }

    return mensajes;
  };

  const mensajesImagen = obtenerMensajesImagen();
  const busquedaNormalizada = normalizarTexto(busqueda);
  const productosFiltrados = useMemo(() => {
    return productos.filter((producto) => {
      const campos = [
        producto.codigo,
        producto.nombre,
        producto.descripcion,
        producto.categoria,
      ];

      const coincideBusqueda =
        !busquedaNormalizada ||
        campos.some((campo) =>
          normalizarTexto(campo).includes(busquedaNormalizada)
        );
      const coincidePublicacion =
        filtroPublicacion === 'todos' ||
        (filtroPublicacion === 'publicados' &&
          Number(producto.publicado) === 1) ||
        (filtroPublicacion === 'no-publicados' &&
          Number(producto.publicado) === 0);
      const sinImagen =
        producto.imagen == null ||
        String(producto.imagen).trim() === '';
      const coincideImagen =
        filtroImagen === 'todas' ||
        (filtroImagen === 'sin-imagen' && sinImagen);
      const coincideStock =
        filtroStock === 'todos' ||
        (filtroStock === 'stock-bajo' &&
          Number(producto.stock) < UMBRAL_STOCK_BAJO);
      const coincideCategoria =
        filtroCategoria === '' ||
        Number(producto.categoria_id) === Number(filtroCategoria);

      return (
        coincideBusqueda &&
        coincidePublicacion &&
        coincideImagen &&
        coincideStock &&
        coincideCategoria
      );
    });
  }, [
    productos,
    busquedaNormalizada,
    filtroPublicacion,
    filtroImagen,
    filtroStock,
    filtroCategoria,
  ]);
  const hayCriteriosActivos =
    busquedaNormalizada !== '' ||
    filtroPublicacion !== 'todos' ||
    filtroImagen !== 'todas' ||
    filtroStock !== 'todos' ||
    filtroCategoria !== '';
  const textoResultados = !hayCriteriosActivos
    ? `${productos.length} ${
        productos.length === 1 ? 'producto' : 'productos'
      }`
    : productosFiltrados.length === 0
      ? 'No se encontraron productos'
      : `${productosFiltrados.length} ${
          productosFiltrados.length === 1
            ? 'producto encontrado'
            : 'productos encontrados'
        }`;

  const handleLimpiarBusqueda = () => {
    setBusqueda('');
    setFiltroPublicacion('todos');
    setFiltroImagen('todas');
    setFiltroStock('todos');
    setFiltroCategoria('');
    window.setTimeout(() => {
      busquedaRef.current?.focus();
    }, 0);
  };

  if (!autorizado) {
    return (
      <section className="productos">
        <p className="productos__empty" role="status">
          Validando sesión...
        </p>
      </section>
    );
  }

  return (
    <section className="productos">
      <div className="productos__header">
        <a className="productos__back-link" href="/dashboard">
          ← Volver al Dashboard
        </a>

        <p className="productos__eyebrow">Administración</p>

        <div className="productos__title-row">
          <h1 className="productos__title">
            Productos
          </h1>

          {esAdmin && (
            <button
              className="productos__button productos__button--add"
              type="button"
              onClick={handleAbrirNuevoProducto}
              ref={botonAgregarRef}
            >
              Agregar producto
            </button>
          )}
        </div>
      </div>

      {!modalAbierto && error && (
        <p
          className="productos__message productos__message--error productos__message--page"
          role="alert"
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p
          className="productos__message productos__message--success productos__message--page"
          role="status"
        >
          {mensaje}
        </p>
      )}

      {esAdmin && modalErrorPublicacion.abierto && (
        <div
          className="productos__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModalErrorPublicacion();
            }
          }}
        >
          <div
            className="productos__modal productos__modal--publication-error"
            ref={modalErrorPublicacionRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="productos-publication-error-title"
            aria-describedby="productos-publication-error-message"
          >
            <div className="productos__modal-header">
              <h2
                className="productos__modal-title"
                id="productos-publication-error-title"
              >
                No se puede publicar
              </h2>

              <button
                className="productos__modal-close"
                type="button"
                aria-label="Cerrar"
                onClick={cerrarModalErrorPublicacion}
              >
                ×
              </button>
            </div>

            <p
              className="productos__publication-error-message"
              id="productos-publication-error-message"
            >
              {modalErrorPublicacion.mensaje}
            </p>

            <div className="productos__publication-error-actions">
              <button
                className="productos__button"
                type="button"
                ref={botonEntendidoRef}
                onClick={cerrarModalErrorPublicacion}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {esAdmin && productoAEliminar && (
        <div
          className="productos__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModalEliminacion();
            }
          }}
        >
          <div
            className="productos__modal productos__modal--publication-error"
            ref={modalEliminacionRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="productos-delete-title"
            aria-describedby="productos-delete-message"
          >
            <div className="productos__modal-header">
              <h2
                className="productos__modal-title"
                id="productos-delete-title"
              >
                Eliminar producto
              </h2>

              <button
                className="productos__modal-close"
                type="button"
                aria-label="Cerrar"
                disabled={eliminandoId !== null}
                onClick={cerrarModalEliminacion}
              >
                ×
              </button>
            </div>

            <p
              className="productos__publication-error-message"
              id="productos-delete-message"
            >
              ¿Seguro que querés eliminar "{productoAEliminar.nombre}"?
            </p>

            <div className="productos__delete-actions">
              <button
                className="productos__button productos__button--secondary"
                type="button"
                ref={botonCancelarEliminacionRef}
                disabled={eliminandoId !== null}
                onClick={cerrarModalEliminacion}
              >
                Cancelar
              </button>
              <button
                className="productos__action-button productos__action-button--danger"
                type="button"
                disabled={eliminandoId !== null}
                onClick={handleEliminar}
              >
                {eliminandoId !== null ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {esAdmin && modalAbierto && (
        <div
          className="productos__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >
          <div
            className="productos__modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="productos-modal-title"
          >
            <div className="productos__modal-header">
              <h2
                className="productos__modal-title"
                id="productos-modal-title"
              >
                {productoEditandoId !== null
                  ? 'Editar producto'
                  : 'Nuevo producto'}
              </h2>

              <button
                className="productos__modal-close"
                type="button"
                aria-label="Cerrar modal"
                onClick={cerrarModal}
              >
                ×
              </button>
            </div>

            <form
              className="productos__form"
              onSubmit={handleSubmit}
            >
        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="codigo"
          >
            Código
          </label>

          <input
            id="codigo"
            className="productos__input"
            type="text"
            name="codigo"
            value={formulario.codigo}
            onChange={handleChange}
            ref={primerCampoRef}
            required
          />
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="nombre"
          >
            Nombre
          </label>

          <input
            id="nombre"
            className="productos__input"
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="descripcion"
          >
            Descripción
          </label>

          <textarea
            id="descripcion"
            className="productos__input"
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="precio"
          >
            Precio
          </label>

          <input
            id="precio"
            className="productos__input"
            type="number"
            min="0"
            step="0.01"
            name="precio"
            value={formulario.precio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="stock"
          >
            Stock
          </label>

          <input
            id="stock"
            className="productos__input"
            type="number"
            min="0"
            step="1"
            name="stock"
            value={formulario.stock}
            onChange={handleChange}
            required
          />
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="categoria_id"
          >
            Categoría
          </label>

          <select
            id="categoria_id"
            className="productos__input"
            name="categoria_id"
            value={formulario.categoria_id}
            onChange={handleChange}
            required
          >
            <option value="">
              Seleccionar categoría
            </option>

            {categorias.map((categoria) => (
              <option
                key={categoria.categoria_id}
                value={categoria.categoria_id}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="productos__field">
          <label
            className="productos__label"
            htmlFor="imagen"
          >
            Imagen
          </label>

          <input
            id="imagen"
            className="productos__input"
            type="file"
            name="imagen"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />

          {productoEditandoId !== null &&
            formulario.imagenActual && (
              <div className="productos__current-image">
                <p>Imagen actual:</p>

                <img
                  className="productos__image"
                  src={obtenerImagen(
                    formulario.imagenActual
                  )}
                  alt="Imagen actual del producto"
                />

                <small>
                  Seleccioná otra imagen únicamente si
                  querés reemplazarla.
                </small>
              </div>
            )}
        </div>

        {imagenVistaPrevia && (
          <div className="productos__image-panel">
            <div className="productos__preview-card">
              <p className="productos__preview-title">
                Vista previa
              </p>

              <img
                className="productos__preview-image"
                src={imagenVistaPrevia.url}
                alt="Vista previa de la imagen seleccionada"
              />
            </div>

            <div className="productos__image-info-card">
              <p className="productos__preview-title">
                Recomendaciones
              </p>

              <dl className="productos__image-info">
                <div>
                  <dt>Formatos</dt>
                  <dd>JPG, PNG, WEBP</dd>
                </div>

                <div>
                  <dt>Resolución recomendada</dt>
                  <dd>800 × 600 px</dd>
                </div>

                <div>
                  <dt>Tamaño recomendado</dt>
                  <dd>Hasta 2 MB</dd>
                </div>

                <div>
                  <dt>Resolución real</dt>
                  <dd>
                    {imagenVistaPrevia.ancho !== null &&
                    imagenVistaPrevia.alto !== null
                      ? `${imagenVistaPrevia.ancho} × ${imagenVistaPrevia.alto} px`
                      : 'Calculando...'}
                  </dd>
                </div>

                <div>
                  <dt>Tamaño del archivo</dt>
                  <dd>
                    {formatearPesoImagen(
                      imagenVistaPrevia.pesoMb
                    )}
                  </dd>
                </div>
              </dl>

              <div className="productos__image-feedback">
                {mensajesImagen.map((mensajeImagen) => (
                  <p
                    className={`productos__image-feedback-item productos__image-feedback-item--${mensajeImagen.tipo}`}
                    key={mensajeImagen.texto}
                  >
                    {mensajeImagen.texto}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p
            className="productos__message productos__message--error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="productos__actions">
          <button
            className="productos__button"
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? 'Guardando...'
              : productoEditandoId !== null
                ? 'Guardar cambios'
                : 'Crear producto'}
          </button>

          <button
            className="productos__button productos__button--secondary"
            type="button"
            onClick={handleCancelarEdicion}
            disabled={guardando}
          >
            Cancelar
          </button>
        </div>
            </form>
          </div>
        </div>
      )}

      <div className="productos__list">
        <h2 className="productos__subtitle">
          Listado de productos
        </h2>

        <div className="productos__search">
          <label
            className="productos__search-label"
            htmlFor="productos-busqueda"
          >
            Buscar productos
          </label>

          <div className="productos__search-row">
            <input
              id="productos-busqueda"
              className="productos__search-input"
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por código, nombre o categoría"
              ref={busquedaRef}
              autoComplete="off"
            />

            <button
              className="productos__search-clear"
              type="button"
              onClick={handleLimpiarBusqueda}
              disabled={!hayCriteriosActivos}
              aria-label="Limpiar búsqueda y filtros de productos"
            >
              Limpiar
            </button>
          </div>

          <div className="productos__filters">
            <label className="productos__filter" htmlFor="filtro-publicacion">
              <span className="productos__filter-label">Estado</span>
              <select
                id="filtro-publicacion"
                className="productos__filter-select"
                value={filtroPublicacion}
                onChange={(event) => setFiltroPublicacion(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="publicados">Publicados</option>
                <option value="no-publicados">No publicados</option>
              </select>
            </label>

            <label className="productos__filter" htmlFor="filtro-imagen">
              <span className="productos__filter-label">Imagen</span>
              <select
                id="filtro-imagen"
                className="productos__filter-select"
                value={filtroImagen}
                onChange={(event) => setFiltroImagen(event.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="sin-imagen">Sin imagen</option>
              </select>
            </label>

            <label className="productos__filter" htmlFor="filtro-stock">
              <span className="productos__filter-label">Stock</span>
              <select
                id="filtro-stock"
                className="productos__filter-select"
                value={filtroStock}
                onChange={(event) => setFiltroStock(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="stock-bajo">Stock bajo</option>
              </select>
            </label>

            <label className="productos__filter" htmlFor="filtro-categoria">
              <span className="productos__filter-label">Categoría</span>
              <select
                id="filtro-categoria"
                className="productos__filter-select"
                value={filtroCategoria}
                onChange={(event) => setFiltroCategoria(event.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.categoria_id}
                    value={categoria.categoria_id}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!cargando && productos.length > 0 && (
            <p
              className="productos__search-count"
              role="status"
              aria-live="polite"
            >
              {textoResultados}
            </p>
          )}
        </div>

        {cargando ? (
          <p className="productos__empty">
            Cargando productos...
          </p>
        ) : productos.length === 0 ? (
          <p className="productos__empty">
            No hay productos cargados.
          </p>
        ) : productosFiltrados.length === 0 ? (
          <p className="productos__empty">
            No se encontraron productos con los criterios seleccionados.
          </p>
        ) : (
          <div className="productos__table-wrap">
            <table className="productos__table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  {esAdmin && <th>Acciones</th>}
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr key={producto.producto_id}>
                    <td>
                      {producto.imagen && (
                        <img
                          className="productos__image"
                          src={obtenerImagen(
                            producto.imagen
                          )}
                          alt={producto.nombre}
                        />
                      )}
                    </td>

                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td>{formatearPrecio(producto.precio)}</td>
                    <td>{producto.stock}</td>
                    <td>{producto.categoria}</td>
                    <td>
                      <span
                        className={`productos__publication-state ${
                          Number(producto.publicado) === 1
                            ? 'productos__publication-state--published'
                            : 'productos__publication-state--draft'
                        }`}
                      >
                        {Number(producto.publicado) === 1
                          ? 'Publicado'
                          : 'No publicado'}
                      </span>
                    </td>

                    {esAdmin && (
                      <td>
                        <div className="productos__row-actions">
                          <button
                            className={`productos__action-button ${
                              Number(producto.publicado) === 1
                                ? 'productos__action-button--hide'
                                : 'productos__action-button--publish'
                            }`}
                            type="button"
                            onClick={(event) =>
                              handleCambiarPublicacion(producto, event)
                            }
                            disabled={
                              actualizandoPublicadoId !== null ||
                              eliminandoId === producto.producto_id
                            }
                          >
                            {actualizandoPublicadoId ===
                            producto.producto_id
                              ? Number(producto.publicado) === 1
                                ? 'Ocultando...'
                                : 'Publicando...'
                              : Number(producto.publicado) === 1
                                ? 'Ocultar'
                                : 'Publicar'}
                          </button>

                          <button
                            className="productos__action-button"
                            type="button"
                            onClick={(event) =>
                              handleEditar(producto, event)
                            }
                            disabled={
                              actualizandoPublicadoId !== null ||
                              eliminandoId === producto.producto_id
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="productos__action-button productos__action-button--danger"
                            type="button"
                            onClick={(event) =>
                              handleSolicitarEliminar(producto, event)
                            }
                            disabled={
                              actualizandoPublicadoId !== null ||
                              eliminandoId === producto.producto_id
                            }
                          >
                            {eliminandoId ===
                            producto.producto_id
                              ? 'Eliminando...'
                              : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
