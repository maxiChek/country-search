import { createSearchController } from './searchController.js';
import { searchCountries } from './searchCountries.js';
import type { CountryCard } from './mapCountryResponse.js';

// ---------- UI Initialization ----------

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      el.setAttribute(key, value);
    }
  }
  return el;
}

function initUI() {
  const app = createElement('main', 'app');

  const title = createElement('h1');
  title.textContent = 'Country Search';

  const searchContainer = createElement('div', 'search');
  const label = createElement('label', 'visually-hidden', { for: 'search-input' });
  label.textContent = 'Search countries';

  const searchInput = createElement('input', '', {
    id: 'search-input',
    type: 'search',
    placeholder: 'Start typing a country name…',
    autocomplete: 'off',
    spellcheck: 'false',
    'aria-describedby': 'search-status',
  });

  const historyEl = createElement('div', 'search-history', { id: 'search-history' });

  searchContainer.append(label, searchInput, historyEl);

  const statusEl = createElement('div', 'status', {
    id: 'search-status',
    role: 'status',
    'aria-live': 'polite',
  });
  const resultsEl = createElement('ul', 'results', {
    id: 'results',
    'aria-label': 'Country search results',
  });

  app.append(title, searchContainer, statusEl, resultsEl);
  document.body.append(app);

  return { searchInput, statusEl, resultsEl, historyEl };
}

const { searchInput, statusEl, resultsEl, historyEl } = initUI();

// ---------- Search History (Bonus) ----------

const HISTORY_KEY = 'country-search-history';
const MAX_HISTORY = 5;

function getHistory(): string[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToHistory(query: string): void {
  const normalized = query.trim();
  if (!normalized) return;

  let history = getHistory();
  // Remove duplicates and add to the beginning
  history = history.filter((q) => q.toLowerCase() !== normalized.toLowerCase());
  history.unshift(normalized);

  // Keep only the last MAX_HISTORY items
  history = history.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore localStorage write errors (e.g., quota exceeded)
  }
  renderHistory();
}

function renderHistory(): void {
  historyEl.replaceChildren();
  const history = getHistory();
  if (history.length === 0) return;

  history.forEach((query) => {
    const chip = createElement('button', 'history-chip', { type: 'button' });
    chip.textContent = query;
    chip.addEventListener('click', () => {
      searchInput.value = query;
      controller.search(query);
    });
    historyEl.append(chip);
  });
}

// ---------- UI Updates ----------

function setLoading(loading: boolean): void {
  if (!loading) return;

  statusEl.replaceChildren();
  statusEl.className = 'status';

  const spinner = createElement('span', 'spinner', { 'aria-hidden': 'true' });
  const label = createElement('span');
  label.textContent = 'Searching…';
  statusEl.append(spinner, label);
}

function createCardNode(card: CountryCard): HTMLLIElement {
  const node = createElement('li', 'country-card');

  const img = createElement('img', 'country-card__flag', {
    alt: `Flag of ${card.name}`,
    loading: 'lazy',
    width: '48',
    height: '32',
  });
  img.src = card.flag;

  const body = createElement('div', 'country-card__body');
  const name = createElement('h2', 'country-card__name');
  name.textContent = card.name;

  const meta = createElement('p', 'country-card__meta');
  meta.textContent = [card.capital, card.region, card.population].filter(Boolean).join(' • ');

  body.append(name, meta);
  node.append(img, body);

  return node;
}

function renderResults(cards: CountryCard[]): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status';

  if (cards.length === 0) {
    const p = createElement('p');
    p.textContent = 'No countries found.';
    statusEl.append(p);
    return;
  }

  // Save to history ONLY if we got real results
  if (searchInput.value.trim()) {
    saveToHistory(searchInput.value);
  }

  const fragment = document.createDocumentFragment();
  for (const card of cards) {
    fragment.append(createCardNode(card));
  }
  resultsEl.append(fragment);
}

function renderError(error: unknown, retry: () => void): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status status--error';

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const p = createElement('p');
  p.textContent = `Something went wrong: ${errorMessage}`;

  const retryBtn = createElement('button', 'retry-btn', { type: 'button' });
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', retry, { once: true });

  statusEl.append(p, retryBtn);
}

// ---------- Controller Setup ----------

const controller = createSearchController({
  searchFn: searchCountries,
  onResults: renderResults,
  onError: (error) => {
    renderError(error, () => controller.search(searchInput.value));
  },
  onLoadingChange: setLoading,
  debounceMs: 300,
  timeoutMs: 10000,
});

// ---------- Event Listeners ----------

searchInput.addEventListener('input', (event) => {
  const query = (event.target as HTMLInputElement).value;
  controller.search(query);
});

window.addEventListener('pagehide', () => {
  controller.dispose();
});

// Initial render
renderHistory();
searchInput.focus();
