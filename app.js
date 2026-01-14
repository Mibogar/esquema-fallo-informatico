const app = document.getElementById("app");
app.innerHTML = "<div style='padding:20px;font-family:Arial'>Cargando flow.json...</div>";

fetch("./flow.json", { cache: "no-store" })
  .then(r => {
    if (!r.ok) throw new Error("No se pudo cargar flow.json (HTTP " + r.status + ")");
    return r.json();
  })
  .then(flow => {
    const start = flow.start;
    const node = flow.nodes?.[start];
    if (!node) throw new Error("flow.json cargó, pero el nodo inicial '" + start + "' no existe.");

    app.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e5e7eb">
        <div style="max-width:700px;width:90%;background:#020617;padding:24px;border-radius:12px">
          <h1 style="margin:0 0 10px 0">${node.title}</h1>
          <p style="color:#cbd5f5;margin:0">flow.json cargado OK ✅</p>
        </div>
      </div>
    `;
  })
  .catch(err => {
    app.innerHTML = `
      <div style="padding:20px;font-family:Arial">
        <h1 style="color:#ef4444">ERROR</h1>
        <pre style="white-space:pre-wrap;background:#111827;color:#e5e7eb;padding:12px;border-radius:8px">${err.message}</pre>
        <p>Consejo: revisa que <b>flow.json</b> exista en la misma carpeta que <b>index.html</b> y que el nombre sea exactamente <b>flow.json</b>.</p>
      </div>
    `;
  });
