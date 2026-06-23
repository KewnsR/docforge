<?php
// php-backend/models/Project.php
require_once __DIR__ . '/../config/database.php';

class Project {
    private $conn;
    private $table_name = "projects";
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getAll($userId) {
        if (!$this->conn) return [];
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE user_id = :user_id ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':user_id' => $userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Database error in getAll: " . $e->getMessage());
            return [];
        }
    }
    
    public function getById($id, $userId) {
        if (!$this->conn) return null;
        try {
            $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':id' => $id, ':user_id' => $userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Database error in getById: " . $e->getMessage());
            return null;
        }
    }
    
    public function create($data, $userId) {
        if (!$this->conn) return ['error' => 'Database connection failed'];
        try {
            $query = "INSERT INTO " . $this->table_name . " (name, description, user_id) VALUES (:name, :description, :user_id) RETURNING id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                ':name' => $data['name'],
                ':description' => $data['description'] ?? '',
                ':user_id' => $userId
            ]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return ['id' => $result['id'], 'message' => 'Project created successfully'];
        } catch(PDOException $e) {
            error_log("Database error in create: " . $e->getMessage());
            return ['error' => 'Failed to create project: ' . $e->getMessage()];
        }
    }
    
    public function delete($id, $userId) {
        if (!$this->conn) return ['error' => 'Database connection failed'];
        try {
            $query = "DELETE FROM " . $this->table_name . " WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':id' => $id, ':user_id' => $userId]);
            return ['message' => 'Project deleted successfully'];
        } catch(PDOException $e) {
            error_log("Database error in delete: " . $e->getMessage());
            return ['error' => 'Failed to delete project: ' . $e->getMessage()];
        }
    }
}
?>