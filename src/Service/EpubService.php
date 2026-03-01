<?php

namespace App\Service;

use Ramsey\Uuid\Uuid;
use Exception;

class EpubService
{
  private IOService $io;

  public function __construct(IOService $io)
  {
    $this->io = $io;
  }

  public function createAsciiFolderName(string $title): string
  {
    $ascii = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $title);
    return strtolower($ascii);
  }

  public function setup(array $data): string
  {
    $folderName = $this->io->createAsciiFolderName($data['title']);
    $basePath = $folderName;

    try {
      $templatePath = __DIR__ . '/template';
      if (!is_dir($templatePath)) { 
        throw new \RuntimeException("テンプレートディレクトリが見つかりません: {$templatePath}");
      }
      // 1. 作業フォルダ作成
      if (!$this->io->copyFile($templatePath,$basePath)) {
        throw new Exception("Failed to create base directory: {$basePath}");
      }

      // 2. content.opf 書き換え
      $bookId = Uuid::uuid4()->toString();
      $contentPath=$this->io->getBaseDir() . "/{$basePath}/OEBPS/content.opf";
      $content = file_get_contents($contentPath);
      if ($content === false) { 
        throw new \RuntimeException("opfファイルの読み込みに失敗しました"); 
      }

      $replacements = [
        '{$bookId}'     => $bookId,
        '{$title}'      => $data['title'],
        '{$language}'   => $data['language'],
        '{$creator}'    => $data['creator'],
        '{$publisher}'  => $data['publisher'],
        '{$description}'=> $data['description'],
      ];

      // プレースホルダを一括置換
      $filled = strtr($content, $replacements);
      // 結果を保存または出力
      file_put_contents($contentPath, $filled);

    } catch (Exception $e) {
      // 必要に応じてログ出力などもここで
      throw $e; // 呼び出し元でハンドリングできるように再スロー
    }

    return $folderName;
  }
}
