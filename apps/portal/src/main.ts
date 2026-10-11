import './style.css';

type GameListing = { id: string; title: string; description: string; category: string; icon: string; accent: string };

const list = document.querySelector<HTMLDivElement>('#game-list');
const count = document.querySelector<HTMLElement>('#count');
const error = document.querySelector<HTMLParagraphElement>('#catalog-error');
if (!list || !count || !error) throw new Error('Missing portal elements');
const container = list;
const countLabel = count;
const errorLabel = error;

async function loadCatalog(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}catalog.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Catalogue indisponible');
    const games: GameListing[] = await response.json() as GameListing[];
    countLabel.textContent = `${games.length} jeu${games.length > 1 ? 'x' : ''} disponible${games.length > 1 ? 's' : ''}`;
    if (!games.length) { container.textContent = 'De nouveaux jeux arrivent bientôt.'; return; }
    for (const game of games) {
      const card = document.createElement('a');
      card.className = 'game-card';
      card.href = `${import.meta.env.BASE_URL}play/${encodeURIComponent(game.id)}/`;
      card.setAttribute('aria-label', `Jouer à ${game.title}`);
      card.style.setProperty('--accent', game.accent);
      const image = document.createElement('div');
      image.className = 'game-art';
      const symbol = document.createElement('span');
      symbol.className = 'game-symbol'; symbol.textContent = game.icon;
      image.append(symbol);
      const meta = document.createElement('div'); meta.className = 'game-meta';
      const tag = document.createElement('span'); tag.className = 'game-tag'; tag.textContent = game.category;
      const title = document.createElement('h3'); title.textContent = game.title;
      const description = document.createElement('p'); description.textContent = game.description;
      const cta = document.createElement('span'); cta.className = 'game-cta'; cta.textContent = 'Jouer maintenant →';
      meta.append(tag, title, description, cta);
      card.append(image, meta);
      container.append(card);
    }
  } catch {
    countLabel.textContent = 'Catalogue indisponible';
    errorLabel.hidden = false;
    errorLabel.textContent = 'Le catalogue des jeux n’a pas pu être chargé.';
  }
}

void loadCatalog();
