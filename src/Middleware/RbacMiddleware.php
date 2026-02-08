<?php

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Http\Server\MiddlewareInterface;

// $container->set(\App\Middleware\RbacMiddleware::class, function($c) {
//     $redis = new Redis();
//     $redis->connect('127.0.0.1', 6379);
//     return new \App\Middleware\RbacMiddleware($redis);
// });

// $app->add(\App\Middleware\RbacMiddleware::class);

class RbacMiddleware implements MiddlewareInterface
{
    private \Redis $redis;

    public function __construct(\Redis $redis)
    {
        $this->redis = $redis;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // 同期ロック中なら待つ
        $wait = 0;
        while ($this->redis->exists("RBAC:SYNC:LOCK")) {
            if ($wait > 5) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write("RBAC syncing, try again");
                return $response->withStatus(503);
            }
            sleep(1);
            $wait++;
        }

        // 認証済みユーザID（認証ミドルウェアでセット済み）
        $userId = $request->getAttribute("user_id");

        // Slim のルートオブジェクト取得
        $route = $request->getAttribute('route');
        if (!$route) {
            return $handler->handle($request);
        }

        // RouteRegistrar が自動でセットした route_id を取得
        $routeId = $route->getArgument('route_id');

        // ★ DB に存在しないルート（route_id が null）はフリーアクセス
        if (!$routeId) {
            return $handler->handle($request);
        }

        // ルートが許可するロール一覧
        $allowedRoles = $this->redis->smembers("RBAC:ROUTE:{$routeId}:ROLES");

        // ★ RBAC に登録されていないルートはフリーアクセス
        if (empty($allowedRoles)) {
            return $handler->handle($request);
        }

        // ユーザが所属するグループ一覧（Redis に同期済み）
        $groups = $this->redis->smembers("USER:{$userId}:GROUPS");

        if (!$groups) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write("Forbidden");
            return $response->withStatus(403);
        }

        // ユーザが持つロール一覧
        $userRoles = [];
        foreach ($groups as $groupName) {
            $roles = $this->redis->smembers("RBAC:GROUP:{$groupName}:ROLES");
            $userRoles = array_merge($userRoles, $roles);
        }
        $userRoles = array_unique($userRoles);

        // 積集合チェック
        $intersect = array_intersect($userRoles, $allowedRoles);

        if (empty($intersect)) {
            $response = new \Slim\Psr7\Response();
            $response->getBody()->write("Forbidden");
            return $response->withStatus(403);
        }

        return $handler->handle($request);
    }
}
