<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../config/Csrf.php';
require_once __DIR__ . '/../models/Categoria.php';
require_once __DIR__ . '/../models/FeatureFlag.php';
require_once __DIR__ . '/../models/Producto.php';

header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Content-Type: application/json; charset=UTF-8');

const MAX_PRODUCTOS_IMPORTACION = 200;
const CAMPOS_PRODUCTO_IMPORTACION = [
    'codigo',
    'nombre',
    'descripcion',
    'precio',
    'stock',
    'categoria',
];

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responderImportacion(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function crearErrorImportacion(
    ?int $fila,
    ?string $campo,
    string $tipo,
    string $mensaje
): array {
    return [
        'fila' => $fila,
        'campo' => $campo,
        'tipo' => $tipo,
        'mensaje' => $mensaje,
    ];
}

function longitudTextoImportacion(string $valor): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($valor, 'UTF-8');
    }

    $longitud = preg_match_all('/./us', $valor);

    return $longitud !== false ? $longitud : strlen($valor);
}

function normalizarPrecioImportacion(mixed $valor): ?string
{
    if (
        is_bool($valor) ||
        !is_int($valor) && !is_float($valor) && !is_string($valor)
    ) {
        return null;
    }

    $precio = trim((string)$valor);

    if (preg_match('/^-?\d+(?:\.\d+)?$/D', $precio) !== 1) {
        return null;
    }

    $esNegativo = str_starts_with($precio, '-');
    $precioSinSigno = ltrim($precio, '-');
    [$entero, $decimales] = array_pad(explode('.', $precioSinSigno, 2), 2, '');
    $entero = ltrim($entero, '0');
    $entero = $entero !== '' ? $entero : '0';
    $decimales = rtrim($decimales, '0');

    if (
        $esNegativo && ($entero !== '0' || $decimales !== '') ||
        strlen($entero) > 8 ||
        strlen($decimales) > 2
    ) {
        return null;
    }

    return $decimales !== ''
        ? "{$entero}.{$decimales}"
        : $entero;
}

function normalizarStockImportacion(mixed $valor): ?int
{
    if (
        is_bool($valor) ||
        !is_int($valor) && !is_float($valor) && !is_string($valor)
    ) {
        return null;
    }

    $stock = trim((string)$valor);

    if (preg_match('/^-?\d+$/D', $stock) !== 1) {
        return null;
    }

    $esNegativo = str_starts_with($stock, '-');
    $stockSinSigno = ltrim($stock, '-');
    $stockSinCeros = ltrim($stockSinSigno, '0');
    $stockSinCeros = $stockSinCeros !== '' ? $stockSinCeros : '0';

    if (
        $esNegativo && $stockSinCeros !== '0' ||
        strlen($stockSinCeros) > 10 ||
        strlen($stockSinCeros) === 10 && $stockSinCeros > '2147483647'
    ) {
        return null;
    }

    return (int)$stockSinCeros;
}

