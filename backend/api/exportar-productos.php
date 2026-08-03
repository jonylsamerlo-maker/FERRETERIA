<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../models/FeatureFlag.php';
require_once __DIR__ . '/../models/Producto.php';

header('Access-Control-Allow-Origin: http://localhost:4321');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Expose-Headers: Content-Disposition');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responderJsonExportacion(array $datos, int $codigo): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function escribirFilaCsv($salida, array $fila): void
{
    fputcsv($salida, $fila, ';');
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJsonExportacion([
            'success' => false,
            'message' => 'Método no permitido.'
        ], 405);
    }

    requerirRolAdmin();

    $database = new Database();
    $conn = $database->getConnection();

    $featureFlag = new FeatureFlag($conn);
    $flagExcel = $featureFlag->obtenerPorClave('exportar_excel');

    if ($flagExcel === null || !(bool)$flagExcel['habilitado']) {
        responderJsonExportacion([
            'success' => false,
            'message' => 'La exportación a Excel no está habilitada.'
        ], 403);
    }

    $producto = new Producto($conn);
    $productos = $producto->listar();
    $fecha = date('Y-m-d');
    $filename = "inventario-ferreteria-jm-{$fecha}.csv";

    header('Content-Type: text/csv; charset=UTF-8');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');

    $salida = fopen('php://output', 'w');

    if ($salida === false) {
        responderJsonExportacion([
            'success' => false,
            'message' => 'No se pudo generar el archivo.'
        ], 500);
    }

    echo "\xEF\xBB\xBF";

    escribirFilaCsv($salida, [
        'Código',
        'Nombre',
        'Descripción',
        'Categoría',
        'Precio',
        'Stock',
        'Fecha de creación',
    ]);

    foreach ($productos as $item) {
        escribirFilaCsv($salida, [
            $item['codigo'] ?? '',
            $item['nombre'] ?? '',
            $item['descripcion'] ?? '',
            $item['categoria'] ?? '',
            number_format((float)($item['precio'] ?? 0), 2, ',', ''),
            (string)(int)($item['stock'] ?? 0),
            $item['fecha_creacion'] ?? '',
        ]);
    }

    fclose($salida);
    exit;
} catch (PDOException $e) {
    responderJsonExportacion([
        'success' => false,
        'message' => 'Ocurrió un error en la base de datos.'
    ], 500);
} catch (Throwable $e) {
    responderJsonExportacion([
        'success' => false,
        'message' => 'Ocurrió un error interno.'
    ], 500);
}
