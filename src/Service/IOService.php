<?php

namespace App\Service;

use ZipArchive;
use RecursiveIteratorIterator;
use RecursiveDirectoryIterator;
use Psr\Log\LoggerInterface;
class IOService
{
  private $baseDir;
  private $logger;

  public function __construct(string $baseDir, LoggerInterface $logger)
  {
    $this->baseDir = rtrim($baseDir, DIRECTORY_SEPARATOR);
    $this->logger = $logger;
  }

  public function getBaseDir(): string
  {
    return $this->baseDir;
  }

  /**
   * 指定された相対パスにディレクトリを作成する
   */
  public function createDir(string $relativePath): array
  {
    $relativePath = $this->normalizePath($relativePath);
    $targetDir = $this->baseDir . DIRECTORY_SEPARATOR . $relativePath;

    if (!is_dir($targetDir)) {
      if (!mkdir($targetDir, 0777, true) && !is_dir($targetDir)) {
        throw new \RuntimeException("ディレクトリの作成に失敗しました: $targetDir");
      }
    }

    return ['path' => $targetDir];
  }

  /**
   * ファイルをコピーする（src → dest）
   */
  public function copyFile(string $src, string $dest): array
  {
    $src = $this->normalizePath($src);
    $dest = $this->normalizePath($dest);

    $srcFile = $this->baseDir . DIRECTORY_SEPARATOR . $src;
    $dstFile = $this->baseDir . DIRECTORY_SEPARATOR . $dest;
    $dstDir  = dirname($dstFile);

    if (!file_exists($srcFile)) {
      throw new \RuntimeException("コピー元ファイルが存在しません: $srcFile");
    }
    if (!is_readable($srcFile)) {
      throw new \RuntimeException("コピー元ファイルを読み取れません: $srcFile");
    }
    if (!is_dir($dstDir) && !mkdir($dstDir, 0777, true)) {
      throw new \RuntimeException("コピー先ディレクトリを作成できません: $dstDir");
    }
    if (!copy($srcFile, $dstFile)) {
      $this->logger->debug("src:".$srcFile);
      $this->logger->debug("dst".$dstFile);
      throw new \RuntimeException("ファイルのコピーに失敗しました。");
    }

    return ['path' => $dstFile];
  }

  /**
   * ディレクトリを再帰的にコピーする
   *
   * @param string $src 相対パス（コピー元）
   * @param string $dest 相対パス（コピー先）
   * @return array コピー先のパス情報
  */
  public function copyDirectory(string $src, string $dest): array
  {
    $src = $this->normalizePath($src);
    $dest = $this->normalizePath($dest);

    $srcPath = $this->baseDir . DIRECTORY_SEPARATOR . $src;
    $destPath = $this->baseDir . DIRECTORY_SEPARATOR . $dest;

    if (!is_dir($srcPath)) {
      throw new \RuntimeException("コピー元ディレクトリが存在しません: $srcPath");
    }

    $this->recursiveCopy($srcPath, $destPath);

    return ['copied_from' => $srcPath, 'copied_to' => $destPath];
  }


  /**
   * ファイルまたはディレクトリの名前を変更する
   */
  public function rename(string $oldPath, string $newPath): array
  {
    $oldPath = $this->normalizePath($oldPath);
    $newPath = $this->normalizePath($newPath);

    $oldFullPath = $this->baseDir . DIRECTORY_SEPARATOR . $oldPath;
    $newFullPath = $this->baseDir . DIRECTORY_SEPARATOR . $newPath;

    if (!file_exists($oldFullPath)) {
      throw new \RuntimeException("リネーム元が存在しません: $oldFullPath");
    }

    $newDir = dirname($newFullPath);
    if (!is_dir($newDir) && !mkdir($newDir, 0777, true)) {
      throw new \RuntimeException("リネーム先ディレクトリを作成できません: $newDir");
    }

    if (!rename($oldFullPath, $newFullPath)) {
      throw new \RuntimeException("リネームに失敗しました: $oldFullPath → $newFullPath");
    }

    return ['old' => $oldFullPath, 'new' => $newFullPath];
  }

