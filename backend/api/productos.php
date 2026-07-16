<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Producto.php';

header('Content-Type: application/json; charset=utf-8');

try {

    $database = new Database();
    $conn = $database->getConnection();

    $producto = new Producto($conn);

    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {

        case 'GET':

            echo json_encode(
                $producto->listar(),
                JSON_UNESCAPED_UNICODE
            );

            break;

        case 'POST':

            $datos = json_decode(file_get_contents("php://input"), true);

            if ($producto->crear($datos)) {

                http_response_code(201);

                echo json_encode([
                    "mensaje" => "Producto creado correctamente"
                ]);

            } else {

                http_response_code(400);

                echo json_encode([
                    "mensaje" => "No se pudo crear el producto"
                ]);
            }

            break;

        default:

            http_response_code(405);

            echo json_encode([
                "mensaje" => "Método no permitido"
            ]);
    }

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        "error" => true,
        "mensaje" => $e->getMessage()
    ]);
}