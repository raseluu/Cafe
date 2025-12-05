<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../includes/config.php';
require_once '../../includes/db.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// In production, verify authentication here
// For demo, we'll accept requests

$db = Database::getInstance();
$conn = $db->getConnection();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get single book or list of books
        $book_id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if ($book_id) {
            // Get single book
            $stmt = $conn->prepare("SELECT * FROM books WHERE id = ?");
            $stmt->bind_param("i", $book_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $book = $result->fetch_assoc();
                echo json_encode(['success' => true, 'book' => $book]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Book not found']);
            }
            
            $stmt->close();
        } else {
            // Get list of books
            $category = isset($_GET['category']) ? $_GET['category'] : null;
            $featured = isset($_GET['featured']) ? $_GET['featured'] === 'true' : false;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
            
            $sql = "SELECT * FROM books WHERE 1=1";
            $params = [];
            $types = "";
            
            if ($category) {
                $sql .= " AND category = ?";
                $params[] = $category;
                $types .= "s";
            }
            
            if ($featured) {
                $sql .= " AND is_featured = TRUE";
            }
            
            $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $params = array_merge($params, [$limit, $offset]);
            $types .= "ii";
            
            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query($sql);
            }
            
            $books = [];
            while ($row = $result->fetch_assoc()) {
                $books[] = $row;
            }
            
            // Get total count
            $count_sql = "SELECT COUNT(*) as total FROM books WHERE 1=1";
            if ($category) {
                $count_sql .= " AND category = '$category'";
            }
            if ($featured) {
                $count_sql .= " AND is_featured = TRUE";
            }
            $count_result = $conn->query($count_sql);
            $total = $count_result->fetch_assoc()['total'];
            
            echo json_encode([
                'success' => true,
                'books' => $books,
                'total' => $total,
                'count' => count($books)
            ]);
            
            if (isset($stmt)) $stmt->close();
        }
        break;
        
    case 'POST':
        // Create new book
        $data = json_decode(file_get_contents('php://input'), true);
        
        $required = ['title', 'author', 'price'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                echo json_encode(['success' => false, 'message' => "$field is required"]);
                exit;
            }
        }
        
        $stmt = $conn->prepare("
            INSERT INTO books (title, author, description, price, image_url, category, is_featured) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            "sssdssi",
            $data['title'],
            $data['author'],
            $data['description'] ?? null,
            $data['price'],
            $data['image_url'] ?? null,
            $data['category'] ?? null,
            $data['is_featured'] ?? 0
        );
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Book created successfully',
                'book_id' => $stmt->insert_id
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to create book']);
        }
        
        $stmt->close();
        break;
        
    case 'PUT':
        // Update book
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Book ID is required']);
            exit;
        }
        
        // Build update query
        $fields = [];
        $values = [];
        $types = "";
        
        $allowed = ['title', 'author', 'description', 'price', 'image_url', 'category', 'is_featured'];
        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $values[] = $data[$field];
                $types .= $field === 'price' ? 'd' : ($field === 'is_featured' ? 'i' : 's');
            }
        }
        
        if (empty($fields)) {
            echo json_encode(['success' => false, 'message' => 'No fields to update']);
            exit;
        }
        
        $values[] = $data['id'];
        $types .= 'i';
        
        $sql = "UPDATE books SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$values);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Book updated successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update book']);
        }
        
        $stmt->close();
        break;
        
    case 'DELETE':
        // Delete book
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['id'])) {
            echo json_encode(['success' => false, 'message' => 'Book ID is required']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM books WHERE id = ?");
        $stmt->bind_param("i", $data['id']);
        
        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Book deleted successfully'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete book']);
        }
        
        $stmt->close();
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

$conn->close();
?>