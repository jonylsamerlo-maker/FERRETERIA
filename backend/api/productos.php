<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../models/Producto.php';

header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Envía una respuesta JSON y detiene la ejecución.
 */
function responderJson(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/**
 * Valida que el ID recibido sea un número entero positivo.
 */
function validarId(mixed $id): int
{
    if (
        $id === null ||
        !ctype_digit((string)$id) ||
        (int)$id <= 0
    ) {
        responderJson([
            'mensaje' => 'El ID del producto no es válido'
        ], 400);
    }

    return (int)$id;
}

/**
 * Obtiene y valida el JSON enviado por el frontend.
 */
function obtenerDatosJson(): array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido, true);

    if (!is_array($datos)) {
        responderJson([
            'mensaje' => 'Los datos enviados no son válidos'
        ], 400);
    }

    return $datos;
}

/**
 * Valida los datos necesarios para crear o modificar un producto.
 */
function validarProducto(array $datos): void
{
    $camposObligatorios = [
        'codigo',
        'nombre',
        'precio',
        'stock',
        'categoria_id'
    ];

    foreach ($camposObligatorios as $campo) {
        if (
            !array_key_exists($campo, $datos) ||
            trim((string)$datos[$campo]) === ''
        ) {
            responderJson([
                'mensaje' => "El campo {$campo} es obligatorio"
            ], 400);
        }
    }

    if (
        !is_numeric($datos['precio']) ||
        !is_numeric($datos['stock']) ||
        !is_numeric($datos['categoria_id'])
    ) {
        responderJson([
            'mensaje' => 'Precio, stock y categoría deben ser valores numéricos'
        ], 400);
    }

    if ((float)$datos['precio'] < 0) {
        responderJson([
            'mensaje' => 'El precio no puede ser negativo'
        ], 400);
    }

    if ((int)$datos['stock'] < 0) {
        responderJson([
            'mensaje' => 'El stock no puede ser negativo'
        ], 400);
    }

    if ((int)$datos['categoria_id'] <= 0) {
        responderJson([
            'mensaje' => 'La categoría seleccionada no es válida'
        ], 400);
    }

    if (
        array_key_exists('imagen', $datos) &&
        $datos['imagen'] !== null &&
        !is_string($datos['imagen'])
    ) {
        responderJson([
            'mensaje' => 'La imagen del producto no es válida'
        ], 400);
    }
}

/**
 * Comprueba que la imagen sea un archivo generado por el endpoint de subida.
 */
function imagenProductoEsValida(mixed $imagen): bool
{
    if (!is_string($imagen)) {
        return false;
    }

    $rutaImagen = trim($imagen);

    if (
        $rutaImagen === '' ||
        preg_match('#^img/productos/[^/\\\\]+$#D', $rutaImagen) !== 1
    ) {
        return false;
    }

    $directorioImagenes = realpath(__DIR__ . '/../img/productos');
    $archivoImagen = realpath(__DIR__ . '/../' . $rutaImagen);

    if (
        $directorioImagenes === false ||
        $archivoImagen === false ||
        !is_file($archivoImagen) ||
        !str_starts_with(
            $archivoImagen,
            $directorioImagenes . DIRECTORY_SEPARATOR
        )
    ) {
        return false;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);

    if ($finfo === false) {
        return false;
    }

    $mime = finfo_file($finfo, $archivoImagen);
    finfo_close($finfo);

    return in_array($mime, [
        'image/jpeg',
        'image/png',
        'image/webp'
    ], true);
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $producto = new Producto($conn);

    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {
        case 'GET':
            $scope = $_GET['scope'] ?? null;

            if (
                $scope !== null &&
                !in_array($scope, ['public', 'admin'], true)
            ) {
                responderJson([
                    'mensaje' => 'El scope solicitado no es válido'
                ], 400);
            }

            if ($scope === 'admin') {
                requerirUsuarioAutenticado();
            }

            $id = $_GET['id'] ?? null;

            if ($id !== null) {
                $productoId = validarId($id);
                $productoEncontrado = $producto->obtenerPorId(
                    $productoId,
                    $scope === 'public'
                );

                if ($productoEncontrado === null) {
                    responderJson([
                        'mensaje' => 'Producto no encontrado'
                    ], 404);
                }

                responderJson($productoEncontrado);
            }

            responderJson(
                $scope === 'public'
                    ? $producto->listarPublicados()
                    : $producto->listar()
            );

        case 'POST':
            requerirRolAdmin();
            $datos = obtenerDatosJson();
            unset($datos['publicado']);

            validarProducto($datos);

            if (!$producto->crear($datos)) {
                responderJson([
                    'mensaje' => 'No se pudo crear el producto'
                ], 400);
            }

            responderJson([
                'mensaje' => 'Producto creado correctamente'
            ], 201);

        case 'PUT':
            requerirRolAdmin();
            $productoId = validarId($_GET['id'] ?? null);
            $datos = obtenerDatosJson();
            unset($datos['publicado']);

            validarProducto($datos);

            if (!$producto->actualizar($productoId, $datos)) {
                responderJson([
                    'mensaje' => 'No se pudo actualizar el producto'
                ], 400);
            }

            responderJson([
                'mensaje' => 'Producto actualizado correctamente'
            ]);

        case 'PATCH':
            requerirRolAdmin();
            $productoId = validarId($_GET['id'] ?? null);
            $datos = obtenerDatosJson();

            if (
                count($datos) !== 1 ||
                !array_key_exists('publicado', $datos) ||
                !is_int($datos['publicado']) ||
                !in_array($datos['publicado'], [0, 1], true)
            ) {
                responderJson([
                    'mensaje' => 'PATCH solo acepta publicado con valor 0 o 1'
                ], 400);
            }

            $productoEncontrado = $producto->obtenerPorId($productoId);

            if ($productoEncontrado === null) {
                responderJson([
                    'mensaje' => 'Producto no encontrado'
                ], 404);
            }

            if (
                $datos['publicado'] === 1 &&
                !imagenProductoEsValida($productoEncontrado['imagen'] ?? null)
            ) {
                responderJson([
                    'mensaje' => 'Agregá una imagen antes de publicar este producto.'
                ], 422);
            }

            if (!$producto->actualizarPublicado(
                $productoId,
                $datos['publicado']
            )) {
                responderJson([
                    'mensaje' => 'No se pudo actualizar la publicación del producto'
                ], 500);
            }

            responderJson([
                'mensaje' => $datos['publicado'] === 1
                    ? 'Producto publicado correctamente'
                    : 'Producto ocultado correctamente',
                'publicado' => $datos['publicado']
            ]);

        case 'DELETE':
            requerirRolAdmin();
            $productoId = validarId($_GET['id'] ?? null);

            if (!$producto->eliminar($productoId)) {
                responderJson([
                    'mensaje' => 'Producto no encontrado o no se pudo eliminar'
                ], 404);
            }

            responderJson([
                'mensaje' => 'Producto eliminado correctamente'
            ]);

        default:
            responderJson([
                'mensaje' => 'Método no permitido'
            ], 405);
    }
} catch (PDOException $e) {
    responderJson([
        'error' => true,
        'mensaje' => 'Ocurrió un error en la base de datos'
    ], 500);
} catch (Throwable $e) {
    responderJson([
        'error' => true,
        'mensaje' => 'Ocurrió un error interno'
    ], 500);
}
