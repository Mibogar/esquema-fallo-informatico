let flow;

function render(id) {
  const node = flow.nodes[id];
  const app = document.getElementById("app");

  const buttons = node.buttons.map(b =>
    `<button class="${b.style}" onclick="render('${b.next}')">${b.label}</button>`
  ).join("");

  app.innerHTML = `
    <div class="card">
      <h1>${node.title}</h1>
      <p>${node.body}</p>
      ${buttons}
    </div>
  `;
}

fetch("flow.json")
  .then(r => r.json())
  .then(data => {
    flow = data;
    render(flow.start);
  });

