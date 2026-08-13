<?php

declare(strict_types=1);

class ProductoImagenConflicto extends RuntimeException
{
}

class ProductoImagen
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function listarPorProducto(int $productoId): array
    {
        $this->validarProductoId($productoId);

        $stmt = $this->conn->prepare("
            SELECT imagen_id, producto_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
            ORDER BY orden ASC, imagen_id ASC
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarPublicasPorProducto(int $productoId): array
    {
        $this->validarProductoId($productoId);

        $stmt = $this->conn->prepare("
            SELECT imagen_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
            ORDER BY principal DESC, orden ASC, imagen_id ASC
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        return array_values(array_filter(
            $stmt->fetchAll(PDO::FETCH_ASSOC),
            fn(array $imagen): bool => $this->esArchivoImagenPublicoValido(
                (string)$imagen['ruta']
            )
        ));
    }

    public function contarPorProducto(int $productoId): int
    {
        $this->validarProductoId($productoId);

        $stmt = $this->conn->prepare("
            SELECT COUNT(*)
            FROM producto_imagenes
            WHERE producto_id = :producto_id
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        return (int)$stmt->fetchColumn();
    }

    public function obtenerPrincipal(int $productoId): ?array
    {
        $this->validarProductoId($productoId);

        $stmt = $this->conn->prepare("
            SELECT imagen_id, producto_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
                AND principal = 1
            ORDER BY orden ASC, imagen_id ASC
            LIMIT 1
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        $imagen = $stmt->fetch(PDO::FETCH_ASSOC);

        return $imagen ?: null;
    }

    public function obtenerPorIdYProducto(
        int $productoId,
        int $imagenId
    ): ?array {
        $this->validarProductoId($productoId);
        $this->validarImagenId($imagenId);

        $stmt = $this->conn->prepare("
            SELECT imagen_id, producto_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
                AND imagen_id = :imagen_id
            LIMIT 1
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->bindValue(':imagen_id', $imagenId, PDO::PARAM_INT);
        $stmt->execute();

        $imagen = $stmt->fetch(PDO::FETCH_ASSOC);

        return $imagen ?: null;
    }

    public function existeRutaEnProducto(int $productoId, string $ruta): bool
    {
        $this->validarProductoId($productoId);

        $stmt = $this->conn->prepare("
            SELECT imagen_id
            FROM producto_imagenes
            WHERE producto_id = :producto_id
                AND ruta = :ruta
            LIMIT 1
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->bindValue(':ruta', $ruta, PDO::PARAM_STR);
        $stmt->execute();

        return (bool)$stmt->fetch();
    }

    public function crear(
        int $productoId,
        string $ruta,
        int $orden,
        bool $principal = false
    ): int {
        $this->validarProductoId($productoId);
        $rutaNormalizada = $this->normalizarRuta($ruta);

        if ($orden <= 0 || $orden > 65535) {
            throw new InvalidArgumentException('El orden de imagen no es válido.');
        }

        $stmt = $this->conn->prepare("
            INSERT INTO producto_imagenes (
                producto_id, ruta, orden, principal
            ) VALUES (
                :producto_id, :ruta, :orden, :principal
            )
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->bindValue(':ruta', $rutaNormalizada, PDO::PARAM_STR);
        $stmt->bindValue(':orden', $orden, PDO::PARAM_INT);
        $stmt->bindValue(':principal', $principal ? 1 : 0, PDO::PARAM_INT);
        $stmt->execute();

        return (int)$this->conn->lastInsertId();
    }

    public function asociar(int $productoId, string $ruta): ?array
    {
        $this->validarProductoId($productoId);
        $rutaNormalizada = $this->normalizarRuta($ruta);

        $this->conn->beginTransaction();

        try {
            if ($this->bloquearProducto($productoId) === null) {
                $this->conn->rollBack();
                return null;
            }

            $imagenes = $this->obtenerImagenesBloqueadas($productoId);

            foreach ($imagenes as $imagen) {
                if ($imagen['ruta'] === $rutaNormalizada) {
                    throw new ProductoImagenConflicto(
                        'La imagen ya está asociada a este producto.'
                    );
                }
            }

            if (count($imagenes) >= 5) {
                throw new ProductoImagenConflicto(
                    'El producto ya alcanzó el máximo de 5 imágenes.'
                );
            }

            $orden = $imagenes === []
                ? 1
                : (int)max(array_column($imagenes, 'orden')) + 1;

            if ($orden > 65535) {
                throw new ProductoImagenConflicto(
                    'No se pudo asignar el orden de la imagen.'
                );
            }

            $esPrincipal = $imagenes === [];
            $imagenId = $this->crear(
                $productoId,
                $rutaNormalizada,
                $orden,
                $esPrincipal
            );

            if ($esPrincipal) {
                $this->actualizarImagenLegacy($productoId, $rutaNormalizada);
            }

            $this->conn->commit();

            return [
                'imagen_id' => $imagenId,
                'producto_id' => $productoId,
                'ruta' => $rutaNormalizada,
                'orden' => $orden,
                'principal' => $esPrincipal ? 1 : 0,
            ];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }

            throw $e;
        }
    }

    public function establecerPrincipal(
        int $productoId,
        int $imagenId
    ): ?array {
        $this->validarProductoId($productoId);
        $this->validarImagenId($imagenId);

        $this->conn->beginTransaction();

        try {
            if ($this->bloquearProducto($productoId) === null) {
                $this->conn->rollBack();
                return null;
            }

            $imagen = $this->obtenerImagenBloqueada($productoId, $imagenId);

            if ($imagen === null) {
                $this->conn->rollBack();
                return null;
            }

            $stmt = $this->conn->prepare("
                UPDATE producto_imagenes
                SET principal = 0
                WHERE producto_id = :producto_id
            ");
            $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
            $stmt->execute();

            $stmt = $this->conn->prepare("
                UPDATE producto_imagenes
                SET principal = 1
                WHERE producto_id = :producto_id
                    AND imagen_id = :imagen_id
            ");
            $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
            $stmt->bindValue(':imagen_id', $imagenId, PDO::PARAM_INT);
            $stmt->execute();

            $this->actualizarImagenLegacy($productoId, $imagen['ruta']);
            $this->conn->commit();

            $imagen['principal'] = 1;

            return $imagen;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }

            throw $e;
        }
    }

    public function eliminarConReasignacionPrincipal(
        int $productoId,
        int $imagenId
    ): ?array {
        $this->validarProductoId($productoId);
        $this->validarImagenId($imagenId);

        $this->conn->beginTransaction();

        try {
            $producto = $this->bloquearProducto($productoId);

            if ($producto === null) {
                $this->conn->rollBack();
                return null;
            }

            $imagenes = $this->obtenerImagenesBloqueadas($productoId);
            $imagen = null;

            foreach ($imagenes as $imagenActual) {
                if ((int)$imagenActual['imagen_id'] === $imagenId) {
                    $imagen = $imagenActual;
                    break;
                }
            }

            if ($imagen === null) {
                $this->conn->rollBack();
                return null;
            }

            $restantes = array_values(array_filter(
                $imagenes,
                fn(array $imagenActual): bool =>
                    (int)$imagenActual['imagen_id'] !== $imagenId
            ));

            if (
                (int)$imagen['principal'] === 1 &&
                $restantes === [] &&
                (int)$producto['publicado'] === 1
            ) {
                throw new ProductoImagenConflicto(
                    'No podés eliminar la única imagen de un producto publicado.'
                );
            }

            $stmt = $this->conn->prepare("
                DELETE FROM producto_imagenes
                WHERE producto_id = :producto_id
                    AND imagen_id = :imagen_id
            ");
            $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
            $stmt->bindValue(':imagen_id', $imagenId, PDO::PARAM_INT);
            $stmt->execute();

            $nuevaPrincipal = null;

            if ((int)$imagen['principal'] === 1) {
                if ($restantes === []) {
                    $this->actualizarImagenLegacy($productoId, null);
                } else {
                    $nuevaPrincipal = $restantes[0];

                    $stmt = $this->conn->prepare("
                        UPDATE producto_imagenes
                        SET principal = 0
                        WHERE producto_id = :producto_id
                    ");
                    $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
                    $stmt->execute();

                    $stmt = $this->conn->prepare("
                        UPDATE producto_imagenes
                        SET principal = 1
                        WHERE producto_id = :producto_id
                            AND imagen_id = :imagen_id
                    ");
                    $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
                    $stmt->bindValue(
                        ':imagen_id',
                        (int)$nuevaPrincipal['imagen_id'],
                        PDO::PARAM_INT
                    );
                    $stmt->execute();

                    $this->actualizarImagenLegacy(
                        $productoId,
                        $nuevaPrincipal['ruta']
                    );
                    $nuevaPrincipal['principal'] = 1;
                }
            }

            $this->conn->commit();

            return [
                'eliminada' => $imagen,
                'principal' => $nuevaPrincipal,
            ];
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }

            throw $e;
        }
    }

    private function bloquearProducto(int $productoId): ?array
    {
        $stmt = $this->conn->prepare("
            SELECT producto_id, publicado
            FROM productos
            WHERE producto_id = :producto_id
            FOR UPDATE
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        $producto = $stmt->fetch(PDO::FETCH_ASSOC);

        return $producto ?: null;
    }

    private function obtenerImagenesBloqueadas(int $productoId): array
    {
        $stmt = $this->conn->prepare("
            SELECT imagen_id, producto_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
            ORDER BY orden ASC, imagen_id ASC
            FOR UPDATE
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function obtenerImagenBloqueada(
        int $productoId,
        int $imagenId
    ): ?array {
        $stmt = $this->conn->prepare("
            SELECT imagen_id, producto_id, ruta, orden, principal
            FROM producto_imagenes
            WHERE producto_id = :producto_id
                AND imagen_id = :imagen_id
            LIMIT 1
            FOR UPDATE
        ");
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->bindValue(':imagen_id', $imagenId, PDO::PARAM_INT);
        $stmt->execute();

        $imagen = $stmt->fetch(PDO::FETCH_ASSOC);

        return $imagen ?: null;
    }

    private function actualizarImagenLegacy(
        int $productoId,
        ?string $ruta
    ): void {
        $stmt = $this->conn->prepare("
            UPDATE productos
            SET imagen = :ruta
            WHERE producto_id = :producto_id
        ");
        $stmt->bindValue(':ruta', $ruta, $ruta === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':producto_id', $productoId, PDO::PARAM_INT);
        $stmt->execute();
    }

    private function normalizarRuta(string $ruta): string
    {
        $rutaNormalizada = trim($ruta);

        if ($rutaNormalizada === '' || strlen($rutaNormalizada) > 255) {
            throw new InvalidArgumentException('La ruta de imagen no es válida.');
        }

        return $rutaNormalizada;
    }

    private function esArchivoImagenPublicoValido(string $ruta): bool
    {
        if (preg_match('#^img/productos/[^/\\\\]+$#D', $ruta) !== 1) {
            return false;
        }

        $directorio = realpath(__DIR__ . '/../img/productos');
        $archivo = realpath(__DIR__ . '/../' . $ruta);

        if (
            $directorio === false ||
            $archivo === false ||
            !is_file($archivo) ||
            !str_starts_with($archivo, $directorio . DIRECTORY_SEPARATOR)
        ) {
            return false;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if ($finfo === false) {
            return false;
        }

        $mime = finfo_file($finfo, $archivo);
        finfo_close($finfo);

        return in_array($mime, ['image/jpeg', 'image/png', 'image/webp'], true);
    }

    private function validarProductoId(int $productoId): void
    {
        if ($productoId <= 0) {
            throw new InvalidArgumentException('El ID del producto no es válido.');
        }
    }

    private function validarImagenId(int $imagenId): void
    {
        if ($imagenId <= 0) {
            throw new InvalidArgumentException('El ID de imagen no es válido.');
        }
    }
}
