let FLOW = null;
let currentId = null;
const historyStack = [];

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(nodeId, pushHistory = true) {
  const app = document.getElementById("app");
  const node = FLOW?.nodes?.[nodeId];

  if (!node) {
    app.innerHTML = `
      <div class="card">
        <h1>Error</h1>
        <p>No existe el nodo: <b>${escapeHtml(nodeId)}</b></p>
        <div class="buttons">
          <button class="btn secondary" id="goHome">Volver al inicio</button>
        </div>
      </div>
    `;
    document.getElementById("goHome").onclick = () => render(FLOW.start, false);
    return;
  }

  if (pushHistory && currentId) historyStack.push(currentId);
  currentId = nodeId;

  const buttonsHtml = (node.buttons || [])
    .map(
      (b, i) => `
      <button class="btn ${escapeHtml(b.style || "primary")}" data-next="${escapeHtml(
        b.next
      )}" data-idx="${i}">
        ${escapeHtml(b.label)}
      </button>`
    )
    .join("");

  app.innerHTML = `
    <div class="card">
      <div class="topbar">
        <button class="btn ghost" id="backBtn" ${historyStack.length === 0 ? "disabled" : ""}>◀ Volver</button>
        <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
      </div>

      <h1 class="title">${escapeHtml(node.title)}</h1>
      <p class="body">${escapeHtml(node.body || "")}</p>

      <div class="buttons">
        ${buttonsHtml}
      </div>
    </div>
  `;

  document.getElementById("backBtn").onclick = () => {
    const prev = historyStack.pop();
    if (prev) render(prev, false);
  };
  document.getElementById("resetBtn").onclick = () => {
    historyStack.length = 0;
    render(FLOW.start, false);
  };

  // Botones del nodo
  app.querySelectorAll("button[data-next]").forEach((btn) => {
    btn.onclick = () => render(btn.getAttribute("data-next"));
  });
}

async function init() {
  const app = document.getElementById("app");
  app.innerHTML = "<div style='padding:20px;font-family:Arial'>Cargando...</div>";

  const res = await fetch("./flow.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar flow.json (HTTP ${res.status})`);

  FLOW = await res.json();
  if (!FLOW.start || !FLOW.nodes) throw new Error("flow.json no tiene el formato esperado (start/nodes).");

  render(FLOW.start, false);
}

init().catch((err) => {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div style="padding:20px;font-family:Arial">
      <h1 style="color:#ef4444">ERROR</h1>
      <pre style="white-space:pre-wrap;background:#111827;color:#e5e7eb;padding:12px;border-radius:8px">${escapeHtml(err.message)}</pre>
    </div>
  `;
});
