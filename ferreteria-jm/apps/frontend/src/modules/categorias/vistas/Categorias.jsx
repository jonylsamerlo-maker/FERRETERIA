import { useEffect, useRef, useState } from 'react';
import { obtenerSesionUsuario } from '../../auth/services/usuarioApi';
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  getCategorias,
} from '../services/categoriaApi';
import './Categorias.css';

const formularioInicial = {
  nombre: '',
  descripcion: '',
};

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [autorizado, setAutorizado] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const botonAgregarRef = useRef(null);
  const disparadorModalRef = useRef(null);
  const modalRef = useRef(null);
  const primerCampoRef = useRef(null);

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getCategorias();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
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
        await cargarCategorias();
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormulario((formularioActual) => ({
      ...formularioActual,
      [name]: value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setCategoriaEditando(null);
  };

  const cerrarModal = () => {
    limpiarFormulario();
    setError('');
    setModalAbierto(false);
    window.setTimeout(() => {
      disparadorModalRef.current?.focus();
    }, 0);
  };

  const handleAbrirNuevaCategoria = () => {
    if (!esAdmin) {
      return;
    }

    disparadorModalRef.current = botonAgregarRef.current;
    setFormulario(formularioInicial);
    setCategoriaEditando(null);
    setMensaje('');
    setError('');
    setModalAbierto(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!esAdmin) {
      return;
    }

    const datos = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
    };

    if (!datos.nombre) {
      setError('Ingrese el nombre de la categoría');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      setMensaje('');

      if (categoriaEditando) {
        const respuesta = await actualizarCategoria(categoriaEditando.categoria_id, datos);
        setMensaje(respuesta.message);
      } else {
        const respuesta = await crearCategoria(datos);
        setMensaje(respuesta.message);
      }

      limpiarFormulario();
      setModalAbierto(false);
      window.setTimeout(() => {
        disparadorModalRef.current?.focus();
      }, 0);
      await cargarCategorias();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (categoria, event) => {
    if (!esAdmin) {
      return;
    }

    disparadorModalRef.current =
      event?.currentTarget ?? botonAgregarRef.current;
    setCategoriaEditando(categoria);
    setFormulario({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
    });
    setMensaje('');
    setError('');
    setModalAbierto(true);
  };

  const handleEliminar = async (categoria) => {
    if (!esAdmin) {
      return;
    }

    const confirmado = window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) {
      return;
    }

    try {
      setError('');
      setMensaje('');
      const respuesta = await eliminarCategoria(categoria.categoria_id);
      setMensaje(respuesta.message);

      if (categoriaEditando?.categoria_id === categoria.categoria_id) {
        limpiarFormulario();
        setModalAbierto(false);
      }

      await cargarCategorias();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!autorizado) {
    return (
      <section className="categorias">
        <p className="categorias__empty" role="status">
          Validando sesión...
        </p>
      </section>
    );
  }

  return (
    <section className="categorias">
      <div className="categorias__header">
        <a className="categorias__back-link" href="/dashboard">
          ← Volver al Dashboard
        </a>

        <p className="categorias__eyebrow">Administración</p>

        <div className="categorias__title-row">
          <h1>Categorías</h1>

          {esAdmin && (
            <button
              type="button"
              className="categorias__button categorias__button--add"
              onClick={handleAbrirNuevaCategoria}
              ref={botonAgregarRef}
            >
              Agregar categoría
            </button>
          )}
        </div>
      </div>

      {!modalAbierto && error && (
        <p
          className="categorias__alert categorias__alert--error categorias__alert--page"
          role="alert"
        >
          {error}
        </p>
      )}

      {mensaje && (
        <p
          className="categorias__alert categorias__alert--success categorias__alert--page"
          role="status"
        >
          {mensaje}
        </p>
      )}

      {esAdmin && modalAbierto && (
        <div
          className="categorias__modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >
          <div
            className="categorias__modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="categorias-modal-title"
          >
            <div className="categorias__modal-header">
              <h2
                className="categorias__modal-title"
                id="categorias-modal-title"
              >
                {categoriaEditando
                  ? 'Editar categoría'
                  : 'Nueva categoría'}
              </h2>

              <button
                className="categorias__modal-close"
                type="button"
                aria-label="Cerrar modal"
                onClick={cerrarModal}
              >
                ×
              </button>
            </div>

            <form className="categorias__form" onSubmit={handleSubmit}>

          <label>
            Nombre
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Ej: Herramientas"
              ref={primerCampoRef}
            />
          </label>

          <label>
            Descripción
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={handleChange}
              placeholder="Detalle breve de la categoría"
              rows="4"
            />
          </label>

          {error && (
            <p
              className="categorias__alert categorias__alert--error"
              role="alert"
            >
              {error}
            </p>
          )}
          {mensaje && (
            <p
              className="categorias__alert categorias__alert--success"
              role="status"
            >
              {mensaje}
            </p>
          )}

          <div className="categorias__actions">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>

            <button
              type="button"
              className="categorias__button--secondary"
              onClick={cerrarModal}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
            </form>
          </div>
        </div>
      )}

        <div className="categorias__list">
          <div className="categorias__list-header">
            <h2>Lista de categorías</h2>
            <span>{categorias.length}</span>
          </div>

          {cargando ? (
            <p className="categorias__empty">Cargando categorías...</p>
          ) : categorias.length === 0 ? (
            <p className="categorias__empty">No hay categorías cargadas.</p>
          ) : (
            <div className="categorias__table-wrap">
              <table className="categorias__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Fecha</th>
                    {esAdmin && <th>Editar</th>}
                    {esAdmin && <th>Eliminar</th>}
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.categoria_id}>
                      <td>{categoria.categoria_id}</td>
                      <td>{categoria.nombre}</td>
                      <td>{categoria.descripcion || 'Sin descripción'}</td>
                      <td>{categoria.fecha_creacion || '-'}</td>
                      {esAdmin && (
                        <td>
                          <button
                            type="button"
                            onClick={(event) =>
                              handleEditar(categoria, event)
                            }
                          >
                            Editar
                          </button>
                        </td>
                      )}
                      {esAdmin && (
                        <td>
                          <button
                            type="button"
                            className="categorias__button--danger"
                            onClick={() => handleEliminar(categoria)}
                          >
                            Eliminar
                          </button>
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
