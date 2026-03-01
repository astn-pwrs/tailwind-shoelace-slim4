<?php

use Slim\App;
use App\API\EpubController;

return function (App $app) {
  $app->post('/api/epub/setup',[EpubController::class,'setup'])->setname("epub.setup");
  // $app->post('/folders[/{path:.*}]', FolderController::class . ':create');
};