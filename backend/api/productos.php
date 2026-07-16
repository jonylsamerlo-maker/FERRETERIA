<?php



declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Producto.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $database = new Database();
    $conn = $database->getConnection();

    $producto = new Producto($conn);

    echo json_encode($producto->listar(), JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'error' => true,
        'mensaje' => $e->getMessage()
    ]);
}