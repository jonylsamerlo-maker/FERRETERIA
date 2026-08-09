<?php

declare(strict_types=1);

class Categoria
{
    private PDO $conn;

    public function __construct(PDO $conn)
    {
        $this->conn = $conn;
    }

    public function listar(): array
    {
        $sql = "
            SELECT
                categoria_id,
                nombre,
                descripcion,
                fecha_creacion
            FROM categorias
            ORDER BY categoria_id ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function resolverIdsParaImportacion(array $categorias): array
    {
        if ($categorias === []) {
            return [];
        }

        $categoriasJson = json_encode(
            array_values($categorias),
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE
        );

        $sql = "
            SELECT
                lote.fila,
                c.categoria_id
            FROM JSON_TABLE(
                :categorias,
                '$[*]' COLUMNS (
                    fila INT PATH '$.fila',
                    nombre VARCHAR(100) PATH '$.nombre'
                )
            ) AS lote
            LEFT JOIN categorias c
                ON c.nombre = CONVERT(lote.nombre USING utf8mb4)
                    COLLATE utf8mb4_0900_ai_ci
            ORDER BY lote.fila ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':categorias', $categoriasJson, PDO::PARAM_STR);
        $stmt->execute();

        $categoriasResueltas = [];

        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $categoria) {
            $categoriasResueltas[(int)$categoria['fila']] =
                $categoria['categoria_id'] !== null
                    ? (int)$categoria['categoria_id']
                    : null;
        }

        return $categoriasResueltas;
    }

    public function existeNombre(string $nombre, ?int $id = null): bool
    {
        $sql = "
            SELECT categoria_id
            FROM categorias
            WHERE nombre = :nombre
        ";

        $params = [
            ':nombre' => $nombre
        ];

        if ($id !== null) {
            $sql .= " AND categoria_id <> :id";
            $params[':id'] = $id;
        }

        $sql .= " LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);

        return (bool)$stmt->fetch();
    }

    public function crear(array $datos): bool
    {
        $sql = "
            INSERT INTO categorias
            (
                nombre,
                descripcion
            )
            VALUES
            (
                :nombre,
                :descripcion
            )
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null
        ]);
    }

    public function actualizar(int $id, array $datos): bool
    {
        $sql = "
            UPDATE categorias
            SET
                nombre = :nombre,
                descripcion = :descripcion
            WHERE categoria_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        return $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':descripcion' => $datos['descripcion'] ?? null,
            ':id' => $id
        ]);
    }

    public function eliminar(int $id): bool
    {
        $sql = "
            DELETE FROM categorias
            WHERE categoria_id = :id
        ";

        $stmt = $this->conn->prepare($sql);

        $stmt->execute([
            ':id' => $id
        ]);

        return $stmt->rowCount() > 0;
    }
}
