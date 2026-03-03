<?php

use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use App\Service\IOService;
use App\Service\EpubService;

return [
  IOService::class => function (ContainerInterface $container) {
    $baseDir  = $container->get('settings')['io']['basedir'];
    $logger   = $container->get(LoggerInterface::class);
    return new IOService( $baseDir,$logger); 
  },
  EpubService::class => function (ContainerInterface $container) { 
    $io   = $container->get(IOService::class);
    $logger   = $container->get(LoggerInterface::class);
    return new EpubService($io, $logger);
  }
];
