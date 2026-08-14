<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../config/Csrf.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../models/ProductoImagen.php';

configurarCors('GET, POST, PATCH, DELETE, OPTIONS', true);
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responderImagenes(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function validarIdQuery(mixed $id, string $campo): int
{
    if (!is_string($id) || !ctype_digit($id) || (int)$id <= 0) {
        responderImagenes([
            'success' => false,
            'message' => "El campo {$campo} no es válido.",
        ], 400);
    }

    return (int)$id;
}

function validarIdJson(mixed $id, string $campo): int
{
    if (!is_int($id) || $id <= 0) {
        responderImagenes([
            'success' => false,
            'message' => "El campo {$campo} no es válido.",
        ], 400);
    }

    return $id;
}

function obtenerDatosJson(array $camposPermitidos): array
{
    try {
        $datos = json_decode(
            file_get_contents('php://input'),
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $e) {
        responderImagenes([
            'success' => false,
            'message' => 'JSON inválido.',
        ], 400);
    }

    if (
        !is_array($datos) ||
        array_is_list($datos) ||
        count($datos) !== count($camposPermitidos) ||
        array_diff(array_keys($datos), $camposPermitidos) !== [] ||
        array_diff($camposPermitidos, array_keys($datos)) !== []
    ) {
        responderImagenes([
            'success' => false,
            'message' => 'El cuerpo de la solicitud no es válido.',
        ], 400);
    }

    return $datos;
}

function validarRutaImagen(mixed $ruta): string
{
    if (!is_string($ruta)) {
        responderImagenes([
            'success' => false,
            'message' => 'La ruta de imagen no es válida.',
        ], 422);
    }

    $rutaNormalizada = trim($ruta);

    if (
        $rutaNormalizada === '' ||
        preg_match('#^img/productos/[^/\\\\]+$#D', $rutaNormalizada) !== 1
    ) {
        responderImagenes([
            'success' => false,
            'message' => 'La ruta de imagen no es válida.',
        ], 422);
    }

    $directorio = realpath(__DIR__ . '/../img/productos');
    $archivo = realpath(__DIR__ . '/../' . $rutaNormalizada);

    if (
        $directorio === false ||
        $archivo === false ||
        !is_file($archivo) ||
        !str_starts_with($archivo, $directorio . DIRECTORY_SEPARATOR)
    ) {
        responderImagenes([
            'success' => false,
            'message' => 'La imagen indicada no está disponible.',
        ], 422);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);

    if ($finfo === false) {
        responderImagenes([
            'success' => false,
            'message' => 'No se pudo validar la imagen.',
        ], 422);
    }

    $mime = finfo_file($finfo, $archivo);
    finfo_close($finfo);

    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true)) {
        responderImagenes([
            'success' => false,
            'message' => 'La imagen indicada no tiene un formato permitido.',
        ], 422);
    }

    return $rutaNormalizada;
}

function obtenerProductoOResponder(Producto $producto, int $productoId): array
{
    $productoEncontrado = $producto->obtenerPorId($productoId);

    if ($productoEncontrado === null) {
        responderImagenes([
            'success' => false,
            'message' => 'Producto no encontrado.',
        ], 404);
    }

    return $productoEncontrado;
}

