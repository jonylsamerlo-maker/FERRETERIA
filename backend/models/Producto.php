<?php

declare(strict_types=1);

class Producto
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    private function normalizarProducto(array $producto): array
    {
        $producto['publicado'] = (int)$producto['publicado'];

        return $producto;
    }

    private function normalizarImagen(mixed $imagen): ?string
    {
        if ($imagen === null) {
            return null;
        }

        $imagenNormalizada = trim((string)$imagen);

        return $imagenNormalizada !== '' ? $imagenNormalizada : null;
    }

    private function generarSlug(string $nombre, int $productoId): string
    {
        $caracteres = [
            'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a',
            'Á' => 'a', 'À' => 'a', 'Ä' => 'a', 'Â' => 'a', 'Ã' => 'a',
            'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e',
            'É' => 'e', 'È' => 'e', 'Ë' => 'e', 'Ê' => 'e',
            'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
            'Í' => 'i', 'Ì' => 'i', 'Ï' => 'i', 'Î' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o',
            'Ó' => 'o', 'Ò' => 'o', 'Ö' => 'o', 'Ô' => 'o', 'Õ' => 'o',
            'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u',
            'Ú' => 'u', 'Ù' => 'u', 'Ü' => 'u', 'Û' => 'u',
            'ñ' => 'n', 'Ñ' => 'n', 'ç' => 'c', 'Ç' => 'c', 'ß' => 'ss',
        ];
        $base = strtolower(strtr(trim($nombre), $caracteres));
        $base = preg_replace('/[^a-z0-9]+/', '-', $base) ?? '';
        $base = trim($base, '-');

        if ($base === '') {
            $base = 'producto';
        }

        return "{$base}-{$productoId}";
    }

    private function crearSlugTemporal(): string
    {
        return 'pendiente-' . bin2hex(random_bytes(16));
    }

    private function asignarSlug(int $productoId, string $nombre): void
    {
        $stmt = $this->conn->prepare("
            UPDATE productos
            SET slug = :slug
            WHERE producto_id = :id
        ");
        $stmt->execute([
            ':slug' => $this->generarSlug($nombre, $productoId),
            ':id' => $productoId,
        ]);

        if ($stmt->rowCount() !== 1) {
            throw new RuntimeException('No se pudo asignar el slug del producto.');
        }
    }

    private function listarSegunPublicacion(bool $soloPublicados): array
    {
        $filtroPublicacion = $soloPublicados
            ? 'WHERE p.publicado = 1'
            : '';

        $sql = "
            SELECT
                p.producto_id,
                p.codigo,
                p.nombre,
                p.slug,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                p.publicado,
                p.categoria_id,
                c.nombre AS categoria,
                p.fecha_creacion
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.categoria_id
            {$filtroPublicacion}
            ORDER BY p.producto_id ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return array_map(
            fn(array $producto): array => $this->normalizarProducto($producto),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function listar(): array
    {
        return $this->listarSegunPublicacion(false);
    }

    public function listarPublicados(): array
    {
        return $this->listarSegunPublicacion(true);
    }

    public function obtenerPorId(int $id, bool $soloPublicado = false): ?array
    {
        $filtroPublicacion = $soloPublicado
            ? 'AND p.publicado = 1'
            : '';

        $sql = "
            SELECT
                p.producto_id,
                p.codigo,
                p.nombre,
                p.slug,
                p.descripcion,
                p.precio,
                p.stock,
                p.imagen,
                p.publicado,
                p.categoria_id,
                c.nombre AS categoria,
                p.fecha_creacion
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.categoria_id
            WHERE p.producto_id = :id
            {$filtroPublicacion}
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);

        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $producto = $stmt->fetch(PDO::FETCH_ASSOC);

        return $producto
            ? $this->normalizarProducto($producto)
            : null;
    }

    public function crear(array $datos): bool
    {
        $iniciarTransaccion = !$this->conn->inTransaction();

        if ($iniciarTransaccion) {
            $this->conn->beginTransaction();
        }

        try {
            $sql = "
                INSERT INTO productos
                (
                    codigo,
                    nombre,
                    slug,
                    descripcion,
                    precio,
                    stock,
                    imagen,
                    publicado,
                    categoria_id
                )
                VALUES
                (
                    :codigo,
                    :nombre,
                    :slug,
                    :descripcion,
                    :precio,
                    :stock,
                    :imagen,
                    0,
                    :categoria_id
                )
            ";

            $stmt = $this->conn->prepare($sql);

            $creado = $stmt->execute([
                ':codigo' => $datos['codigo'],
                ':nombre' => $datos['nombre'],
                ':slug' => $this->crearSlugTemporal(),
                ':descripcion' => $datos['descripcion'] ?? null,
                ':precio' => $datos['precio'],
                ':stock' => $datos['stock'],
                ':imagen' => $this->normalizarImagen($datos['imagen'] ?? null),
                ':categoria_id' => $datos['categoria_id']
            ]);

            if (!$creado) {
                throw new RuntimeException('No se pudo insertar el producto.');
            }

            $productoId = (int)$this->conn->lastInsertId();

            if ($productoId <= 0) {
                throw new RuntimeException('No se pudo obtener el ID del producto.');
            }

            $this->asignarSlug($productoId, (string)$datos['nombre']);

            if ($iniciarTransaccion) {
                $this->conn->commit();
            }

            return true;
        } catch (Throwable $e) {
            if ($iniciarTransaccion && $this->conn->inTransaction()) {
                $this->conn->rollBack();
            }

            throw $e;
        }
    }

    public function analizarCodigosImportacion(array $codigos): array
    {
        if ($codigos === []) {
            return [
                'duplicados' => [],
                'existentes' => [],
            ];
        }

        $codigosJson = json_encode(
            array_values($codigos),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
        );

        $jsonTable = "
            JSON_TABLE(
                :codigos,
                '$[*]' COLUMNS (
                    fila INT PATH '$.fila',
                    codigo VARCHAR(30) PATH '$.codigo'
                )
            )
        ";

        $sqlDuplicados = "
            SELECT
                analisis.fila,
                analisis.codigo
            FROM (
                SELECT
                    lote.fila,
                    lote.codigo,
                    COUNT(*) OVER (
                        PARTITION BY CONVERT(lote.codigo USING utf8mb4)
                            COLLATE utf8mb4_0900_ai_ci
                    ) AS cantidad
                FROM {$jsonTable} AS lote
            ) AS analisis
            WHERE analisis.cantidad > 1
            ORDER BY analisis.fila ASC
        ";

        $stmtDuplicados = $this->conn->prepare($sqlDuplicados);
        $stmtDuplicados->bindValue(':codigos', $codigosJson, PDO::PARAM_STR);
        $stmtDuplicados->execute();

        $sqlExistentes = "
            SELECT
                lote.fila,
                lote.codigo,
                p.codigo AS codigo_existente
            FROM {$jsonTable} AS lote
            INNER JOIN productos p
                ON p.codigo = CONVERT(lote.codigo USING utf8mb4)
                    COLLATE utf8mb4_0900_ai_ci
            ORDER BY lote.fila ASC
        ";

        $stmtExistentes = $this->conn->prepare($sqlExistentes);
        $stmtExistentes->bindValue(':codigos', $codigosJson, PDO::PARAM_STR);
        $stmtExistentes->execute();

        return [
            'duplicados' => $stmtDuplicados->fetchAll(PDO::FETCH_ASSOC),
            'existentes' => $stmtExistentes->fetchAll(PDO::FETCH_ASSOC),
        ];
    }

    public function importarLote(array $productos): int
    {
        $sql = "
            INSERT INTO productos
            (
                codigo,
                nombre,
                slug,
                descripcion,
                precio,
                stock,
                imagen,
                publicado,
                categoria_id
            )
            VALUES
            (
                :codigo,
                :nombre,
                :slug,
                :descripcion,
                :precio,
                :stock,
                NULL,
                0,
                :categoria_id
            )
        ";

        $stmt = $this->conn->prepare($sql);
        $importados = 0;

        foreach ($productos as $producto) {
            $stmt->execute([
                ':codigo' => $producto['codigo'],
                ':nombre' => $producto['nombre'],
                ':slug' => $this->crearSlugTemporal(),
                ':descripcion' => $producto['descripcion'],
                ':precio' => $producto['precio'],
                ':stock' => $producto['stock'],
                ':categoria_id' => $producto['categoria_id'],
            ]);

            $productoId = (int)$this->conn->lastInsertId();

            if ($productoId <= 0) {
                throw new RuntimeException('No se pudo obtener el ID del producto importado.');
            }

            $this->asignarSlug($productoId, (string)$producto['nombre']);

            $importados++;
        }

        return $importados;
    }

    public function actualizar(int $id, array $datos): bool
    {
        $productoExistente = $this->obtenerPorId($id);

        if ($productoExistente === null) {
            return false;
        }

        $imagen = array_key_exists('imagen', $datos)
            ? $this->normalizarImagen($datos['imagen'])
            : $productoExistente['imagen'];

        $sql = "
            UPDATE productos
            SET
                codigo = :codigo,
                nombre = :nombre,
                descripcion = :descripcion,
                precio = :precio,
                stock = :stock,
                imagen = :imagen,
                categoria_id = :categoria_id
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ':codigo' => $datos['codigo'],
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null,
            ':precio' => $datos['precio'],
            ':stock' => $datos['stock'],
            ':imagen' => $imagen,
            ':categoria_id' => $datos['categoria_id'],
            ':id' => $id
        ]);
    }

    public function actualizarPublicado(int $id, int $publicado): bool
    {
        $sql = "
            UPDATE productos
            SET publicado = :publicado
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':publicado', $publicado, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function eliminar(int $id): bool
    {
        $sql = "
            DELETE FROM productos
            WHERE producto_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            ':id' => $id
        ]);

        return $stmt->rowCount() > 0;
    }
}
