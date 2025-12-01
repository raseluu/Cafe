<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $db = getDB();
    
    // Get active events ordered by date
    $stmt = $db->prepare(
        "SELECT id, title, description, event_date, event_time, location, seats_available, icon, image 
        FROM events 
        WHERE status = 'active' AND event_date >= CURDATE() 
        ORDER BY event_date ASC"
    );
    $stmt->execute();
    $events = $stmt->fetchAll();
    
    // Format dates
    foreach ($events as &$event) {
        $date = new DateTime($event['event_date']);
        $event['formatted_date'] = [
            'day' => $date->format('d'),
            'month' => $date->format('M')
        ];
    }
    
    echo json_encode([
        'success' => true,
        'events' => $events
    ]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Failed to fetch events: ' . $e->getMessage()]);
}
?>