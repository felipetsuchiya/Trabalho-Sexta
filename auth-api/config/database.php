<?php
class Database {
    public static function connect() {
        $dotenv = parse_ini_file(__DIR__ . '/../.env');
        $host = $dotenv['DB_HOST'];
        $db   = $dotenv['DB_NAME'];
        $user = $dotenv['DB_USER'];
        $pass = $dotenv['DB_PASS'];

        try {
            $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $e) {
            die("Erro de conexão: " . $e->getMessage());
        }
    }
}
