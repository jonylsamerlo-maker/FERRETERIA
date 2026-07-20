import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../../config/appConfig';
import { getCategorias } from '../../categorias/services/categoriaApi';
import { crearProducto, getProductos, subirImagen } from '../services/productoApi';
import './Productos.css';

const formularioInicial = {
  codigo: '',
  nombre: '',
  precio: '',
  stock: '',
  categoria_id: '',
  imagen: null,
};

export default function Productos() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const [productosData, categoriasData] = await Promise.all([
        getProductos(),
        getCategorias(),
      ]);

      setProductos(Array.isArray(productosData) ? productosData : []);
      setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
    } catch (err) {
      setError(err.message);
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
      [name]: files ? files[0] : value,
    }));
  };

  const obtenerUsuarioId = () => {
    const usuarioGuardado = localStorage.getItem('usuario');

    if (!usuarioGuardado) {
      return null;
    }

    const usuario = JSON.parse(usuarioGuardado);
    return usuario.usuario_id || null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formulario.codigo.trim() ||
      !formulario.nombre.trim() ||
      !formulario.precio ||
      !formulario.stock ||
      !formulario.categoria_id ||
      !formulario.imagen
    ) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      setMensaje('');
      setError('');

      const imagenSubida = await subirImagen(formulario.imagen);

      await crearProducto({
        codigo: formulario.codigo.trim(),
        nombre: formulario.nombre.trim(),
        precio: formulario.precio,
        stock: formulario.stock,
        categoria_id: formulario.categoria_id,
        imagen: imagenSubida.ruta,
        usuario_id: obtenerUsuarioId(),
      });

      setFormulario(formularioInicial);
      event.target.reset();
      setMensaje('Producto creado correctamente.');
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const obtenerImagen = (ruta) => {
    if (!ruta) {
      return '';
    }

    return ruta.startsWith('http') ? ruta : `${API_BASE_URL}/${ruta}`;
  };

  return (
    <section className="productos">
      <div className="productos__header">
        <p className="productos__eyebrow">Administración</p>
        <h1 className="productos__title">Productos</h1>
      </div>

      <form className="productos__form" onSubmit={handleSubmit}>
        <div className="productos__field">
          <label className="productos__label" htmlFor="codigo">Código</label>
          <input
            id="codigo"
            className="productos__input"
            type="text"
            name="codigo"
            value={formulario.codigo}
            onChange={handleChange}
          />
        </div>

        <div className="productos__field">
          <label className="productos__label" htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            className="productos__input"
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
          />
        </div>

        <div className="productos__field">
          <label className="productos__label" htmlFor="precio">Precio</label>
          <input
            id="precio"
            className="productos__input"
            type="number"
            min="0"
            step="0.01"
            name="precio"
            value={formulario.precio}
            onChange={handleChange}
          />
        </div>

        <div className="productos__field">
          <label className="productos__label" htmlFor="stock">Stock</label>
          <input
            id="stock"
            className="productos__input"
            type="number"
            min="0"
            step="1"
            name="stock"
            value={formulario.stock}
            onChange={handleChange}
          />
        </div>

        <div className="productos__field">
          <label className="productos__label" htmlFor="categoria_id">Categoría</label>
          <select
            id="categoria_id"
            className="productos__input"
            name="categoria_id"
            value={formulario.categoria_id}
            onChange={handleChange}
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.categoria_id} value={categoria.categoria_id}>
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="productos__field">
          <label className="productos__label" htmlFor="imagen">Imagen</label>
          <input
            id="imagen"
            className="productos__input"
            type="file"
            name="imagen"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleChange}
          />
        </div>

        {error && <p className="productos__message productos__message--error">{error}</p>}
        {mensaje && <p className="productos__message productos__message--success">{mensaje}</p>}

        <button className="productos__button" type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear producto'}
        </button>
      </form>

      <div className="productos__list">
        <h2 className="productos__subtitle">Listado de productos</h2>

        {cargando ? (
          <p className="productos__empty">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="productos__empty">No hay productos cargados.</p>
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
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.producto_id}>
                    <td>
                      {producto.imagen && (
                        <img
                          className="productos__image"
                          src={obtenerImagen(producto.imagen)}
                          alt={producto.nombre}
                        />
                      )}
                    </td>
                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio}</td>
                    <td>{producto.stock}</td>
                    <td>{producto.categoria}</td>
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
