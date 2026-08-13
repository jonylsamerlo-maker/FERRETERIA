import { useState } from "react";

function GaleriaProducto({ imagenes, nombre }) {
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const imagenActual = imagenes[imagenSeleccionada] ?? imagenes[0];

  if (!imagenActual) {
    return null;
  }

  return (
    <div className="producto-galeria">
      <div className="producto-galeria__miniaturas" aria-label="Imágenes del producto">
        {imagenes.map((imagen, indice) => {
          const seleccionada = indice === imagenSeleccionada;

          return (
            <button
              className={`producto-galeria__miniatura${seleccionada ? " producto-galeria__miniatura--seleccionada" : ""}`}
              type="button"
              key={imagen.imagen_id}
              aria-label={`Ver imagen ${indice + 1} de ${nombre}`}
              aria-pressed={seleccionada}
              onClick={() => setImagenSeleccionada(indice)}
            >
              <img
                src={imagen.src}
                alt={`Miniatura ${indice + 1} de ${nombre}`}
              />
            </button>
          );
        })}
      </div>

      <div className="producto-detalle__media producto-detalle__media--galeria">
        <img
          className="producto-detalle__imagen"
          src={imagenActual.src}
          alt={`${nombre}, imagen ${imagenSeleccionada + 1}`}
        />
      </div>
    </div>
  );
}

export default GaleriaProducto;
