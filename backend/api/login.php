<?php

declare(strict_types=1);

header("Access-Control-Allow-Origin: http://localhost:4321");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once __DIR__ . "/../config/Database.php";
require_once __DIR__ . "/../config/Auth.php";
require_once __DIR__ . "/../config/Csrf.php";
require_once __DIR__ . "/../models/Usuario.php";

function responderLogin(bool $success, string $message, ?array $usuario = null, int $statusCode = 200): never
{
    http_response_code($statusCode);

    echo json_encode([
        "success" => $success,
        "message" => $message,
        "usuario" => $usuario,
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === 'GET') {
    $usuario = obtenerUsuarioSesion();

    if ($usuario === null) {
        responderLogin(false, "No hay una sesión activa.", null, 401);
    }

    responderLogin(true, "Sesión activa.", $usuario);
}

if ($metodo === 'DELETE') {
    requerirUsuarioAutenticado();
    requerirTokenCsrf();
    invalidarTokenCsrf();
    cerrarSesionAutenticada();
    responderLogin(true, "Sesión cerrada correctamente.");
}

if ($metodo !== 'POST') {
    responderLogin(false, "Método no permitido.", null, 405);
}

$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos)) {
    responderLogin(false, "Datos inválidos.", null, 400);
}

if (empty($datos["username"]) || empty($datos["password"])) {
    responderLogin(false, "Usuario y contraseña son obligatorios.", null, 400);
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    $usuarioModel = new Usuario($conn);

    $usuario = $usuarioModel->buscarPorUsuario($datos["username"]);

    if ($usuario === null) {
        responderLogin(false, "Usuario o contraseña incorrectos.", null, 401);
    }

    if (!password_verify($datos["password"], $usuario["password"])) {
        responderLogin(false, "Usuario o contraseña incorrectos.", null, 401);
    }

    unset($usuario["password"]);
    guardarUsuarioSesion($usuario);
    regenerarTokenCsrf();

    responderLogin(true, "Login correcto.", $usuario);
} catch (Throwable $e) {
    responderLogin(false, "Ocurrió un error interno.", null, 500);
}
