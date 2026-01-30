let flow = null;
let history = [];
let currentNodeId = null;

const app = document.getElementById("app");

/* ===============================
   Cargar flujo
================================ */
fetch("flow.json")
  .then(res => res.json())
  .then(data => {
    flow = data;
    goTo(flow.start);
  })
  .catch(() => {
    app.innerHTML = "<p>Error cargando el flujo.</p>";
  });

/* ===============================
   Navegación
================================ */
function goTo(nodeId, pushHistory = true) {
  if (pushHistory && currentNodeId) {
    history.push(currentNodeId);
  }
  currentNodeId = nodeId;
  renderNode(flow.nodes[nodeId]);
}

function goBack() {
  if (history.length === 0) return;
  currentNodeId = history.pop();
  renderNode(flow.nodes[currentNodeId], false);
}

function restart() {
  history = [];
  goTo(flow.start, false);
}

/* ===============================
   Renderizado
================================ */
function renderNode(node) {
  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";

  /* Barra superior */
  const topBar = document.createElement("div");
  topBar.className = "top-bar";

  const backBtn = document.createElement("button");
  backBtn.className = "btn secondary";
  backBtn.textContent = "◀ Volver";
  backBtn.onclick = goBack;

  const restartBtn = document.createElement("button");
  restartBtn.className = "btn secondary";
  restartBtn.textContent = "⟳ Reiniciar";
  restartBtn.onclick = restart;

  topBar.append(backBtn, restartBtn);

  /* Título */
  const title = document.createElement("h1");
  title.textContent = node.title;

  /* Texto principal */
  const body = document.createElement("p");
  body.textContent = node.body || "";

  /* Botón ayuda */
  let helpBtn = null;
  if (node.helpSrc) {
    helpBtn = document.createElement("button");
    helpBtn.className = "btn help";
    helpBtn.textContent = "Ayuda";
    helpBtn.onclick = () => openHelp(node);
  }

  /* Botones de decisión */
  const buttons = document.createElement("div");
  buttons.className = "buttons";

  if (node.buttons) {
    node.buttons.forEach(b => {
      const btn = document.createElement("button");
      btn.className = `btn ${b.style || "primary"}`;
      btn.textContent = b.label;
      btn.onclick = () => goTo(b.next);
      buttons.appendChild(btn);
    });
  }

  card.append(topBar, title, body);
  if (helpBtn) card.appendChild(helpBtn);
  card.appendChild(buttons);

  app.appendChild(card);
}

/* ===============================
   Pantalla de ayuda (Markdown)
================================ */
function openHelp(node) {
  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card help-card";

  /* Barra superior */
  const topBar = document.createElement("div");
  topBar.className = "top-bar";

  const backBtn = document.createElement("button");
  backBtn.className = "btn secondary";
  backBtn.textContent = "◀ Volver";
  backBtn.onclick = goBack;

  const restartBtn = document.createElement("button");
  restartBtn.className = "btn secondary";
  restartBtn.textContent = "⟳ Reiniciar";
  restartBtn.onclick = restart;

  topBar.append(backBtn, restartBtn);

  /* Título */
  const title = document.createElement("h1");
  title.textContent = `AYUDA — ${node.title}`;

  /* Contenedor Markdown */
  const content = document.createElement("div");
  content.className = "help-content";
  content.innerHTML = "Cargando ayuda…";

  card.append(topBar, title, content);
  app.appendChild(card);

  /* 🔴 AQUÍ está la clave */
  fetch(node.helpSrc)
    .then(res => res.text())
    .then(md => {
      content.innerHTML = marked.parse(md);
    })
    .catch(() => {
      content.innerHTML = "<p>Error al cargar el procedimiento.</p>";
    });
}
