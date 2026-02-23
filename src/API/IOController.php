<?php

namespace App\API;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class IOController
{
  public function mkdir(Request $request, Response $response): Response
  {
    $params = (array)$request->getParsedBody();
    $uploadDir = __DIR__ . '/../../uploads';
    $subFolder = 'images';
    $targetDir = $uploadDir . DIRECTORY_SEPARATOR . $subFolder;

    if (!is_dir($targetDir)) {
      if (!mkdir($targetDir, 0777, true) && !is_dir($targetDir)) {
        $this->error($response,"ディレクトリの作成に失敗しました",500);
      }
    }

    $response->getBody()->write(json_encode([
      'message' => '作成成功',
      'path' => $targetDir
    ]));

    return $response->withHeader('Content-Type', 'application/json');
  }
  private function error(Response $response, string $message, int $status): Response
  {
    $response->getBody()->write(json_encode(['error' => $message]));
    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
  }
}
