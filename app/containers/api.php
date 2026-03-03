<?php

use App\Service\EpubService;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

use App\API\EpubController;

return [
  EpubController::class => function (ContainerInterface $container) {
    $service  = $container->get(EpubService::class);
    $logger   = $container->get(LoggerInterface::class);
    return new EpubController($service,$logger);
  }
];