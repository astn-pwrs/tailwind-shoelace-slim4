<?php
namespace App\Controller;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use ZipArchive;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;

class ZipController
{
  public function createZip(Request $request, Response $response, array $args): Response
  {
    if (!class_exists('ZipArchive')) {
      $message = "エラー: ZipArchive クラスが見つかりません。PHPの zip 拡張モジュールが有効になっているか確認してください。";
      return $this->error($response, $message, 500);
    }

    $params = (array)$request->getParsedBody();

    $sourceDir = rtrim($params['source_dir'] ?? '', '/');
    $zipName = $params['zip_name'] ?? 'archive.zip';
    $destinationDir = rtrim($params['destination_dir'] ?? '', '/');

    if (!is_dir($sourceDir)) {
      $message = "指定されたフォルダが存在しません: $sourceDir";
      return $this->error($response, $message, 400);
    }

    if (!is_dir($destinationDir)) {
      $message = "保存先フォルダが存在しません: $destinationDir";
      return $this->error($response, $message, 400);
    }

    $zipPath = "$destinationDir/$zipName";
    $zip = new ZipArchive();

    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
      $message = "ZIPファイルを作成できませんでした: $zipPath";
      return $this->error($response, $message, 500);
    }

    $files = new RecursiveIteratorIterator(
     new RecursiveDirectoryIterator($sourceDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $file) {
      if (!$file->isDir()) {
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($sourceDir) + 1);
        $zip->addFile($filePath, $relativePath);
      }
    }

    $zip->close();

    $response->getBody()->write(json_encode(['message' => "ZIPファイルが作成されました: $zipPath"]));
    return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    
  }
  private function error(Response $response, string $message, int $status): Response
  {
    $response->getBody()->write(json_encode(['error' => $message]));
    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
  }
}
