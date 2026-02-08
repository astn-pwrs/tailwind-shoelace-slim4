let currentTable = null;
let editingId = null;

/* -------------------------
   ダークテーマ切替
------------------------- */
document.getElementById("theme-switch").addEventListener("sl-change", (e) => {
  if (e.target.checked) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
});

/* -------------------------
   テーブル一覧表示
------------------------- */
async function loadTable(table) {
  currentTable = table;

  const res = await fetch(`/api/${table}`);
  const rows = await res.json();

  if (!rows.length) {
    document.getElementById("table-container").innerHTML = `
      <sl-button variant="primary" onclick="openCreateForm()">Create</sl-button>
      <p class="mt-4 text-gray-500">No data</p>
    `;
    return;
  }

  const columns = Object.keys(rows[0]);

  let html = `
    <sl-button variant="primary" onclick="openCreateForm()">Create</sl-button>
    <sl-table class="mt-4">
      <sl-thead>
        <sl-tr>
          ${columns.map((c) => `<sl-th>${c}</sl-th>`).join("")}
          <sl-th>Actions</sl-th>
        </sl-tr>
      </sl-thead>
      <sl-tbody>
        ${rows
          .map(
            (r) => `
          <sl-tr>
            ${columns.map((c) => `<sl-td>${r[c]}</sl-td>`).join("")}
            <sl-td>
              <sl-button size="small" onclick="openEditForm('${r.id}')">Edit</sl-button>
              <sl-button size="small" variant="danger" onclick="deleteRow('${r.id}')">Delete</sl-button>
            </sl-td>
          </sl-tr>
        `,
          )
          .join("")}
      </sl-tbody>
    </sl-table>
  `;

  document.getElementById("table-container").innerHTML = html;
}

/* -------------------------
   Create
------------------------- */
async function openCreateForm() {
  const res = await fetch(`/api/${currentTable}/columns`);
  const columns = await res.json();

  let html = "";
  columns.forEach((col) => {
    if (col === "id") return;
    html += `
      <div>
        <label class="block text-sm font-medium">${col}</label>
        <sl-input name="${col}" class="w-full"></sl-input>
      </div>
    `;
  });

  document.getElementById("create-form").innerHTML = html;
  document.getElementById("create-dialog").show();
}

async function submitCreateForm() {
  const form = document.getElementById("create-form");
  const data = {};

  [...form.elements].forEach((el) => {
    if (el.name) data[el.name] = el.value;
  });

  const res = await fetch(`/api/${currentTable}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    alert("Validation error");
    return;
  }

  document.getElementById("create-dialog").hide();
  loadTable(currentTable);
}

/* -------------------------
   Edit
------------------------- */
async function openEditForm(id) {
  editingId = id;

  const res = await fetch(`/api/${currentTable}/${id}`);
  const row = await res.json();

  let html = "";
  Object.keys(row).forEach((col) => {
    if (col === "id") return;
    html += `
      <div>
        <label class="block text-sm font-medium">${col}</label>
        <sl-input name="${col}" value="${row[col]}" class="w-full"></sl-input>
      </div>
    `;
  });

  document.getElementById("edit-form").innerHTML = html;
  document.getElementById("edit-dialog").show();
}

async function submitEditForm() {
  const form = document.getElementById("edit-form");
  const data = {};

  [...form.elements].forEach((el) => {
    if (el.name) data[el.name] = el.value;
  });

  await fetch(`/api/${currentTable}/${editingId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  document.getElementById("edit-dialog").hide();
  loadTable(currentTable);
}

/* -------------------------
   Delete
------------------------- */
async function deleteRow(id) {
  if (!confirm("Delete this record?")) return;

  await fetch(`/api/${currentTable}/${id}`, { method: "DELETE" });
  loadTable(currentTable);
}

/* -------------------------
   RBAC Sync
------------------------- */
async function syncRbac() {
  const res = await fetch("http://localhost:3000/sync", { method: "POST" });
  const json = await res.json();
  alert(json.message);
}

async function loadRbacTree() {
  const res = await fetch("/api/rbac/tree");
  const tree = await res.json();

  const container = document.getElementById("table-container");
  container.innerHTML = ""; // テーブル表示を消す

  const treeContainer = document.getElementById("tree-container");
  treeContainer.innerHTML = "<h2 class='text-xl font-bold mb-4'>RBAC Tree</h2>";

  const slTree = document.createElement("sl-tree");

  tree.forEach((group) => {
    const groupNode = document.createElement("sl-tree-item");
    groupNode.label = `Group: ${group.label}`;
    groupNode.dataset.type = "group";
    groupNode.dataset.id = group.id;

    group.children.forEach((role) => {
      const roleNode = document.createElement("sl-tree-item");
      roleNode.label = `Role: ${role.label}`;
      roleNode.dataset.type = "role";
      roleNode.dataset.id = role.id;

      role.children.forEach((route) => {
        const routeNode = document.createElement("sl-tree-item");
        routeNode.label = `Route: ${route.label}`;
        routeNode.dataset.type = "route";
        routeNode.dataset.id = route.id;

        roleNode.appendChild(routeNode);
      });

      groupNode.appendChild(roleNode);
    });

    slTree.appendChild(groupNode);
  });

  treeContainer.appendChild(slTree);

  // クリック時の詳細表示
  slTree.addEventListener("sl-selection-change", (e) => {
    const item = e.detail.selection[0];
    if (!item) return;

    const type = item.dataset.type;
    const id = item.dataset.id;

    showRbacDetail(type, id);
  });
}

/* 詳細表示 */
async function showRbacDetail(type, id) {
  const container = document.getElementById("table-container");

  const res = await fetch(`/api/${type}s/${id}`);
  const data = await res.json();

  let html = `
    <h3 class="text-lg font-bold mb-2">${type.toUpperCase()} Detail</h3>
    <div class="space-y-2">
  `;

  Object.entries(data).forEach(([key, value]) => {
    html += `
      <div>
        <span class="font-medium">${key}:</span>
        <span>${value}</span>
      </div>
    `;
  });

  html += "</div>";

  container.innerHTML = html;
}
