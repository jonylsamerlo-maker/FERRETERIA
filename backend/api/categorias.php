<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Categoria.php';

header('Content-Type: application/json; charset=utf-8');

try {

    $database = new Database();
    $conn = $database->getConnection();

    $categoria = new Categoria($conn);

    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {

        case 'GET':

            echo json_encode(
                $categoria->listar(),
                JSON_UNESCAPED_UNICODE
            );

            break;

        default:

            http_response_code(405);

            echo json_encode([
                "mensaje" => "Método no permitido"
            ]);

            break;
    }

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "mensaje" => $e->getMessage()
    ]);
}