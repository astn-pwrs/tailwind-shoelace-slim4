<?php

namespace App\Latte;
// $container->set('latte.rbac', function($c) {
//     $redis = new Redis();
//     $redis->connect('127.0.0.1', 6379);

//     // 認証ミドルウェアで user_id を request attribute に入れておく前提
//     $userId = $_SESSION['user_id'] ?? null;

//     return new \App\Latte\RbacHelper($redis, $userId);
// });

// $latte = new Latte\Engine;

// $latte->addFunction('isGroup', function($groupName) use ($container) {
//     return $container->get('latte.rbac')->isGroup($groupName);
// });

// $latte->addFunction('hasGroupRole', function($groupName, $roleId) use ($container) {
//     return $container->get('latte.rbac')->hasGroupRole($groupName, $roleId);
// });

class RbacHelper
{
    private \Redis $redis;
    private string $userId;

    public function __construct(\Redis $redis, string $userId)
    {
        $this->redis = $redis;
        $this->userId = $userId;
    }

    /**
     * ユーザが指定グループに所属しているか
     */
    public function isGroup(string $groupName): bool
    {
        return $this->redis->sIsMember("RBAC:GROUP:{$groupName}:USERS", $this->userId);
    }

    /**
     * ユーザが指定グループで指定ロールを持っているか
     */
    public function hasGroupRole(string $groupName, string $roleId): bool
    {
        return $this->redis->sIsMember("RBAC:GROUP:{$groupName}:ROLES", $roleId);
    }
}
