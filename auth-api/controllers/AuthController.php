<?php
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../utils/jwt.php';

class AuthController {
    public function createUser($data) {
        $model = new UserModel();
        $hashed = password_hash($data['password'], PASSWORD_BCRYPT);
        $success = $model->createUser($data['name'], $data['lastname'], $data['email'], $hashed);

        if ($success) {
            return json_encode([
                'message' => 'ok',
                'user' => $data
            ]);
        }
        return json_encode(['message' => 'error']);
    }

    public function getUser($email) {
        $model = new UserModel();
        $user = $model->getUserByEmail($email);
        unset($user['password']);
        return json_encode($user);
    }

    public function login($data) {
        $model = new UserModel();
        $user = $model->getUserByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user['password'])) {
            return json_encode(['token' => false]);
        }

        $token = generateToken([
            'userId' => $user['id'],
            'password' => $user['password']
        ]);

        return json_encode(['token' => $token]);
    }

    public function validateToken($token, $userId) {
        $decoded = decodeToken($token);
        if (!$decoded) return json_encode(['auth' => false]);

        $model = new UserModel();
        $user = $model->getUserById($userId);

        if ($user && $decoded->userId == $user['id'] && $decoded->password == $user['password']) {
            return json_encode(['auth' => true]);
        }

        return json_encode(['auth' => false]);
    }
}
