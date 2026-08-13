<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../config/Csrf.php';
require_once __DIR__ . '/../models/FeatureFlag.php';

configurarCors('GET, PUT, OPTIONS', true);
header('Content-Type: application/json; charset=UTF-8');

const FEATURE_FLAGS_PERMITIDOS = [
    'exportar_excel',
    'exportar_pdf',
    'importar_productos',
];

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responderFeatureFlags(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function obtenerDatosFeatureFlag(): array
{
    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($datos)) {
        responderFeatureFlags([
            'success' => false,
            'message' => 'JSON inválido.'
        ], 400);
    }

    return $datos;
}

function validarClaveFeatureFlag(mixed $clave): string
{
    if (!is_string($clave) || !in_array($clave, FEATURE_FLAGS_PERMITIDOS, true)) {
        responderFeatureFlags([
            'success' => false,
            'message' => 'La clave solicitada no está permitida.'
        ], 400);
    }

    return $clave;
}

try {
    $database = new Database();
    $conn = $database->getConnection();
    $featureFlag = new FeatureFlag($conn);

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            requerirUsuarioAutenticado();

            $flags = [];

            foreach ($featureFlag->listar() as $flag) {
                if (!in_array($flag['clave'], FEATURE_FLAGS_PERMITIDOS, true)) {
                    continue;
                }

                $flags[$flag['clave']] = (bool)$flag['habilitado'];
            }

            foreach (FEATURE_FLAGS_PERMITIDOS as $clavePermitida) {
                $flags[$clavePermitida] = $flags[$clavePermitida] ?? false;
            }

            responderFeatureFlags($flags);

        case 'PUT':
            requerirRolAdmin();
            requerirTokenCsrf();

            $datos = obtenerDatosFeatureFlag();
            $clave = validarClaveFeatureFlag($datos['clave'] ?? null);

            if (!array_key_exists('habilitado', $datos) || !is_bool($datos['habilitado'])) {
                responderFeatureFlags([
                    'success' => false,
                    'message' => 'El valor habilitado debe ser booleano.'
                ], 400);
            }

            if ($featureFlag->obtenerPorClave($clave) === null) {
                responderFeatureFlags([
                    'success' => false,
                    'message' => 'Feature flag no encontrado.'
                ], 404);
            }

            if (!$featureFlag->actualizarEstado($clave, $datos['habilitado'])) {
                responderFeatureFlags([
                    'success' => false,
                    'message' => 'No se pudo actualizar el feature flag.'
                ], 400);
            }

            responderFeatureFlags([
                'success' => true,
                'message' => 'Feature flag actualizado correctamente.',
                'data' => [
                    'clave' => $clave,
                    'habilitado' => $datos['habilitado'],
                ],
            ]);

        default:
            responderFeatureFlags([
                'success' => false,
                'message' => 'Método no permitido.'
            ], 405);
    }
} catch (PDOException $e) {
    responderFeatureFlags([
        'success' => false,
        'message' => 'Ocurrió un error en la base de datos.'
    ], 500);
} catch (Throwable $e) {
    responderFeatureFlags([
        'success' => false,
        'message' => 'Ocurrió un error interno.'
    ], 500);
}
