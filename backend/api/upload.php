<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        'mensaje' => 'Método no permitido.'
    ]);

    exit;
}

$directorio = __DIR__ . '/../img/productos/';

if (!is_dir($directorio) && !mkdir($directorio, 0777, true) && !is_dir($directorio)) {
    http_response_code(500);

    echo json_encode([
        'mensaje' => 'No se pudo crear el directorio de subida.'
    ]);

    exit;
}

if (!isset($_FILES['imagen']) || !is_array($_FILES['imagen'])) {
    http_response_code(400);

    echo json_encode([
        'mensaje' => 'No se recibió ninguna imagen.'
    ]);

    exit;
}

$archivo = $_FILES['imagen'];

if ($archivo['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);

    echo json_encode([
        'mensaje' => 'La imagen no se pudo subir correctamente.'
    ]);

    exit;
}

if (!is_uploaded_file($archivo['tmp_name'])) {
    http_response_code(400);

    echo json_encode([
        'mensaje' => 'El archivo enviado no es válido.'
    ]);

    exit;
}

$maxSize = 2 * 1024 * 1024;
if ($archivo['size'] > $maxSize) {
    http_response_code(413);

    echo json_encode([
        'mensaje' => 'La imagen excede el tamaño máximo permitido.'
    ]);

    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $archivo['tmp_name']);
finfo_close($finfo);

$tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!in_array($mime, $tiposPermitidos, true)) {
    http_response_code(415);

    echo json_encode([
        'mensaje' => 'El tipo de archivo no está permitido.'
    ]);

    exit;
}

$extension = strtolower(pathinfo(basename($archivo['name']), PATHINFO_EXTENSION));
$mimeToExtension = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

$extensionFinal = $mimeToExtension[$mime] ?? $extension;
$nombreBase = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo(basename($archivo['name']), PATHINFO_FILENAME));
$nombreArchivo = uniqid('img_', true) . '_' . ($nombreBase !== '' ? $nombreBase : 'imagen') . '.' . $extensionFinal;

$rutaDestino = $directorio . $nombreArchivo;

if (move_uploaded_file($archivo['tmp_name'], $rutaDestino)) {
    http_response_code(201);

    echo json_encode([
        'mensaje' => 'Imagen subida correctamente.',
        'ruta' => 'img/productos/' . $nombreArchivo
    ]);
} else {
    http_response_code(500);

    echo json_encode([
        'mensaje' => 'Error al subir la imagen.'
    ]);
}