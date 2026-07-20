<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../models/Categoria.php';

header("Access-Control-Allow-Origin: http://localhost:4321");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

function responderJson(bool $success, string $message, mixed $data = null, int $statusCode = 200): void
{
    http_response_code($statusCode);

    $respuesta = [
        "success" => $success,
        "message" => $message
    ];

    if ($data !== null) {
        $respuesta["data"] = $data;
    }

    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
}

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

try {

    $database = new Database();
    $conn = $database->getConnection();

    $categoria = new Categoria($conn);

    $metodo = $_SERVER['REQUEST_METHOD'];

    switch ($metodo) {

        case 'GET':

            responderJson(true, "Categorías listadas correctamente", $categoria->listar());

            break;

        case 'POST':

            $datos = json_decode(file_get_contents("php://input"), true);

            if (!is_array($datos) || empty(trim($datos['nombre'] ?? ''))) {
                responderJson(false, "Debe enviar el nombre de la categoría", null, 400);

                break;
            }

            $datos['nombre'] = trim($datos['nombre']);
            $datos['descripcion'] = trim($datos['descripcion'] ?? '');

            if ($categoria->existeNombre($datos['nombre'])) {
                responderJson(false, "Ya existe una categoría con ese nombre", null, 409);

                break;
            }

            if ($categoria->crear($datos)) {
                responderJson(true, "Categoría creada correctamente", null, 201);
            } else {
                responderJson(false, "No se pudo crear la categoría", null, 400);
            }

            break;

        case 'PUT':

            $id = $_GET['id'] ?? null;

            if (!$id) {
                responderJson(false, "Debe enviar el ID de la categoría", null, 400);

                break;
            }

            $datos = json_decode(file_get_contents("php://input"), true);

            if (!is_array($datos) || empty(trim($datos['nombre'] ?? ''))) {
                responderJson(false, "Debe enviar el nombre de la categoría", null, 400);

                break;
            }

            $datos['nombre'] = trim($datos['nombre']);
            $datos['descripcion'] = trim($datos['descripcion'] ?? '');

            if ($categoria->existeNombre($datos['nombre'], (int)$id)) {
                responderJson(false, "Ya existe una categoría con ese nombre", null, 409);

                break;
            }

            if ($categoria->actualizar((int)$id, $datos)) {
                responderJson(true, "Categoría actualizada correctamente");
            } else {
                responderJson(false, "No se pudo actualizar la categoría", null, 400);
            }

            break;

        case 'DELETE':

            $id = $_GET['id'] ?? null;

            if (!$id) {
                responderJson(false, "Debe enviar el ID de la categoría", null, 400);

                break;
            }

            if ($categoria->eliminar((int)$id)) {
                responderJson(true, "Categoría eliminada correctamente");
            } else {
                responderJson(false, "No se pudo eliminar la categoría", null, 400);
            }

            break;

        default:

            responderJson(false, "Método no permitido", null, 405);

            break;
    }

} catch (Throwable $e) {

    responderJson(false, $e->getMessage(), null, 500);
}
