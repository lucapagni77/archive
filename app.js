async function loadEssayIndex() {
  const res = await fetch("essays/index.json");
  if (!res.ok) throw new Error("Could not load essays/index.json");
  return await res.json();
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function normalise(str) {
  return (str || "").toLowerCase().trim();
}

function uniqueTags(items) {
  const set = new Set();
  items.forEach(i => (i.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

window.renderEssayIndex = async function renderEssayIndex() {
  const listEl = document.getElementById("essayList");
  const searchEl = document.getElementById("search");
  const tagEl = document.getElementById("tagFilter");

  try {
    const data = await loadEssayIndex();
    const essays = (data.essays || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

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

        const date = e.date ? `<span class="pill">${formatDate(e.date)}</span>` : "";
        const tags = (e.tags || []).map(t => `<span class="pill">${t}</span>`).join("");

        tile.innerHTML = `
          <h3><a href="essay.html?slug=${encodeURIComponent(e.slug)}">${e.title}</a></h3>
          <p>${e.description || ""}</p>
          <div>${date} ${tags}</div>
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
};

window.renderEssayPage = async function renderEssayPage() {
  const slug = getQueryParam("slug");
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const metaEl = document.getElementById("meta");
  const contentEl = document.getElementById("content");

  try {
    if (!slug) throw new Error("Missing ?slug= in URL.");

    const data = await loadEssayIndex();
    const essay = (data.essays || []).find(e => e.slug === slug);
    if (!essay) throw new Error("Essay not found in essays/index.json.");

    document.title = `${essay.title} — The Archive`;
    titleEl.textContent = essay.title || "Essay";
    descEl.textContent = essay.description || "";

    const date = essay.date ? `<span class="pill">${formatDate(essay.date)}</span>` : "";
    const tags = (essay.tags || []).map(t => `<span class="pill">${t}</span>`).join("");
    metaEl.innerHTML = `${date} ${tags}`;

    const mdRes = await fetch(`essays/${essay.file}`);
    if (!mdRes.ok) throw new Error(`Could not load essays/${essay.file}`);
    const md = await mdRes.text();

    contentEl.innerHTML = marked.parse(md);
  } catch (err) {
    titleEl.textContent = "Couldn’t load essay";
    contentEl.innerHTML = `<p class="muted">Error: ${err.message}</p>`;
  }
};
