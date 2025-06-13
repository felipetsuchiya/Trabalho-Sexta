<?php
require_once __DIR__ . '/../controllers/AuthController.php';

$controller = new AuthController();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

header("Content-Type: application/json");

switch ("$method $path") {
    case 'POST /user':
        $data = json_decode(file_get_contents("php://input"), true);
        echo $controller->createUser($data);
        break;

    case 'POST /token':
        $data = json_decode(file_get_contents("php://input"), true);
        echo $controller->login($data);
        break;

    case 'GET /token':
        $userId = $_GET['user'] ?? null;
        $token = getallheaders()['Authorization'] ?? '';
        echo $controller->validateToken($token, $userId);
        break;

    case 'GET /user':
        $email = $_GET['email'] ?? '';
        echo $controller->getUser($email);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        break;
}
