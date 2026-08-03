<?php

declare(strict_types=1);

class FeatureFlag
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
                clave,
                habilitado,
                descripcion,
                fecha_actualizacion
            FROM feature_flags
            ORDER BY clave ASC
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerPorClave(string $clave): ?array
    {
        $sql = "
            SELECT
                clave,
                habilitado,
                descripcion,
                fecha_actualizacion
            FROM feature_flags
            WHERE clave = :clave
            LIMIT 1
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':clave', $clave, PDO::PARAM_STR);
        $stmt->execute();

        $featureFlag = $stmt->fetch(PDO::FETCH_ASSOC);

        return $featureFlag ?: null;
    }

    public function actualizarEstado(string $clave, bool $habilitado): bool
    {
        $sql = "
            UPDATE feature_flags
            SET habilitado = :habilitado
            WHERE clave = :clave
        ";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindValue(':habilitado', $habilitado ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':clave', $clave, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->rowCount() > 0 || $this->obtenerPorClave($clave) !== null;
    }
}
