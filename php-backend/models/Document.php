<?php
require_once __DIR__ . '/../config/database.php';

class Document {
    private $conn;
    private $table_name = "documents";
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }
    
    public function getByProjectId($projectId) {
        if (!$this->conn) return [];
        try {
            $query = "SELECT id, project_id, type, content, format, created_at FROM " . $this->table_name . " WHERE project_id = :project_id ORDER BY created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([':project_id' => $projectId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Database error in getByProjectId: " . $e->getMessage());
            return [];
        }
    }
    
    public function save($projectId, $type, $content, $format = 'markdown') {
        if (!$this->conn) return ['error' => 'Database connection failed'];
        try {
            // Check if document already exists for this project and type
            $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE project_id = :project_id AND type = :type";
            $stmt = $this->conn->prepare($checkQuery);
            $stmt->execute([':project_id' => $projectId, ':type' => $type]);
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                $query = "UPDATE " . $this->table_name . " SET content = :content, format = :format, created_at = CURRENT_TIMESTAMP WHERE id = :id";
                $stmt = $this->conn->prepare($query);
                $stmt->execute([
                    ':content' => $content,
                    ':format' => $format,
                    ':id' => $existing['id']
                ]);
                return ['id' => $existing['id'], 'message' => 'Document updated successfully'];
            } else {
                $query = "INSERT INTO " . $this->table_name . " (project_id, type, content, format) VALUES (:project_id, :type, :content, :format) RETURNING id";
                $stmt = $this->conn->prepare($query);
                $stmt->execute([
                    ':project_id' => $projectId,
                    ':type' => $type,
                    ':content' => $content,
                    ':format' => $format
                ]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                return ['id' => $result['id'], 'message' => 'Document saved successfully'];
            }
        } catch(PDOException $e) {
            error_log("Database error in save document: " . $e->getMessage());
            return ['error' => 'Failed to save document: ' . $e->getMessage()];
        }
    }
}
?>
