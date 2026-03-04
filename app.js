async function loadEssayIndex() {
  const res = await fetch("essays/index.json");
  if (!res.ok) throw new Error("Could not load essays/index.json (404). Check folder/path.");
  return await res.json();
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

window.renderEssayIndex = async function () {
  const listEl = document.getElementById("essayList");
  try {
    const data = await loadEssayIndex();
    const essays = (data.essays || []).slice();

    listEl.innerHTML = "";
    essays.forEach(e => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <h3 style="margin:0 0 6px;">
          <a href="essay.html?slug=${encodeURIComponent(e.slug)}">${e.title}</a>
        </h3>
        <p class="muted" style="margin:0 0 12px;">${e.description || ""}</p>
      `;
      listEl.appendChild(card);
    });
  } catch (err) {
    listEl.innerHTML = `<div class="card"><p class="muted">Error: ${err.message}</p></div>`;
  }
};

window.renderEssayPage = async function () {
  const slug = getQueryParam("slug");
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");
  const metaEl = document.getElementById("meta");
  const contentEl = document.getElementById("content");

  try {
    if (!slug) throw new Error("Missing ?slug= in URL.");

    const data = await loadEssayIndex();
    const essay = (data.essays || []).find(e => e.slug === slug);
    if (!essay) throw new Error(`Essay slug "${slug}" not found in essays/index.json`);

    titleEl.textContent = essay.title || "Essay";
    descEl.textContent = essay.description || "";

    const tags = (essay.tags || []).map(t => `<span class="pill">${t}</span>`).join("");
    const date = essay.date ? `<span class="pill">${formatDate(essay.date)}</span>` : "";
    metaEl.innerHTML = `${date}${tags}`;

    // Debug line: show what file it's trying to load
    const filePath = `essays/${essay.file}`;
    console.log("Loading markdown:", filePath);

    const mdRes = await fetch(filePath);
    if (!mdRes.ok) throw new Error(`Could not load ${filePath} (HTTP ${mdRes.status}). Check filename/case.`);

    const md = await mdRes.text();

    if (typeof marked === "undefined") {
      throw new Error("marked.js not loaded. The CDN script failed.");
    }

    contentEl.innerHTML = marked.parse(md);
    document.title = `${essay.title} — The Archive`;
  } catch (err) {
    contentEl.innerHTML = `<p class="muted"><strong>Error:</strong> ${err.message}</p>`;
  }
};
