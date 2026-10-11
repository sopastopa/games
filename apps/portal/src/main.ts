import "./style.css";

type GameListing = Readonly<{
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  accent: string;
}>;

function required<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error("Missing portal element: " + selector);
  return node;
}

const list = required<HTMLDivElement>("#game-list");
const count = required<HTMLElement>("#count");
const heroCount = required<HTMLElement>("#hero-count");
const filters = required<HTMLDivElement>("#filters");
const search = required<HTMLInputElement>("#game-search");
const error = required<HTMLParagraphElement>("#catalog-error");
const empty = required<HTMLDivElement>("#empty-state");
const clear = required<HTMLButtonElement>("#clear-filters");

let catalog: readonly GameListing[] = [];
let category = "Tous";
let searchTerm = "";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function artFor(game: GameListing): HTMLElement {
  const art = document.createElement("div");
  art.className = "game-art";
  art.classList.add("art-" + game.id);
  art.setAttribute("aria-hidden", "true");
  art.style.setProperty("--cover-accent", game.accent);

  const registration = document.createElement("span");
  registration.className = "art-registration";
  registration.textContent = "G / " + game.id.toUpperCase();
  const shape = document.createElement("div");
  shape.className = "art-composition";
  for (let index = 0; index < 4; index++) {
    const element = document.createElement("span");
    element.className = "art-element art-element-" + (index + 1);
    shape.append(element);
  }
  const icon = document.createElement("span");
  icon.className = "art-symbol";
  icon.textContent = game.icon;
  shape.append(icon);

  const corner = document.createElement("span");
  corner.className = "art-corner";
  corner.textContent = "✳";
  art.append(registration, shape, corner);
  return art;
}

function createCard(
  game: GameListing,
  featured: boolean,
  index: number,
): HTMLAnchorElement {
  const card = document.createElement("a");
  card.className = featured ? "game-card game-card-featured" : "game-card";
  card.href = `${import.meta.env.BASE_URL}play/${encodeURIComponent(game.id)}/`;
  card.setAttribute("aria-label", `Jouer à ${game.title}`);
  card.style.setProperty("--card-accent", game.accent);

  const meta = document.createElement("div");
  meta.className = "game-meta";
  const row = document.createElement("div");
  row.className = "game-meta-top";
  const tag = document.createElement("span");
  tag.className = "game-tag";
  tag.textContent = game.category;
  const number = document.createElement("span");
  number.className = "game-number";
  number.textContent = String(index + 1).padStart(2, "0") + " / GAMES";
  row.append(tag, number);

  const heading = document.createElement("h3");
  heading.textContent = game.title;
  const description = document.createElement("p");
  description.textContent = game.description;
  const callToAction = document.createElement("span");
  callToAction.className = "game-cta";
  callToAction.append("Découvrir ce jeu");
  const arrow = document.createElement("span");
  arrow.className = "cta-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  callToAction.append(arrow);

  meta.append(row, heading, description, callToAction);
  card.append(artFor(game), meta);
  return card;
}

function render(): void {
  const query = normalize(searchTerm);
  const matches = catalog.filter((game) => {
    const correctCategory = category === "Tous" || game.category === category;
    const haystack = normalize(
      [game.title, game.category, game.description].join(" "),
    );
    return correctCategory && (!query || haystack.includes(query));
  });
  const featuredId =
    catalog.find((game) => game.id === "nuage")?.id ?? catalog[0]?.id;
  const sorted = [...matches].sort((first, second) => {
    if (first.id === featuredId) return -1;
    if (second.id === featuredId) return 1;
    return first.title.localeCompare(second.title, "fr");
  });
  list.replaceChildren(
    ...sorted.map((game, index) =>
      createCard(
        game,
        game.id === featuredId && !query && category === "Tous",
        index,
      ),
    ),
  );
  list.setAttribute("aria-busy", "false");
  empty.hidden = matches.length > 0 || catalog.length === 0;
  count.textContent =
    matches.length +
    (matches.length === 1 ? " jeu" : " jeux") +
    (matches.length !== catalog.length ? " sur " + catalog.length : "") +
    " à découvrir";
  for (const filter of filters.querySelectorAll<HTMLButtonElement>("button")) {
    const selected = filter.dataset.category === category;
    filter.setAttribute("aria-pressed", String(selected));
    filter.classList.toggle("is-active", selected);
  }
}

function renderFilters(): void {
  const categories = [
    "Tous",
    ...Array.from(new Set(catalog.map((game) => game.category))).sort((a, b) =>
      a.localeCompare(b, "fr"),
    ),
  ];
  const buttons = categories.map((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = name;
    button.dataset.category = name;
    button.setAttribute("aria-pressed", String(name === category));
    button.addEventListener("click", () => {
      category = name;
      render();
    });
    return button;
  });
  filters.replaceChildren(...buttons);
}

function validListing(value: unknown): value is GameListing {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    /^[a-z][a-z0-9-]*$/.test(candidate.id) &&
    ["title", "description", "category", "icon", "accent"].every(
      (key) => typeof candidate[key] === "string",
    )
  );
}

async function loadCatalog(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}catalog.json`, {
      cache: "no-cache",
    });
    if (!response.ok) throw new Error("Catalogue indisponible");
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(validListing))
      throw new Error("Catalogue invalide");
    catalog = data;
    heroCount.textContent = String(catalog.length).padStart(2, "0");
    if (catalog.length === 0) {
      count.textContent = "Aucun jeu pour le moment";
      list.textContent = "De nouveaux jeux arrivent bientôt.";
      list.setAttribute("aria-busy", "false");
      return;
    }
    renderFilters();
    render();
  } catch {
    list.setAttribute("aria-busy", "false");
    count.textContent = "Catalogue indisponible";
    error.hidden = false;
    error.textContent =
      "Le catalogue n’a pas pu être chargé. Réessayez plus tard.";
  }
}

search.addEventListener("input", () => {
  searchTerm = search.value;
  render();
});

clear.addEventListener("click", () => {
  category = "Tous";
  searchTerm = "";
  search.value = "";
  render();
  search.focus();
});

void loadCatalog();
