let FLOW = null;
let currentId = null;
const historyStack = [];

/* --- Utilidad para evitar problemas con HTML --- */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* --- Carga segura de texto (Markdown) --- */
async function fetchText(path) {
  const res = await fetch("./" + path, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${path} (HTTP ${res.status})`);
  return await res.text();
}

/* --- Render de un "visor de ayuda" (Markdown como texto tal cual) --- */
async function renderHelpFromSrc(node, srcPath) {
  const app = document.getElementById("app");

  // Guardamos el nodo actual para que VOLVER funcione
  if (currentId) historyStack.push(currentId);
  currentId = "__HELP__";

  app.innerHTML = `
    <div class="card">
      <div class="topbar">
        <button class="btn ghost" id="backBtn">◀ Volver</button>
        <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
      </div>

      <h1 class="title">AYUDA — ${escapeHtml(node.title)}</h1>
      <p class="body">Cargando procedimiento...</p>
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

  try {
    const text = await fetchText(srcPath);

    // Mostramos el markdown "tal cual" (sin interpretar). Fácil, robusto, cero dependencias.
    // Si más adelante quieres que se vea “bonito” (títulos/viñetas renderizadas),
    // lo hacemos con un parser Markdown, pero esto ya te funciona perfecto hoy.
    app.innerHTML = `
      <div class="card">
        <div class="topbar">
          <button class="btn ghost" id="backBtn">◀ Volver</button>
          <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
        </div>

        <h1 class="title">AYUDA — ${escapeHtml(node.title)}</h1>

        <pre class="helpText">${escapeHtml(text)}</pre>
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
  } catch (err) {
    app.innerHTML = `
      <div class="card">
        <div class="topbar">
          <button class="btn ghost" id="backBtn">◀ Volver</button>
          <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
        </div>

        <h1 class="title">AYUDA — ${escapeHtml(node.title)}</h1>

        <pre class="helpText" style="color:#ffb4b4">${escapeHtml(err.message)}</pre>
        <p class="body">Revisa que el archivo exista y que la ruta en <b>helpSrc</b> sea correcta.</p>
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
  }
}

/* --- Render de un nodo normal --- */
function render(nodeId, pushHistory = true) {
  const app = document.getElementById("app");
  const node = FLOW?.nodes?.[nodeId];

  if (!node) {
    app.innerHTML = `
      <div class="card">
        <div class="topbar">
          <button class="btn ghost" disabled>◀ Volver</button>
          <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
        </div>

        <h1 class="title">Error</h1>
        <p class="body">No existe el nodo: <b>${escapeHtml(nodeId)}</b></p>

        <div class="buttons">
          <button class="btn secondary" id="goHome">Reiniciar</button>
        </div>
      </div>
    `;

    document.getElementById("resetBtn").onclick = () => {
      historyStack.length = 0;
      render(FLOW.start, false);
    };
    document.getElementById("goHome").onclick = () => {
      historyStack.length = 0;
      render(FLOW.start, false);
    };
    return;
  }

  if (pushHistory && currentId && currentId !== "__HELP__") historyStack.push(currentId);
  currentId = nodeId;

  // AYUDA si existe helpSrc o help (compatibilidad)
  const hasHelp = !!node.helpSrc || !!node.help;
  const helpBtnHtml = hasHelp
    ? `<div class="helpRow"><button class="btn help" id="helpBtn">Ayuda</button></div>`
    : "";

  const buttonsHtml = (node.buttons || [])
    .map(
      (b) => `
      <button class="btn ${escapeHtml(b.style || "primary")}"
              data-next="${escapeHtml(b.next)}">
        ${escapeHtml(b.label)}
      </button>`
    )
    .join("");

  app.innerHTML = `
    <div class="card">
      <div class="topbar">
        <button class="btn ghost" id="backBtn" ${
          historyStack.length === 0 ? "disabled" : ""
        }>◀ Volver</button>

        <button class="btn ghost" id="resetBtn">⟲ Reiniciar</button>
      </div>

      <h1 class="title">${escapeHtml(node.title)}</h1>
      <p class="body">${escapeHtml(node.body || "")}</p>

      ${helpBtnHtml}

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

  // Click AYUDA
  if (hasHelp) {
    document.getElementById("helpBtn").onclick = async () => {
      // Nuevo sistema: helpSrc (archivo externo)
      if (node.helpSrc) {
        await renderHelpFromSrc(node, node.helpSrc);
        return;
      }
      // Sistema antiguo: help (nodo interno)
      if (node.help) {
        render(node.help);
      }
    };
  }

  // Botones de decisión
  app.querySelectorAll("button[data-next]").forEach((btn) => {
    btn.onclick = () => render(btn.getAttribute("data-next"));
  });
}

/* --- Inicialización --- */
async function init() {
  const app = document.getElementById("app");
  app.innerHTML = "<div style='padding:20px;font-family:Arial'>Cargando...</div>";

  const res = await fetch("./flow.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar flow.json (HTTP ${res.status})`);

  FLOW = await res.json();
  if (!FLOW.start || !FLOW.nodes) {
    throw new Error("flow.json no tiene el formato esperado (falta start o nodes)");
  }

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

/* --- PWA: registrar Service Worker (lo haremos después) --- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
