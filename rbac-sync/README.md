                ┌──────────────────────────────┐
                │        PostgreSQL            │
                │ groups / roles / routes ...  │
                └───────────────┬──────────────┘
                                │
                                ▼
                ┌──────────────────────────────┐
                │   Node RBAC Sync Service     │
                │  (Express + pg + redis)      │
                └───────────────┬──────────────┘
                                │
                                ▼
        ┌────────────────────────────────────────────────────┐
        │                      Redis / Garnet                │
        │                                                    │
        │  RBAC:GROUP:{g}:USERS       → group user           │
        │  RBAC:GROUP:{g}:ROLES       → group role           │
        │  RBAC:ROLE:{r}:PERMISSIONS  → role permission      │
        │  RBAC:ROLE:{r}:ROUTES       → allow route          │
        │  RBAC:ROUTE:{id}:ROLES      → allow route role     │
        │  RBAC:SYNC:LOCK             → sync lock            │
        └────────────────────────────────────────────────────┘
                                ▲
                                │
                 ┌──────────────┴───────────────┐
                 │         Slim4 API            │
                 │  Latte isGroup / hasGroupRole│
                 │  check route role            │
                 └──────────────────────────────┘
