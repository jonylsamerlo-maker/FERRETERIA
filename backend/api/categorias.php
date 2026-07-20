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

        case 'POST':

            $datos = json_decode(file_get_contents("php://input"), true);

            if (!is_array($datos) || empty(trim($datos['nombre'] ?? ''))) {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "Debe enviar el nombre de la categoría"
                ]);

                break;
            }

            if ($categoria->crear($datos)) {
                http_response_code(201);

                echo json_encode([
                    "mensaje" => "Categoría creada correctamente"
                ]);
            } else {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "No se pudo crear la categoría"
                ]);
            }

            break;

        case 'PUT':

            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "Debe enviar el ID de la categoría"
                ]);

                break;
            }

            $datos = json_decode(file_get_contents("php://input"), true);

            if (!is_array($datos) || empty(trim($datos['nombre'] ?? ''))) {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "Debe enviar el nombre de la categoría"
                ]);

                break;
            }

            if ($categoria->actualizar((int)$id, $datos)) {
                http_response_code(200);

                echo json_encode([
                    "mensaje" => "Categoría actualizada correctamente"
                ]);
            } else {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "No se pudo actualizar la categoría"
                ]);
            }

            break;

        case 'DELETE':

            $id = $_GET['id'] ?? null;

            if (!$id) {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "Debe enviar el ID de la categoría"
                ]);

                break;
            }

            if ($categoria->eliminar((int)$id)) {
                http_response_code(200);

                echo json_encode([
                    "mensaje" => "Categoría eliminada correctamente"
                ]);
            } else {
                http_response_code(400);

                echo json_encode([
                    "mensaje" => "No se pudo eliminar la categoría"
                ]);
            }

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
