<?php
use Slim\App;
use Slim\Factory\AppFactory;
use Psr\Container\ContainerInterface;

$containers = array_merge(
    require __DIR__ . '/containers/settings.php',
    require __DIR__ . '/containers/config.php',
    require __DIR__ . '/containers/logger.php',
    require __DIR__ . '/containers/psr7.php',
    require __DIR__ . '/containers/renderer.php',
    require __DIR__ . '/containers/pdo.php',
    require __DIR__ . '/containers/service.php',
    require __DIR__ . '/containers/api.php',
    require __DIR__ . '/containers/web.php'
);

$containers[App::class] = function (ContainerInterface $c) {
    $app = AppFactory::createFromContainer($c);

    (require __DIR__.'/routes/web.php')($app);
    (require __DIR__.'/routes/api.php')($app);
    (require __DIR__.'/middleware.php')($app);

    return $app;
};

return $containers;
