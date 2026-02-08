<?php

return array_merge(
  ...[
    require __DIR__ . '/containers/settings.php',
    require __DIR__ . '/containers/config.php',
    require __DIR__ . '/containers/logger.php',
    require __DIR__ . '/containers/psr7.php',
    require __DIR__ . '/containers/renderer.php',
    require __DIR__ . '/containers/pdo.php',
    require __DIR__ . '/containers/web.php',
    require __DIR__ . '/containers/cache.php',
    require __DIR__ . '/containers/middleware.php'
]);