function obtenerProductosImportacion(): array
{
    $contenido = file_get_contents('php://input');

    try {
        $datos = json_decode($contenido, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        responderImportacion([
            'success' => false,
            'message' => 'El cuerpo JSON no es válido.',
            'errores' => [],
        ], 400);
    }

    if (
        !is_array($datos) ||
        array_is_list($datos) ||
        array_keys($datos) !== ['productos'] ||
        !is_array($datos['productos']) ||
        !array_is_list($datos['productos'])
    ) {
        responderImportacion([
            'success' => false,
            'message' => 'El JSON debe contener únicamente un arreglo productos.',
            'errores' => [],
        ], 400);
    }

    return $datos['productos'];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderImportacion([
        'success' => false,
        'message' => 'Método no permitido.',
    ], 405);
}

try {
    requerirRolAdmin();
    requerirTokenCsrf();

    $database = new Database();
    $conn = $database->getConnection();
    $featureFlag = new FeatureFlag($conn);
    $flagImportacion = $featureFlag->obtenerPorClave('importar_productos');

    if ((int)($flagImportacion['habilitado'] ?? 0) !== 1) {
        responderImportacion([
            'success' => false,
            'message' => 'La importación de productos está deshabilitada.',
        ], 403);
    }

    $productos = obtenerProductosImportacion();

    if ($productos === [] || count($productos) > MAX_PRODUCTOS_IMPORTACION) {
        responderImportacion([
            'success' => false,
            'message' => 'La cantidad de productos del lote no es válida.',
            'errores' => [
                crearErrorImportacion(
                    null,
                    'productos',
                    'cantidad_invalida',
                    'El lote debe contener entre 1 y ' . MAX_PRODUCTOS_IMPORTACION . ' productos.'
                ),
            ],
        ], 422);
    }

    $errores = [];
    $productosNormalizados = [];
    $codigosParaValidar = [];
    $categoriasParaResolver = [];

    foreach ($productos as $indice => $filaProducto) {
        $numeroFila = $indice + 1;

        if (!is_array($filaProducto) || array_is_list($filaProducto)) {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                null,
                'fila_invalida',
                'Cada producto debe ser un objeto JSON.'
            );
            continue;
        }

        foreach (array_diff(array_keys($filaProducto), CAMPOS_PRODUCTO_IMPORTACION) as $campo) {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                (string)$campo,
                'campo_no_permitido',
                "El campo {$campo} no está permitido."
            );
        }

        $productoNormalizado = [
            'codigo' => null,
            'nombre' => null,
            'descripcion' => null,
            'precio' => null,
            'stock' => null,
            'categoria_id' => null,
        ];

        $codigo = $filaProducto['codigo'] ?? null;

        if (!is_string($codigo) || trim($codigo) === '') {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'codigo',
                'codigo_requerido',
                'El código es obligatorio.'
            );
        } else {
            $codigo = trim($codigo);

            if (longitudTextoImportacion($codigo) > 30) {
                $errores[] = crearErrorImportacion(
                    $numeroFila,
                    'codigo',
                    'longitud_invalida',
                    'El código no puede superar los 30 caracteres.'
                );
            } else {
                $productoNormalizado['codigo'] = $codigo;
                $codigosParaValidar[] = [
                    'fila' => $numeroFila,
                    'codigo' => $codigo,
                ];
            }
        }

        $nombre = $filaProducto['nombre'] ?? null;

        if (!is_string($nombre) || trim($nombre) === '') {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'nombre',
                'nombre_requerido',
                'El nombre es obligatorio.'
            );
        } else {
            $nombre = trim($nombre);

            if (longitudTextoImportacion($nombre) > 150) {
                $errores[] = crearErrorImportacion(
                    $numeroFila,
                    'nombre',
                    'longitud_invalida',
                    'El nombre no puede superar los 150 caracteres.'
                );
            } else {
                $productoNormalizado['nombre'] = $nombre;
            }
        }

        $descripcion = $filaProducto['descripcion'] ?? null;

        if ($descripcion !== null && !is_string($descripcion)) {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'descripcion',
                'descripcion_invalida',
                'La descripción debe ser texto o null.'
            );
        } else {
            $descripcion = $descripcion !== null ? trim($descripcion) : null;
            $descripcion = $descripcion !== '' ? $descripcion : null;

            if ($descripcion !== null && strlen($descripcion) > 65535) {
                $errores[] = crearErrorImportacion(
                    $numeroFila,
                    'descripcion',
                    'longitud_invalida',
                    'La descripción supera el tamaño permitido.'
                );
            } else {
                $productoNormalizado['descripcion'] = $descripcion;
            }
        }

        $precio = normalizarPrecioImportacion($filaProducto['precio'] ?? null);

        if ($precio === null) {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'precio',
                'precio_invalido',
                'El precio debe estar entre 0 y 99999999.99 y tener hasta 2 decimales.'
            );
        } else {
            $productoNormalizado['precio'] = $precio;
        }

        $stock = normalizarStockImportacion($filaProducto['stock'] ?? null);

        if ($stock === null) {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'stock',
                'stock_invalido',
                'El stock debe ser un entero entre 0 y 2147483647.'
            );
        } else {
            $productoNormalizado['stock'] = $stock;
        }

        $categoria = $filaProducto['categoria'] ?? null;

        if (!is_string($categoria) || trim($categoria) === '') {
            $errores[] = crearErrorImportacion(
                $numeroFila,
                'categoria',
                'categoria_requerida',
                'La categoría es obligatoria.'
            );
        } else {
            $categoria = trim($categoria);

            if (longitudTextoImportacion($categoria) > 100) {
                $errores[] = crearErrorImportacion(
                    $numeroFila,
                    'categoria',
                    'longitud_invalida',
                    'La categoría no puede superar los 100 caracteres.'
                );
            } else {
                $categoriasParaResolver[] = [
                    'fila' => $numeroFila,
                    'nombre' => $categoria,
                ];
            }
        }

        $productosNormalizados[$numeroFila] = $productoNormalizado;
    }

    $categoria = new Categoria($conn);

    foreach ($categoria->resolverIdsParaImportacion($categoriasParaResolver) as $fila => $categoriaId) {
        if ($categoriaId === null) {
            $errores[] = crearErrorImportacion(
                $fila,
                'categoria',
                'categoria_inexistente',
                'La categoría indicada no existe.'
            );
        } else {
            $productosNormalizados[$fila]['categoria_id'] = $categoriaId;
        }
    }

    $producto = new Producto($conn);
    $analisisCodigos = $producto->analizarCodigosImportacion($codigosParaValidar);

    foreach ($analisisCodigos['duplicados'] as $duplicado) {
        $errores[] = crearErrorImportacion(
            (int)$duplicado['fila'],
            'codigo',
            'codigo_duplicado_lote',
            'El código está repetido dentro del lote.'
        );
    }

    foreach ($analisisCodigos['existentes'] as $existente) {
        $errores[] = crearErrorImportacion(
            (int)$existente['fila'],
            'codigo',
            'codigo_existente',
            'El código ya pertenece a un producto existente.'
        );
    }

    if ($errores !== []) {
        usort(
            $errores,
            fn(array $a, array $b): int =>
                ($a['fila'] ?? 0) <=> ($b['fila'] ?? 0)
                ?: strcmp((string)$a['campo'], (string)$b['campo'])
        );

        $soloConflictos = array_reduce(
            $errores,
            fn(bool $resultado, array $error): bool =>
                $resultado && in_array($error['tipo'], [
                    'codigo_duplicado_lote',
                    'codigo_existente',
                ], true),
            true
        );

        responderImportacion([
            'success' => false,
            'message' => $soloConflictos
                ? 'El lote contiene conflictos de códigos.'
                : 'El lote contiene datos inválidos.',
            'errores' => $errores,
        ], $soloConflictos ? 409 : 422);
    }

    ksort($productosNormalizados);
    $productosParaImportar = array_values($productosNormalizados);

    try {
        $conn->beginTransaction();
        $cantidadImportada = $producto->importarLote($productosParaImportar);
        $conn->commit();
    } catch (Throwable $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        if ($e instanceof PDOException && $e->getCode() === '23000') {
            responderImportacion([
                'success' => false,
                'message' => 'Los datos cambiaron antes de completar la importación.',
                'errores' => [
                    crearErrorImportacion(
                        null,
                        null,
                        'conflicto_concurrente',
                        'No se insertó ningún producto. Revisá nuevamente el lote.'
                    ),
                ],
            ], 409);
        }

        throw $e;
    }

    responderImportacion([
        'success' => true,
        'message' => 'Productos importados correctamente.',
        'importados' => $cantidadImportada,
    ], 201);
} catch (PDOException $e) {
    responderImportacion([
        'success' => false,
        'message' => 'Ocurrió un error en la base de datos.',
    ], 500);
} catch (Throwable $e) {
    responderImportacion([
        'success' => false,
        'message' => 'Ocurrió un error interno.',
    ], 500);
}
