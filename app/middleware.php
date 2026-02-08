<?php

use Slim\App;

return function (App $app) {
  $app->addBodyParsingMiddleware();
  //
  $app->addRoutingMiddleware();
  // ログなどのカスタムミドルウェア
  // エラー処理（最後）
  $app->addErrorMiddleware(true, true, true); 
};