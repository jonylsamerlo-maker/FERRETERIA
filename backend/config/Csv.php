<?php

declare(strict_types=1);

function sanitizarCeldaCsv(mixed $valor): string
{
    $texto = (string)$valor;

    if (preg_match('/^[\x00-\x20]*[=+\-@]/', $texto) === 1) {
        return "'" . $texto;
    }

    return $texto;
}
