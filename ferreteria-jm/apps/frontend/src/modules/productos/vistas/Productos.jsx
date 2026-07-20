import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/appConfig';
import { getCategorias } from '../../categorias/services/categoriaApi';
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  getProductos,
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

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const [productosData, categoriasData] = await Promise.all([
        getProductos(),
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
    cargarDatos();
  }, []);

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

    if (
      productoEditandoId === null &&
      !formulario.imagen
    ) {
      return 'Seleccioná una imagen.';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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

      if (!rutaImagen) {
        throw new Error(
          'No se pudo obtener la ruta de la imagen'
        );
      }

      const datosProducto = {
        codigo: formulario.codigo.trim(),
        nombre: formulario.nombre.trim(),
        descripcion:
          formulario.descripcion.trim() || null,
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        categoria_id: Number(formulario.categoria_id),
        imagen: rutaImagen,
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

  const handleEditar = (producto) => {
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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleCancelarEdicion = () => {
    limpiarFormulario();
    setMensaje('Edición cancelada.');
  };

  const handleEliminar = async (producto) => {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar el producto "${producto.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

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
      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el producto'
      );
    } finally {
      setEliminandoId(null);
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

  return (
    <section className="productos">
      <div className="productos__header">
        <p className="productos__eyebrow">
          Administración
        </p>

        <h1 className="productos__title">
          Productos
        </h1>
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

        {error && (
          <p className="productos__message productos__message--error">
            {error}
          </p>
        )}

        {mensaje && (
          <p className="productos__message productos__message--success">
            {mensaje}
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

          {productoEditandoId !== null && (
            <button
              className="productos__button productos__button--secondary"
              type="button"
              onClick={handleCancelarEdicion}
              disabled={guardando}
            >
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <div className="productos__list">
        <h2 className="productos__subtitle">
          Listado de productos
        </h2>

        {cargando ? (
          <p className="productos__empty">
            Cargando productos...
          </p>
        ) : productos.length === 0 ? (
          <p className="productos__empty">
            No hay productos cargados.
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
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productos.map((producto) => (
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
                    <td>${producto.precio}</td>
                    <td>{producto.stock}</td>
                    <td>{producto.categoria}</td>

                    <td>
                      <div className="productos__row-actions">
                        <button
                          className="productos__action-button"
                          type="button"
                          onClick={() =>
                            handleEditar(producto)
                          }
                          disabled={
                            eliminandoId ===
                            producto.producto_id
                          }
                        >
                          Modificar
                        </button>

                        <button
                          className="productos__action-button productos__action-button--danger"
                          type="button"
                          onClick={() =>
                            handleEliminar(producto)
                          }
                          disabled={
                            eliminandoId ===
                            producto.producto_id
                          }
                        >
                          {eliminandoId ===
                          producto.producto_id
                            ? 'Eliminando...'
                            : 'Eliminar'}
                        </button>
                      </div>
                    </td>
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