  /**
   * 実際の再帰コピー処理
   */
  private function recursiveCopy(string $src, string $dest): void
  {
    if (!is_dir($dest)) {
      if (!mkdir($dest, 0777, true) && !is_dir($dest)) {
        throw new \RuntimeException("コピー先ディレクトリを作成できません: $dest");
      }
    }

    $items = scandir($src);
    foreach ($items as $item) {
      if ($item === '.' || $item === '..') {
        continue;
      }

      $srcItem = $src . DIRECTORY_SEPARATOR . $item;
      $destItem = $dest . DIRECTORY_SEPARATOR . $item;

      if (is_dir($srcItem)) {
        $this->recursiveCopy($srcItem, $destItem);
      } else {
        if (!copy($srcItem, $destItem)) {
          $this->logger->error("ファイルコピー失敗: $srcItem → $destItem");
          throw new \RuntimeException("ファイルのコピーに失敗しました: $srcItem");
        }
      }
    }
  }

  /**
   * ファイルまたはディレクトリを削除する
   */
  public function delete(string $targetPath): array
  {
    $targetPath = $this->normalizePath($targetPath);
    $fullPath = $this->baseDir . DIRECTORY_SEPARATOR . $targetPath;

    if (!file_exists($fullPath)) {
      throw new \RuntimeException("削除対象が存在しません: $fullPath");
    }

    if (is_dir($fullPath)) {
      $this->deleteDirectory($fullPath);
    } else {
      if (!unlink($fullPath)) {
        throw new \RuntimeException("ファイルの削除に失敗しました: $fullPath");
      }
    }

    return ['deleted' => $fullPath];
  }

  /**
   * ディレクトリとその中身を再帰的に削除する
   */
  private function deleteDirectory(string $dir): void
  {
    $items = array_diff(scandir($dir), ['.', '..']);
    foreach ($items as $item) {
      $path = $dir . DIRECTORY_SEPARATOR . $item;
      if (is_dir($path)) {
        $this->deleteDirectory($path);
      } else {
        unlink($path);
      }
    }
    rmdir($dir);
  }

  /**
 * アップロードされたファイルを指定パスに保存する
 *
 * @param array $uploadedFile 例: ['tmp_name' => '/tmp/php123', 'name' => 'example.txt']
 * @param string $destinationPath 保存先の相対パス（ファイル名含む）
 */
public function uploadFile(array $uploadedFile, string $destinationPath): array
{
  if (!isset($uploadedFile['tmp_name'], $uploadedFile['name'])) {
    throw new \InvalidArgumentException("アップロードファイル情報が不正です。");
  }

  $destinationPath = $this->normalizePath($destinationPath);
  $fullPath = $this->baseDir . DIRECTORY_SEPARATOR . $destinationPath;
  $destDir = dirname($fullPath);

  if (!is_dir($destDir) && !mkdir($destDir, 0777, true)) {
    throw new \RuntimeException("保存先ディレクトリを作成できません: $destDir");
  }

  if (!move_uploaded_file($uploadedFile['tmp_name'], $fullPath)) {
    // move_uploaded_file が失敗する場合、通常の copy にフォールバック
    if (!copy($uploadedFile['tmp_name'], $fullPath)) {
      throw new \RuntimeException("ファイルの保存に失敗しました: $fullPath");
    }
  }

  return ['saved_path' => $fullPath, 'original_name' => $uploadedFile['name']];
}

/**
 * 指定ディレクトリ以下のフォルダ・ファイル構造を再帰的に取得する
 *
 * @param string $relativeDir 相対パス（例: 'docs'）
 * @return array 再帰的なツリー構造の配列
 */
public function getDirectoryTree(string $relativeDir = ''): array
{
  $relativeDir = $this->normalizePath($relativeDir);
  $dirPath = $this->baseDir . DIRECTORY_SEPARATOR . $relativeDir;

  if (!is_dir($dirPath)) {
    throw new \RuntimeException("ディレクトリが存在しません: $dirPath");
  }

  return $this->scanDirectoryRecursive($dirPath, $relativeDir);
}

/**
 * 再帰的にディレクトリをスキャンしてツリー構造を作成する
 */
// <li n:class="$node->status === 'unreadable' ? 'text-muted' : ''">
//   {$node.name} ({$node.type}) {if $node->status !== 'ok'} - {$node.status}{/if}
//   {ifset $node.children}
//     <ul>
//       {foreach $node.children as $child}
//         {include this, node => $child}
//       {/foreach}
//     </ul>
//   {/ifset}
// </li>

