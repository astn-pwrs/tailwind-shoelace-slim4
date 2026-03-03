$app->get('/api/{table}', function ($req, $res, $args) {
    $table = $args['table'];
    $stmt = $this->db->query("SELECT * FROM {$table}");
    $data = $stmt->fetchAll();
    $res->getBody()->write(json_encode($data));
    return $res->withHeader('Content-Type', 'application/json');
});

$app->post('/api/{table}', function ($req, $res, $args) {
    $table = $args['table'];
    $data = $req->getParsedBody();
    $cols = implode(',', array_keys($data));
    $vals = ':' . implode(',:', array_keys($data));
    $stmt = $this->db->prepare("INSERT INTO {$table} ({$cols}) VALUES ({$vals}) RETURNING *");
    $stmt->execute($data);
    $res->getBody()->write(json_encode($stmt->fetch()));
    return $res->withHeader('Content-Type', 'application/json');
});
