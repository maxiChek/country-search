import { createSearchController } from './searchController.js';
import { searchCountries } from './searchCountries.js';
import type { CountryCard } from './mapCountryResponse.js';

// ---------- DOM Elements ----------
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const statusEl = document.getElementById('search-status') as HTMLDivElement;
const resultsEl = document.getElementById('results') as HTMLUListElement;
const template = document.getElementById('country-card-template') as HTMLTemplateElement;

// ---------- UI Updates ----------

function setLoading(loading: boolean): void {
  if (!loading) return;

  statusEl.replaceChildren();
  statusEl.className = 'status';

  const spinner = document.createElement('span');
  spinner.className = 'spinner';
  spinner.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'Searching…';
  statusEl.append(spinner, label);
}

function renderResults(cards: CountryCard[]): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status';

  if (cards.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No countries found.';
    statusEl.append(p);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const card of cards) {
    const node = template.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const img = node.querySelector('.country-card__flag') as HTMLImageElement;
    const name = node.querySelector('.country-card__name') as HTMLHeadingElement;
    const meta = node.querySelector('.country-card__meta') as HTMLParagraphElement;

    img.src = card.flag;
    img.alt = `Flag of ${card.name}`;
    name.textContent = card.name;

    // Format the metadata (capital, region, etc.)
    meta.textContent = [card.capital, card.region].filter(Boolean).join(' • ');

    fragment.append(node);
  }

  resultsEl.append(fragment);
}

function renderError(error: unknown, retry: () => void): void {
  resultsEl.replaceChildren();
  statusEl.replaceChildren();
  statusEl.className = 'status status--error';

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const p = document.createElement('p');
  p.textContent = `Something went wrong: ${errorMessage}`;

  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'retry-btn';
  retryBtn.textContent = 'Retry';
  retryBtn.addEventListener('click', retry, { once: true });

  statusEl.append(p, retryBtn);
}

// ---------- Controller Setup ----------

const controller = createSearchController({
  searchFn: searchCountries,
  onResults: renderResults,
  onError: (error) => {
    // Pass the current input value to retry the exact same query
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

// Clean up on page unload
window.addEventListener('pagehide', () => {
  controller.dispose();
});

searchInput.focus();