  private function scanDirectoryRecursive(string $fullPath, string $relativePath): array
  {
    $status = is_readable($fullPath) ? 'ok' : 'unreadable';

    $tree = [
      'name' => basename($fullPath),
      'path' => $relativePath,
      'type' => 'directory',
      'status' => $status,
      'children' => []
    ];

    if ($status === 'ok') {
      $items = @scandir($fullPath);
      if ($items === false) {
        $tree['status'] = 'unreachable';
        return $tree;
      }

      foreach (array_diff($items, ['.', '..']) as $item) {
        $itemFullPath = $fullPath . DIRECTORY_SEPARATOR . $item;
        $itemRelativePath = $relativePath === '' ? $item : $relativePath . DIRECTORY_SEPARATOR . $item;

        if (is_dir($itemFullPath)) {
          $tree['children'][] = $this->scanDirectoryRecursive($itemFullPath, $itemRelativePath);
        } else {
          $fileStatus = is_readable($itemFullPath) ? 'ok' : 'unreadable';
          $tree['children'][] = [
            'name' => $item,
            'path' => $itemRelativePath,
            'type' => 'file',
            'status' => $fileStatus,
            'size' => $fileStatus === 'ok' ? filesize($itemFullPath) : null,
            'modified' => $fileStatus === 'ok' ? filemtime($itemFullPath) : null
          ];
        }
      }
    }
    return $tree;
  }

  /**
   * 指定されたディレクトリをZIPファイルに圧縮する
   */
  public function createZip(string $sourceDir, string $destinationDir, string $zipName): array
  {
    $sourceDir = $this->normalizePath($sourceDir);
    $destinationDir = $this->normalizePath($destinationDir);

    $sourcePath = $this->baseDir . DIRECTORY_SEPARATOR . $sourceDir;
    $destinationPath = $this->baseDir . DIRECTORY_SEPARATOR . $destinationDir;

    if (!class_exists('ZipArchive')) {
      throw new \RuntimeException("ZipArchive クラスが見つかりません。");
    }

    if (!is_dir($sourcePath)) {
      throw new \RuntimeException("指定されたフォルダが存在しません: $sourcePath");
    }

    if (!is_dir($destinationPath)) {
      throw new \RuntimeException("保存先フォルダが存在しません: $destinationPath");
    }

    $zipPath = $destinationPath . DIRECTORY_SEPARATOR . $zipName;
    $zip = new ZipArchive();

    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
      throw new \RuntimeException("ZIPファイルを作成できませんでした: $zipPath");
    }

    $files = new RecursiveIteratorIterator(
      new RecursiveDirectoryIterator($sourcePath, RecursiveDirectoryIterator::SKIP_DOTS),
      RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($files as $file) {
      if (!$file->isDir()) {
        $filePath = $file->getRealPath();
        $relativePath = substr($filePath, strlen($sourcePath) + 1);
        $zip->addFile($filePath, $relativePath);
      }
    }

    $zip->close();
    return ['zip_path' => $zipPath];
  }

  public function createAsciiFolderName(string $title): string {
    // UTF-8 → ASCII（ローマ字変換＋記号除去）
    $transliterated = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $title);

    // 小文字にして、空白や記号をアンダースコアに
    $safe = strtolower($transliterated);
    $safe = preg_replace('/[^a-z0-9]+/', '_', $safe);
    $safe = trim($safe, '_');

    // ハッシュで一意性を確保（SHA-1の先頭12文字）
    $hash = substr(sha1($title), 0, 12);

    // フォルダ名を組み立て（短縮タイトル＋ハッシュ）
    $short = substr($safe, 0, 30);
    return $short . '_' . $hash;
  }

  /**
   * パスをOSに合わせて正規化する（スラッシュやバックスラッシュを統一）
   */
  private function normalizePath(string $path): string
  {
    $trimmed = trim($path, "/\\");
    return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $trimmed);
  }
}
