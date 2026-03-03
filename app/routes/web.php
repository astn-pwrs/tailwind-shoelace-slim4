<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\View\EpubController;

return function (App $app) {
  $app->group('/md', function (RouteCollectorProxy $group) {
    $group->get('[/{action}]', [EpubController::class , 'top'])->setName("md");
  });
};



