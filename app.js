let flow = null;
let history = [];
let currentNodeId = null;

// Para volver desde AYUDA al nodo exacto que la abrió
let helpReturnNodeId = null;

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
  if (pushHistory && currentNodeId && currentNodeId !== "__HELP__") {
    history.push(currentNodeId);
  }
  currentNodeId = nodeId;
  renderNode(flow.nodes[nodeId]);
}

function goBack() {
  if (history.length === 0) return;
  currentNodeId = history.pop();
  renderNode(flow.nodes[currentNodeId]);
}

function restart() {
  history = [];
  helpReturnNodeId = null;
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
  const bodyText = (node.body || "").trim();
  const body = document.createElement("p");
  body.textContent = bodyText;
  if (!bodyText) body.style.display = "none";

  /* Fila de acciones secundarias (Ayuda + PDF) */
  const actionsRow = document.createElement("div");
  actionsRow.className = "helpRow";

  let hasActions = false;

  /* Botón Ayuda */
  if (node.helpSrc) {
    const helpBtn = document.createElement("button");
    helpBtn.className = "btn help";
    helpBtn.textContent = "Ayuda";
    helpBtn.onclick = () => openHelp(node);
    actionsRow.appendChild(helpBtn);
    hasActions = true;
  }

  /* Botón PDF */
  if (node.pdfUrl && node.pdfLabel) {
    const pdfBtn = document.createElement("button");
    pdfBtn.className = "btn primary";
    pdfBtn.textContent = node.pdfLabel;
    pdfBtn.onclick = () => {
      window.open(node.pdfUrl, "_blank", "noopener,noreferrer");
    };
    actionsRow.appendChild(pdfBtn);
    hasActions = true;
  }

  if (!hasActions) actionsRow.style.display = "none";

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
  } else {
    buttons.style.display = "none";
  }

  card.append(topBar, title, body, actionsRow, buttons);
  app.appendChild(card);
}

/* ===============================
   Pantalla de ayuda (Markdown)
   ✅ Volver vuelve al nodo que abrió la ayuda
================================ */
function openHelp(node) {
  // Guardamos el nodo actual (desde el que se abrió ayuda)
  helpReturnNodeId = currentNodeId;
  currentNodeId = "__HELP__";

  app.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card help-card";

  /* Barra superior */
  const topBar = document.createElement("div");
  topBar.className = "top-bar";

  const backBtn = document.createElement("button");
  backBtn.className = "btn secondary";
  backBtn.textContent = "◀ Volver";
  backBtn.onclick = () => {
    // 🔥 Aquí está el cambio: volver al nodo que abrió la ayuda
    if (helpReturnNodeId && flow.nodes[helpReturnNodeId]) {
      const returnId = helpReturnNodeId;
      helpReturnNodeId = null;
      goTo(returnId, false); // sin tocar historial
    }
  };

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
  content.className = "helpMarkdown";
  content.innerHTML = "Cargando ayuda…";

  card.append(topBar, title, content);
  app.appendChild(card);

  fetch(node.helpSrc)
    .then(res => res.text())
    .then(md => {
      content.innerHTML = marked.parse(md);
    })
    .catch(() => {
      content.innerHTML = "<p>Error al cargar el procedimiento.</p>";
    });
}
