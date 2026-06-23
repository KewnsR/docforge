<?php
// php-backend/models/User.php
require_once __DIR__ . '/../config/database.php';

class User {
    private $conn;
    private $table_name = "users";
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function register($username, $password) {
        if (!$this->conn) return ['error' => 'Database connection failed'];
        
        $username = trim($username);
        $password = trim($password);
        
        if (strlen($username) < 3) {
            return ['error' => 'Username must be at least 3 characters long'];
        }
        if (strlen($password) < 6) {
            return ['error' => 'Password must be at least 6 characters long'];
        }
        
        try {
            // Check if username already exists
            $check_query = "SELECT id FROM " . $this->table_name . " WHERE username = :username LIMIT 1";
            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->execute([':username' => $username]);
            if ($check_stmt->fetch()) {
                return ['error' => 'Username is already taken'];
            }
            
            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert user
            $query = "INSERT INTO " . $this->table_name . " (username, password) VALUES (:username, :password) RETURNING id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                ':username' => $username,
                ':password' => $hashed_password
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'id' => $result['id'],
                'username' => $username,
                'message' => 'Registration successful'
            ];
        } catch (PDOException $e) {
            error_log("Database error in register: " . $e->getMessage());
            return ['error' => 'Failed to register: ' . $e->getMessage()];
        }
    }
    
    public function login($username, $password) {
        if (!$this->conn) return ['error' => 'Database connection failed'];
        
        $username = trim($username);
        $password = trim($password);
        
        try {
            $query = "SELECT id, username, password FROM " . $this->table_name . " WHERE username = :username LIMIT 1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':username' => $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user && password_verify($password, $user['password'])) {
                return [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'message' => 'Login successful'
                ];
            } else {
                return ['error' => 'Invalid username or password'];
            }
        } catch (PDOException $e) {
            error_log("Database error in login: " . $e->getMessage());
            return ['error' => 'Failed to login: ' . $e->getMessage()];
        }
    }
}
?>
