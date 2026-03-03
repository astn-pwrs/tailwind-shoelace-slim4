import express from "express";
import { redis } from "./redis.js";
import { syncAll } from "./sync/index.js";

const app = express();
app.use(express.json());

app.post("/sync", async (req, res) => {
  // ロック取得（30秒）
  const lock = await redis.set("RBAC:SYNC:LOCK", "1", {
    NX: true,
    EX: 30,
  });

  if (!lock) {
    return res.status(423).json({
      status: "locked",
      message: "RBAC sync already running",
    });
  }

  try {
    await syncAll();
    return res.json({ status: "ok", message: "RBAC synced" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  } finally {
    await redis.del("RBAC:SYNC:LOCK");
  }
});

app.listen(3000, () => {
  console.log("RBAC Sync Service running on port 3000");
});