try {
    requerirRolAdmin();

    $database = new Database();
    $conn = $database->getConnection();
    $producto = new Producto($conn);
    $productoImagen = new ProductoImagen($conn);

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $productoId = validarIdQuery($_GET['producto_id'] ?? null, 'producto_id');
            obtenerProductoOResponder($producto, $productoId);

            responderImagenes([
                'producto_id' => $productoId,
                'imagenes' => $productoImagen->listarPorProducto($productoId),
            ]);

        case 'POST':
            requerirTokenCsrf();
            $datos = obtenerDatosJson(['producto_id', 'ruta']);
            $productoId = validarIdJson($datos['producto_id'], 'producto_id');
            obtenerProductoOResponder($producto, $productoId);
            $ruta = validarRutaImagen($datos['ruta']);
            $imagen = $productoImagen->asociar($productoId, $ruta);

            if ($imagen === null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'Producto no encontrado.',
                ], 404);
            }

            responderImagenes([
                'success' => true,
                'message' => 'Imagen asociada correctamente.',
                'imagen' => $imagen,
            ], 201);

        case 'PATCH':
            requerirTokenCsrf();
            $datos = obtenerDatosJson([
                'producto_id',
                'imagen_id',
                'operacion',
                'direccion',
            ]);
            $productoId = validarIdJson($datos['producto_id'], 'producto_id');
            $imagenId = validarIdJson($datos['imagen_id'], 'imagen_id');
            obtenerProductoOResponder($producto, $productoId);
            $imagenActual = $productoImagen->obtenerPorIdYProducto($productoId, $imagenId);

            if ($imagenActual === null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'Imagen no encontrada.',
                ], 404);
            }

            if ($datos['operacion'] === 'mover') {
                if (!is_string($datos['direccion'])) {
                    responderImagenes([
                        'success' => false,
                        'message' => 'La dirección de movimiento no es válida.',
                    ], 400);
                }

                $imagen = $productoImagen->mover(
                    $productoId,
                    $imagenId,
                    $datos['direccion']
                );

                responderImagenes([
                    'success' => true,
                    'message' => 'Orden de imagen actualizado correctamente.',
                    'imagen' => $imagen,
                ]);
            }

            if ($datos['operacion'] !== 'principal' || $datos['direccion'] !== null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'La operación de imagen no es válida.',
                ], 400);
            }

            validarRutaImagen($imagenActual['ruta']);
            $imagen = $productoImagen->establecerPrincipal($productoId, $imagenId);

            if ($imagen === null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'Imagen no encontrada.',
                ], 404);
            }

            responderImagenes([
                'success' => true,
                'message' => 'Imagen principal actualizada correctamente.',
                'imagen' => $imagen,
            ]);

        case 'DELETE':
            requerirTokenCsrf();
            $productoId = validarIdQuery($_GET['producto_id'] ?? null, 'producto_id');
            $imagenId = validarIdQuery($_GET['imagen_id'] ?? null, 'imagen_id');
            obtenerProductoOResponder($producto, $productoId);
            $imagenActual = $productoImagen->obtenerPorIdYProducto($productoId, $imagenId);

            if ($imagenActual === null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'Imagen no encontrada.',
                ], 404);
            }

            if ((int)$imagenActual['principal'] === 1) {
                $candidatas = array_values(array_filter(
                    $productoImagen->listarPorProducto($productoId),
                    fn(array $imagen): bool =>
                        (int)$imagen['imagen_id'] !== $imagenId
                ));

                if ($candidatas !== []) {
                    validarRutaImagen($candidatas[0]['ruta']);
                }
            }

            $resultado = $productoImagen->eliminarConReasignacionPrincipal(
                $productoId,
                $imagenId
            );

            if ($resultado === null) {
                responderImagenes([
                    'success' => false,
                    'message' => 'Imagen no encontrada.',
                ], 404);
            }

            responderImagenes([
                'success' => true,
                'message' => 'Imagen eliminada correctamente.',
                'principal' => $resultado['principal'],
            ]);

        default:
            responderImagenes([
                'success' => false,
                'message' => 'Método no permitido.',
            ], 405);
    }
} catch (ProductoImagenConflicto $e) {
    responderImagenes([
        'success' => false,
        'message' => $e->getMessage(),
    ], 409);
} catch (InvalidArgumentException $e) {
    responderImagenes([
        'success' => false,
        'message' => 'Los datos de imagen no son válidos.',
    ], 400);
} catch (PDOException $e) {
    responderImagenes([
        'success' => false,
        'message' => 'Ocurrió un error en la base de datos.',
    ], 500);
} catch (Throwable $e) {
    responderImagenes([
        'success' => false,
        'message' => 'Ocurrió un error interno.',
    ], 500);
}
