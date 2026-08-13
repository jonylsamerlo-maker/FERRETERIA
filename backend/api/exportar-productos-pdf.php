<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/Auth.php';
require_once __DIR__ . '/../models/FeatureFlag.php';
require_once __DIR__ . '/../models/Producto.php';

configurarCors('GET, OPTIONS', false, true);
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responderJsonExportacionPdf(array $datos, int $codigo): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function pdfTexto(string $texto): string
{
    $textoPdf = function_exists('iconv')
        ? iconv('UTF-8', 'Windows-1252//TRANSLIT', $texto)
        : false;

    if ($textoPdf === false) {
        $textoPdf = preg_replace('/[^\x20-\x7E]/', '', $texto) ?? '';
    }

    $textoPdf = str_replace(
        ["\\", "(", ")", "\r", "\n"],
        ["\\\\", "\\(", "\\)", "", " "],
        $textoPdf
    );

    return "({$textoPdf})";
}

function pdfTextoEn(float $x, float $y, string $texto, int $tamano = 9, string $fuente = 'F1'): string
{
    return "BT /{$fuente} {$tamano} Tf {$x} {$y} Td " . pdfTexto($texto) . " Tj ET\n";
}

function pdfLinea(float $x1, float $y1, float $x2, float $y2): string
{
    return "{$x1} {$y1} m {$x2} {$y2} l S\n";
}

function pdfRect(float $x, float $y, float $ancho, float $alto, bool $rellenar = false): string
{
    return "{$x} {$y} {$ancho} {$alto} re " . ($rellenar ? "f\n" : "S\n");
}

function acortarTexto(string $texto, int $maximo): string
{
    $texto = trim(preg_replace('/\s+/', ' ', $texto) ?? '');

    $longitud = function_exists('mb_strlen')
        ? mb_strlen($texto, 'UTF-8')
        : strlen($texto);

    if ($longitud <= $maximo) {
        return $texto;
    }

    $textoCorto = function_exists('mb_substr')
        ? mb_substr($texto, 0, max(0, $maximo - 1), 'UTF-8')
        : substr($texto, 0, max(0, $maximo - 1));

    return $textoCorto . '…';
}

function formatearFechaProducto(?string $fecha): string
{
    if ($fecha === null || trim($fecha) === '') {
        return '';
    }

    $timestamp = strtotime($fecha);

    if ($timestamp === false) {
        return $fecha;
    }

    return date('d/m/Y', $timestamp);
}

function formatearPrecioPdf(mixed $precio): string
{
    return '$ ' . number_format((float)($precio ?? 0), 2, ',', '.');
}

function renderizarEncabezadoPdf(int $pagina, int $totalProductos, string $fecha, string $hora): string
{
    $contenido = "0.862 0.149 0.149 rg\n";
    $contenido .= pdfRect(40, 785, 515, 3, true);
    $contenido .= "0 0 0 rg\n";
    $contenido .= pdfTextoEn(40, 755, 'Ferretería JM', 22, 'F2');
    $contenido .= pdfTextoEn(40, 735, 'Listado de productos', 12, 'F1');
    $contenido .= pdfTextoEn(395, 755, "Fecha: {$fecha}", 9, 'F1');
    $contenido .= pdfTextoEn(395, 740, "Hora: {$hora}", 9, 'F1');
    $contenido .= pdfTextoEn(395, 725, "Productos: {$totalProductos}", 9, 'F1');
    $contenido .= "0.82 0.82 0.82 RG\n";
    $contenido .= pdfLinea(40, 712, 555, 712);
    $contenido .= "0 0 0 RG\n";

    return $contenido;
}

function renderizarPiePdf(int $pagina, int $totalPaginas): string
{
    $contenido = "0.82 0.82 0.82 RG\n";
    $contenido .= pdfLinea(40, 45, 555, 45);
    $contenido .= "0 0 0 RG\n";
    $contenido .= pdfTextoEn(40, 28, 'Ferretería JM - Inventario de productos', 8, 'F1');
    $contenido .= pdfTextoEn(485, 28, "Página {$pagina} de {$totalPaginas}", 8, 'F1');

    return $contenido;
}

function renderizarCabeceraTablaPdf(float $y): string
{
    $contenido = "0.95 0.95 0.95 rg\n";
    $contenido .= pdfRect(40, $y - 5, 515, 22, true);
    $contenido .= "0 0 0 rg\n";
    $contenido .= pdfTextoEn(46, $y + 2, 'Código', 8, 'F2');
    $contenido .= pdfTextoEn(105, $y + 2, 'Nombre', 8, 'F2');
    $contenido .= pdfTextoEn(245, $y + 2, 'Categoría', 8, 'F2');
    $contenido .= pdfTextoEn(345, $y + 2, 'Precio', 8, 'F2');
    $contenido .= pdfTextoEn(420, $y + 2, 'Stock', 8, 'F2');
    $contenido .= pdfTextoEn(470, $y + 2, 'Fecha creación', 8, 'F2');
    $contenido .= "0.75 0.75 0.75 RG\n";
    $contenido .= pdfLinea(40, $y - 6, 555, $y - 6);
    $contenido .= "0 0 0 RG\n";

    return $contenido;
}

