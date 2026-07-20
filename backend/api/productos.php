<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Producto.php';

header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        'categoria_id',
        'imagen'
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
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $producto = new Producto($conn);

    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {
        case 'GET':
            $id = $_GET['id'] ?? null;

            if ($id !== null) {
                $productoId = validarId($id);
                $productoEncontrado = $producto->obtenerPorId($productoId);

                if ($productoEncontrado === null) {
                    responderJson([
                        'mensaje' => 'Producto no encontrado'
                    ], 404);
                }

                responderJson($productoEncontrado);
            }

            responderJson($producto->listar());

        case 'POST':
            $datos = obtenerDatosJson();

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
            $productoId = validarId($_GET['id'] ?? null);
            $datos = obtenerDatosJson();

            validarProducto($datos);

            if (!$producto->actualizar($productoId, $datos)) {
                responderJson([
                    'mensaje' => 'No se pudo actualizar el producto'
                ], 400);
            }

            responderJson([
                'mensaje' => 'Producto actualizado correctamente'
            ]);

        case 'DELETE':
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
        'mensaje' => $e->getMessage()
    ], 500);
}