<?php

declare(strict_types=1);

ini_set('display_errors', '1');
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:4321");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../models/Usuario.php";

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos) {
    echo json_encode([
        "success" => false,
        "message" => "Datos inválidos."
    ]);
    exit;
}

if (empty($datos["username"]) || empty($datos["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario y contraseña son obligatorios."
    ]);
    exit;
}

$database = new Database();
$conn = $database->getConnection();

$usuarioModel = new Usuario($conn);

$usuario = $usuarioModel->buscarPorUsuario($datos["username"]);

if ($usuario === null) {
    echo json_encode([
        "success" => false,
        "message" => "Usuario no encontrado."
    ]);
    exit;
}

if (!password_verify($datos["password"], $usuario["password"])) {
    echo json_encode([
        "success" => false,
        "message" => "Contraseña incorrecta."
    ]);
    exit;
}

unset($usuario["password"]);

echo json_encode([
    "success" => true,
    "message" => "Login correcto.",
    "usuario" => $usuario
]);