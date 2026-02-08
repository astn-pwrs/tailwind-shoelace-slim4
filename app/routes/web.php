<?php

use Slim\App;
use App\View\EpubController;

return function (App $app) {
  $app->get('/', [EpubController::class , 'view']);
};



