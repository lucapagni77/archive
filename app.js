async function loadEssayIndex() {
  const res = await fetch("essays/index.json");
  if (!res.ok) throw new Error("Could not load essays/index.json");
  return await res.json();
}

function normalise(str) {
  return (str || "").toLowerCase().trim();
}

function uniqueTags(items) {
  const set = new Set();
  items.forEach(i => (i.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a,b) => a.localeCompare(b));
}

window.renderEssayIndex = async function renderEssayIndex() {
  const listEl = document.getElementById("essayList");
  const searchEl = document.getElementById("search");
  const tagEl = document.getElementById("tagFilter");

  try {
    const data = await loadEssayIndex();
    const essays = (data.essays || []).slice().sort((a,b) => (b.date || "").localeCompare(a.date || ""));

    uniqueTags(essays).forEach(tag => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      tagEl.appendChild(opt);
    });

    function render() {
      const q = normalise(searchEl.value);
      const tag = tagEl.value;

      const filtered = essays.filter(e => {
        const hay = normalise([e.title, e.description, (e.tags || []).join(" ")].join(" "));
        const matchesQ = q ? hay.includes(q) : true;
        const matchesTag = tag ? (e.tags || []).includes(tag) : true;
        return matchesQ && matchesTag;
      });

      listEl.innerHTML = "";
      if (!filtered.length) {
        listEl.innerHTML = `<div class="card"><p class="muted">No essays match that search.</p></div>`;
        return;
      }

      filtered.forEach(e => {
        const tile = document.createElement("article");
        tile.className = "card tile";
        const tags = (e.tags || []).map(t => `<span class="pill">${t}</span>`).join("");
        tile.innerHTML = `
          <h3><a href="#">${e.title}</a></h3>
          <p>${e.description || ""}</p>
          <div>${tags}</div>
        `;
        listEl.appendChild(tile);
      });
    }

    searchEl.addEventListener("input", render);
    tagEl.addEventListener("change", render);
    render();
  } catch (err) {
    listEl.innerHTML = `<div class="card"><p class="muted">Error: ${err.message}</p></div>`;
  }
}
