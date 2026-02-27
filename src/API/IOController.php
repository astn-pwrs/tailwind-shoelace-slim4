<?php

namespace App\API;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use ZipArchive;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;

class IOController
{
  private $settings;
  private $logger;

  public function __construct($settings, $logger)
  {
    $this->settings = $settings;
    $this->logger   = $logger;
  }
  public function createDir(Request $request, Response $response): Response
  {
    $baseDir = $this->settings['baseDir'];

    $params = (array)$request->getParsedBody();
    $targetDir = implode(DIRECTORY_SEPARATOR, [$baseDir, $params["path"]]);
    if($this->mkdir($targetDir)){
      $response->getBody()->write(json_encode([
        'message' => '作成成功',
        'path' => $targetDir
      ]));
      return $response->withHeader('Content-Type', 'application/json');
    }
    return $this->error($response,"ディレクトリの作成に失敗しました",500);
  }

  public function copyFile(Request $request, Response $response): Response
  {
    $params = (array)$request->getParsedBody();
    $baseDir = $this->settings['baseDir'];
    $src = $params['src'] ?? null; 
    $dest = $params['dest'] ?? null;

    if (!$src || !$dest) {
      $this->error($response,"srcとdestの両方を指定してください。",400);
    }

    $srcFile = implode(DIRECTORY_SEPARATOR, [$baseDir, $src]);
    if (!file_exists($srcFile)) {
      return $this->error($response,"コピー元ファイルが存在しません: $srcFile",404);
    }
    if (!is_readable($srcFile)) {
      return $this->error($response,"コピー元ファイルを読み取れません: $srcFile",403);
    }
    $dstFile = implode(DIRECTORY_SEPARATOR, [$baseDir, $dest]);
    $dstDir  = dirname($dstFile);
    if (!is_dir($dstDir)) {
      if(!$this->mkdir($dstDir)){
        return $this->error($response,"コピー先ディレクトリを作成できません: $dstDir",500);
      }
    }
    if (!copy($srcFile, $dstFile)) {
      return $this->error($response,"ファイルのコピーに失敗しました。",500);
    }

    $response->getBody()->write(json_encode([
      'message' => '作成成功',
      'path' => $dstDir
    ]));
    return $response->withHeader('Content-Type', 'application/json');
  }

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

  public function renameFile(Request $request, Response $response, array $args): Response
  {

    $response->getBody()->write(json_encode(['message' => "名前が変更されました"]));
    return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
  }

  private function mkdir($targetDir){
    if (!is_dir($targetDir)) {
      if (!mkdir($targetDir, 0777, true) && !is_dir($targetDir)) {
        return false;
      }
    }
    return true;
  }
  private function error(Response $response, string $message, int $status): Response
  {
    $response->getBody()->write(json_encode(['error' => $message]));
    return $response->withStatus($status)->withHeader('Content-Type', 'application/json');
  }
}
