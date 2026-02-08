$app->get('/api/rbac/tree', function ($req, $res) {
    $db = $this->db;

    // groups
    $groups = $db->query("SELECT id, name FROM groups ORDER BY name")->fetchAll();

    $result = [];

    foreach ($groups as $g) {
        // group → roles
        $stmt = $db->prepare("
            SELECT r.id, r.name
            FROM group_roles gr
            JOIN roles r ON r.id = gr.role_id
            WHERE gr.group_id = ?
            ORDER BY r.name
        ");
        $stmt->execute([$g['id']]);
        $roles = $stmt->fetchAll();

        $roleNodes = [];

        foreach ($roles as $r) {
            // role → routes
            $stmt2 = $db->prepare("
                SELECT rt.id, rt.path, rt.method
                FROM route_group_roles rgr
                JOIN routes rt ON rt.id = rgr.route_id
                WHERE rgr.role_id = ?
                ORDER BY rt.path
            ");
            $stmt2->execute([$r['id']]);
            $routes = $stmt2->fetchAll();

            $routeNodes = array_map(function ($rt) {
                return [
                    "type" => "route",
                    "id" => $rt["id"],
                    "label" => "{$rt['method']} {$rt['path']}"
                ];
            }, $routes);

            $roleNodes[] = [
                "type" => "role",
                "id" => $r["id"],
                "label" => $r["name"],
                "children" => $routeNodes
            ];
        }

        $result[] = [
            "type" => "group",
            "id" => $g["id"],
            "label" => $g["name"],
            "children" => $roleNodes
        ];
    }

    $res->getBody()->write(json_encode($result));
    return $res->withHeader('Content-Type', 'application/json');
});
