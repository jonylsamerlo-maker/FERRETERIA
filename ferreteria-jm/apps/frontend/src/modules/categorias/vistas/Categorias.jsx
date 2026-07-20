import { useEffect, useState } from 'react';
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
    cargarCategorias();
  }, []);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      await cargarCategorias();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setFormulario({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
    });
    setMensaje('');
    setError('');
  };

  const handleEliminar = async (categoria) => {
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
      }

      await cargarCategorias();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="categorias">
      <div className="categorias__header">
        <div>
          <p className="categorias__eyebrow">Administración</p>
          <h1>Categorías</h1>
        </div>
      </div>

      <div className="categorias__grid">
        <form className="categorias__form" onSubmit={handleSubmit}>
          <h2>{categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}</h2>

          <label>
            Nombre
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Ej: Herramientas"
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

          {error && <p className="categorias__alert categorias__alert--error">{error}</p>}
          {mensaje && <p className="categorias__alert categorias__alert--success">{mensaje}</p>}

          <div className="categorias__actions">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>

            {categoriaEditando && (
              <button type="button" className="categorias__button--secondary" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>

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
                    <th>Editar</th>
                    <th>Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((categoria) => (
                    <tr key={categoria.categoria_id}>
                      <td>{categoria.categoria_id}</td>
                      <td>{categoria.nombre}</td>
                      <td>{categoria.descripcion || 'Sin descripción'}</td>
                      <td>{categoria.fecha_creacion || '-'}</td>
                      <td>
                        <button type="button" onClick={() => handleEditar(categoria)}>
                          Editar
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="categorias__button--danger"
                          onClick={() => handleEliminar(categoria)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
