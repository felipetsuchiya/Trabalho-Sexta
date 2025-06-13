<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/../vendor/autoload.php';

function generateToken($data) {
    $secret = parse_ini_file(__DIR__ . '/../.env')['JWT_SECRET'];
    return JWT::encode($data, $secret, 'HS256');
}

function decodeToken($token) {
    $secret = parse_ini_file(__DIR__ . '/../.env')['JWT_SECRET'];
    try {
        return JWT::decode($token, new Key($secret, 'HS256'));
    } catch (Exception $e) {
        return null;
    }
}
