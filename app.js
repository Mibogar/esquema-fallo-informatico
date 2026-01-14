const app = document.getElementById("app");
app.innerHTML = "<p>Cargando flow.json...</p>";

fetch("./flow.json", { cache: "no-store" })
  .then(r => {
    if (!r.ok) throw new Error("No se pudo cargar flow.json (HTTP " + r.status + ")");
    return r.json();
  })
  .then(flow => {
    app.innerHTML = `
      <h1>${flow.nodes[flow.start].title}</h1>
      <p>flow.json cargado OK ✅</p>
    `;
  })
  .catch(err => {
    app.innerHTML = `<h1>Error</h1><pre>${err.message}</pre>`;
  });
