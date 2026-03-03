<?php

namespace App\Service;

use Ramsey\Uuid\Uuid;
use Exception;
use Psr\Log\LoggerInterface;
class EpubService
{
  private IOService $io;
  private $logger;
  public function __construct(IOService $io, LoggerInterface $logger)
  {
    $this->io = $io;
    $this->logger = $logger;
  }

  public function createAsciiFolderName(string $title): string
  {
    $ascii = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $title);
    return strtolower($ascii);
  }

  public function setup(array $data): string
  {
    $folderName = $this->io->createAsciiFolderName($data['title']);
    $dstPath = "epub" . DIRECTORY_SEPARATOR . $folderName;

    try {
      $templatePath = '/epub/template';
      // 1. 作業フォルダ作成
      if (!$this->io->copyDirectory($templatePath,$dstPath)) {
        throw new Exception("Failed to copy template directory: {$dstPath}");
      }

      // 2. content.opf 書き換え
      $bookId = Uuid::uuid4()->toString();
      $contentPath=$this->io->getBaseDir() . "/{$dstPath}/OBPS/content.opf";
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
      $this->logger->debug($e);
      throw $e; // 呼び出し元でハンドリングできるように再スロー
    }

    return $folderName;
  }
}