function construirPaginasProductosPdf(array $productos, string $fecha, string $hora): array
{
    $paginas = [];
    $paginaActual = '';
    $pagina = 1;
    $y = 680;
    $altoFila = 22;
    $limiteInferior = 72;
    $totalProductos = count($productos);

    $iniciarPagina = function () use (&$paginaActual, &$y, $pagina, $totalProductos, $fecha, $hora): void {
        $paginaActual = renderizarEncabezadoPdf($pagina, $totalProductos, $fecha, $hora);
        $paginaActual .= renderizarCabeceraTablaPdf(685);
        $y = 660;
    };

    $iniciarPagina();

    foreach ($productos as $indice => $producto) {
        if ($y < $limiteInferior) {
            $paginas[] = $paginaActual;
            $pagina++;
            $iniciarPagina();
        }

        if ($indice % 2 === 1) {
            $paginaActual .= "0.985 0.985 0.985 rg\n";
            $paginaActual .= pdfRect(40, $y - 6, 515, $altoFila, true);
            $paginaActual .= "0 0 0 rg\n";
        }

        $paginaActual .= pdfTextoEn(46, $y, acortarTexto((string)($producto['codigo'] ?? ''), 10), 8);
        $paginaActual .= pdfTextoEn(105, $y, acortarTexto((string)($producto['nombre'] ?? ''), 30), 8);
        $paginaActual .= pdfTextoEn(245, $y, acortarTexto((string)($producto['categoria'] ?? ''), 20), 8);
        $paginaActual .= pdfTextoEn(345, $y, formatearPrecioPdf($producto['precio'] ?? 0), 8);
        $paginaActual .= pdfTextoEn(420, $y, (string)(int)($producto['stock'] ?? 0), 8);
        $paginaActual .= pdfTextoEn(470, $y, formatearFechaProducto($producto['fecha_creacion'] ?? null), 8);
        $paginaActual .= "0.88 0.88 0.88 RG\n";
        $paginaActual .= pdfLinea(40, $y - 8, 555, $y - 8);
        $paginaActual .= "0 0 0 RG\n";

        $y -= $altoFila;
    }

    $paginas[] = $paginaActual;

    return $paginas;
}

function construirPdf(array $productos): string
{
    $fecha = date('d/m/Y');
    $hora = date('H:i');
    $paginas = construirPaginasProductosPdf($productos, $fecha, $hora);
    $totalPaginas = count($paginas);
    $objetos = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        3 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        4 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ];
    $kids = [];
    $siguienteObjeto = 5;

    foreach ($paginas as $indice => $contenidoPagina) {
        $numeroPagina = $indice + 1;
        $paginaObjeto = $siguienteObjeto++;
        $contenidoObjeto = $siguienteObjeto++;
        $kids[] = "{$paginaObjeto} 0 R";

        $stream = $contenidoPagina . renderizarPiePdf($numeroPagina, $totalPaginas);

        $objetos[$paginaObjeto] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {$contenidoObjeto} 0 R >>";
        $objetos[$contenidoObjeto] = "<< /Length " . strlen($stream) . " >>\nstream\n{$stream}endstream";
    }

    $objetos[2] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . $totalPaginas . ' >>';
    ksort($objetos);

    $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    $offsets = [0];

    foreach ($objetos as $numero => $objeto) {
        $offsets[$numero] = strlen($pdf);
        $pdf .= "{$numero} 0 obj\n{$objeto}\nendobj\n";
    }

    $xref = strlen($pdf);
    $totalObjetos = max(array_keys($objetos)) + 1;
    $pdf .= "xref\n0 {$totalObjetos}\n";
    $pdf .= "0000000000 65535 f \n";

    for ($i = 1; $i < $totalObjetos; $i++) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$i] ?? 0);
    }

    $pdf .= "trailer\n<< /Size {$totalObjetos} /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xref}\n%%EOF";

    return $pdf;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        responderJsonExportacionPdf([
            'success' => false,
            'message' => 'Método no permitido.'
        ], 405);
    }

    requerirRolAdmin();

    $database = new Database();
    $conn = $database->getConnection();

    $featureFlag = new FeatureFlag($conn);
    $flagPdf = $featureFlag->obtenerPorClave('exportar_pdf');

    if ($flagPdf === null || !(bool)$flagPdf['habilitado']) {
        responderJsonExportacionPdf([
            'success' => false,
            'message' => 'La exportación a PDF no está habilitada.'
        ], 403);
    }

    $producto = new Producto($conn);
    $productos = $producto->listar();
    $fechaArchivo = date('Y-m-d');
    $filename = "inventario-ferreteria-jm-{$fechaArchivo}.pdf";
    $pdf = construirPdf($productos);

    header('Content-Type: application/pdf');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");
    header('Content-Length: ' . strlen($pdf));
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');

    echo $pdf;
    exit;
} catch (PDOException $e) {
    responderJsonExportacionPdf([
        'success' => false,
        'message' => 'Ocurrió un error en la base de datos.'
    ], 500);
} catch (Throwable $e) {
    responderJsonExportacionPdf([
        'success' => false,
        'message' => 'Ocurrió un error interno.'
    ], 500);
}
