

/* ---------- Dados ---------- */
const POKEMON_NAMES = `
  bulbasaur, ivysaur, venusaur, charmander, charmeleon, charizard,
  squirtle, wartortle, blastoise, caterpie, metapod, butterfree,
  weedle, kakuna, beedrill, pidgey, pidgeotto, pidgeot,
  rattata, raticate, spearow, fearow, ekans, arbok,
  pikachu, raichu, sandshrew, sandslash, nidoran-f, nidorina,
  nidoqueen, nidoran-m, nidorino, nidoking, clefairy, clefable,
  vulpix, ninetales, jigglypuff, wigglytuff, zubat, golbat,
  oddish, gloom, vileplume, paras, parasect, venonat,
  venomoth, diglett, dugtrio, meowth, persian, psyduck,
  golduck, mankey, primeape, growlithe, arcanine, poliwag,
  poliwhirl, poliwrath, abra, kadabra, alakazam, machop,
  machoke, machamp, bellsprout, weepinbell, victreebel, tentacool, tentacruel,
  geodude, graveler, golem, ponyta, rapidash, slowpoke,
  slowbro, magnemite, magneton, farfetchd, doduo, dodrio,
  seel, dewgong, grimer, muk, shellder, cloyster,
  gastly, haunter, gengar, onix, drowzee, hypno,
  krabby, kingler, voltorb, electrode, exeggcute, exeggutor,
  cubone, marowak, hitmonlee, hitmonchan, lickitung, koffing,
  weezing, rhyhorn, rhydon, chansey, tangela, kangaskhan,
  horsea, seadra, goldeen, seaking, staryu, starmie,
  mr-mime, scyther, jynx, electabuzz, magmar, pinsir,
  tauros, magikarp, gyarados, lapras, ditto, eevee,
  vaporeon, jolteon, flareon, porygon, omanyte, omastar,
  kabuto, kabutops, aerodactyl, snorlax, articuno, zapdos,
  moltres, dratini, dragonair, dragonite, mewtwo, mew
`
  .trim()
  .split(/\s*,\s*/);

const TYPES = {
  normal: "NORMAL",
  fire: "FIRE",
  water: "WATER",
  grass: "GRASS",
  electric: "ELECTRIC",
  ice: "ICE",
  fighting: "FIGHTING",
  poison: "POISON",
  ground: "GROUND",
  flying: "FLYING",
  psychic: "PSYCHIC",
  bug: "BUG",
  rock: "ROCK",
  ghost: "GHOST",
  dragon: "DRAGON",
  dark: "DARK",
  steel: "STEEL",
  fairy: "FAIRY",
};

// Nomes que não saem certos só trocando "-" por espaço
const DISPLAY_NAMES = {
  "nidoran-f": "Nidoran♀",
  "nidoran-m": "Nidoran♂",
  "mr-mime": "Mr. Mime",
  farfetchd: "Farfetch'd",
};

const SPRITES_URL =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const API_URL = "https://pokeapi.co/api/v2";

/* ---------- Elementos da página ---------- */
const ELEMENT_IDS = {
  boot: "boot",
  bar: "barfill",
  pct: "percent",
  status: "bootstatus",
  log: "bootlog",
  app: "app",
  list: "list",
  filters: "filters",
  search: "search",
  clear: "clear",
  random: "random",
  num: "num",
  message: "message",
  img: "artimg",
  name: "name",
  types: "types",
  flavor: "flavor",
  height: "height",
  weight: "weight",
  species: "species",
  power: "power",
  content: "content",
  index: "index",
  prev: "prev",
  next: "next",
  fav: "fav",
  toast: "toast",
};

const els = Object.fromEntries(
  Object.entries(ELEMENT_IDS).map(([key, id]) => [key, document.getElementById(id)])
);

/* ---------- Estado ---------- */
const state = {
  selected: 1,
  filter: "all",
  tab: "info",
  cache: new Map(),
  favorites: new Set(JSON.parse(localStorage.getItem("dexfav") || "[]")),
};

/* ---------- Utilitários ---------- */
const pad = (n) => String(n).padStart(3, "0");

const capitalize = (text) =>
  text.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const displayName = (name) => DISPLAY_NAMES[name] || capitalize(name);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pokemonList = POKEMON_NAMES.map((name, i) => ({ id: i + 1, name }));

const defaultDescriptions = Object.fromEntries(
  pokemonList.map((p) => [
    p.id,
    `${displayName(p.name)} is a Pokémon from the Kanto region. ` +
      "Check its entry to learn about its traits, abilities and behavior.",
  ])
);

function findByLanguage(entries, language) {
  return entries?.find((entry) => entry.language.name === language);
}

function showToast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 1800);
}

/* ---------- Tela de inicialização ---------- */
async function boot() {
  const steps = [
    "CARREGANDO 151 REGISTROS KANTO...",
    "CALIBRANDO TELA ESQUERDA...",
    "CALIBRANDO TELA DIREITA...",
    "SISTEMA PRONTO",
  ];

  for (let i = 0; i < steps.length; i++) {
    const percent = ((i + 1) * 100) / steps.length;

    els.status.textContent = steps[i];
    els.bar.style.width = `${percent}%`;
    els.pct.textContent = `${percent}%`;
    els.log.textContent += `> ${steps[i]} ✓\n`;

    await wait(180);
  }

  els.boot.classList.add("hide");

  setTimeout(() => {
    els.boot.remove();
    els.app.classList.remove("hidden");
    renderFilters();
    renderList();
    select(1);
  }, 420);
}

/* ---------- Filtros e lista ---------- */
function renderFilters() {
  els.filters.innerHTML =
    '<button class="active" data-t="all">TODOS</button>' +
    Object.keys(TYPES)
      .map((type) => `<button data-t="${type}">${TYPES[type]}</button>`)
      .join("");

  const buttons = els.filters.querySelectorAll("button");

  buttons.forEach((button) => {
    button.onclick = () => {
      state.filter = button.dataset.t;
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      renderList();
    };
  });
}

function renderList() {
  const query = els.search.value.trim().toLowerCase();

  let results = pokemonList.filter(
    (p) =>
      !query ||
      p.name.includes(query) ||
      displayName(p.name).toLowerCase().includes(query) ||
      p.id === Number(query)
  );

  if (state.filter !== "all") {
    results = results.filter((p) => fallback(p.id).types.includes(state.filter));
  }

  els.list.innerHTML =
    results
      .map(
        (p) => `
          <button class="row ${p.id === state.selected ? "active" : ""}" data-id="${p.id}">
            <img src="${SPRITES_URL}/${p.id}.png" alt="" />
            <span>
              <small>#${pad(p.id)}</small>
              <b>${displayName(p.name)}</b>
            </span>
            <i></i>
          </button>`
      )
      .join("") || '<div class="empty">NENHUM REGISTRO</div>';

  els.list.querySelectorAll(".row").forEach((row) => {
    row.onclick = () => select(Number(row.dataset.id));
  });
}

/* ---------- Dados locais (quando a API não responde) ---------- */
function fallback(id) {
  const knownTypes = {
    1: ["grass", "poison"],
    2: ["grass", "poison"],
    3: ["grass", "poison"],
    4: ["fire"],
    5: ["fire"],
    6: ["fire", "flying"],
    7: ["water"],
    8: ["water"],
    9: ["water"],
    25: ["electric"],
    26: ["electric"],
    94: ["ghost", "poison"],
    131: ["water", "ice"],
    143: ["normal"],
    144: ["ice", "flying"],
    145: ["electric", "flying"],
    146: ["fire", "flying"],
    149: ["dragon", "flying"],
    150: ["psychic"],
    151: ["psychic"],
  };

  return {
    types: knownTypes[id] || ["normal"],
    height: "—",
    weight: "—",
    species: "Pokémon",
    power: "—",
    flavor: "Kanto Pokédex entry.",
  };
}

function fallbackDetails(id) {
  const local = fallback(id);
  const { name } = pokemonList[id - 1];

  return {
    id,
    name,
    types: local.types.map((typeName) => ({ type: { name: typeName } })),
    height: 0,
    weight: 0,
    stats: [],
    abilities: [],
    moves: [],
    speciesData: {
      capture_rate: "—",
      genera: [
        { language: { name: "en" }, genus: `${local.species} Pokémon` },
      ],
      flavor_text_entries: [
        {
          language: { name: "en" },
          flavor_text: defaultDescriptions[id] || local.flavor,
        },
      ],
    },
  };
}

/* ---------- PokéAPI ---------- */
async function apiDetails(id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${API_URL}/pokemon/${id}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Falha ao buscar o Pokémon");

    const pokemon = await response.json();

    const speciesResponse = await fetch(`${API_URL}/pokemon-species/${id}`, {
      signal: controller.signal,
    });

    pokemon.speciesData = speciesResponse.ok
      ? await speciesResponse.json()
      : fallbackDetails(id).speciesData;

    return pokemon;
  } finally {
    clearTimeout(timer);
  }
}

async function select(id) {
  state.selected = Math.max(1, Math.min(151, id));
  renderList();

  // Mostra os dados locais na hora e atualiza quando a API responder
  render(fallbackDetails(state.selected));
  els.message.textContent = "CARREGANDO DADOS...";

  try {
    const full = await apiDetails(state.selected);
    state.cache.set(state.selected, full);

    if (state.selected === id) render(full);
    els.message.textContent = "POKÉMON IDENTIFICADO";
  } catch {
    els.message.textContent = "MODO LOCAL · DADOS BÁSICOS";
    showToast("PokéAPI indisponível — usando dados locais.");
  }
}

/* ---------- Renderização do Pokémon ---------- */
function render(p) {
  const isFavorite = state.favorites.has(p.id);

  els.num.textContent = `#${pad(p.id)}`;
  els.index.textContent = pad(p.id);
  els.name.textContent = displayName(p.name).toUpperCase();

  // Imagem oficial; se falhar, usa o sprite simples (uma única tentativa)
  els.img.onerror = () => {
    els.img.onerror = null;
    els.img.src = `${SPRITES_URL}/${p.id}.png`;
  };
  els.img.src = `${SPRITES_URL}/other/official-artwork/${p.id}.png`;

  els.types.innerHTML = p.types
    .map((t) => {
      const label = (TYPES[t.type.name] || t.type.name).toUpperCase();
      return `<span class="type ${t.type.name}">${label}</span>`;
    })
    .join("");

  const flavor = findByLanguage(p.speciesData.flavor_text_entries, "en");

  els.flavor.textContent = (
    flavor?.flavor_text ||
    defaultDescriptions[p.id] ||
    "Kanto Pokédex entry."
  ).replace(/[\f\n]+/g, " ");

  els.height.textContent = p.height ? `${(p.height / 10).toFixed(1)} m` : "—";
  els.weight.textContent = p.weight ? `${(p.weight / 10).toFixed(1)} kg` : "—";

  const genus = findByLanguage(p.speciesData.genera, "en");

  els.species.textContent = genus?.genus?.replace(" Pokémon", "") || "Pokémon";

  els.power.textContent = p.stats?.length
    ? Math.round(p.stats.reduce((sum, s) => sum + s.base_stat, 0) / 6)
    : "—";

  els.fav.textContent = isFavorite ? "♥" : "♡";
  els.fav.classList.toggle("on", isFavorite);

  renderTab(p);
}

/* ---------- Abas ---------- */
const UNAVAILABLE = "Dados detalhados indisponíveis";

const card = (label, value) =>
  `<div><small>${label}</small><b>${value}</b></div>`;

function renderTab(p) {
  let html;

  switch (state.tab) {
    case "info":
      html = `
        <div class="cards">
          ${card("NÚMERO", `#${pad(p.id)}`)}
          ${card("CATEGORIA", els.species.textContent)}
          ${card("CAPTURA", p.speciesData.capture_rate || "—")}
          ${card("ALTURA", els.height.textContent)}
          ${card("PESO", els.weight.textContent)}
          ${card("TIPOS", p.types.map((x) => TYPES[x.type.name] || x.type.name).join(" / "))}
        </div>`;
      break;

    case "abilities":
      html = `
        <div class="cards">
          ${
            p.abilities?.length
              ? p.abilities
                  .map((a) =>
                    card(
                      "HABILIDADE",
                      capitalize(a.ability.name) + (a.is_hidden ? " · OCULTA" : "")
                    )
                  )
                  .join("")
              : card("STATUS", UNAVAILABLE)
          }
        </div>`;
      break;

    case "stats":
      html = `
        <div class="stats">
          ${
            p.stats?.length
              ? p.stats
                  .map(
                    (s) => `
                      <div>
                        <span>${s.stat.name}</span>
                        <i><em style="width:${Math.min(100, s.base_stat / 2.55)}%"></em></i>
                        <b>${s.base_stat}</b>
                      </div>`
                  )
                  .join("")
              : `<div>${UNAVAILABLE}</div>`
          }
        </div>`;
      break;

    default: // moves
      html = `
        <div class="cards">
          ${
            p.moves?.length
              ? p.moves
                  .slice(0, 8)
                  .map((m) => card("MOVIMENTO", capitalize(m.move.name)))
                  .join("")
              : card("STATUS", UNAVAILABLE)
          }
        </div>`;
  }

  els.content.innerHTML = html;
}

/* ---------- Eventos ---------- */
const currentPokemon = () =>
  state.cache.get(state.selected) || fallbackDetails(state.selected);

els.search.oninput = renderList;

els.clear.onclick = () => {
  els.search.value = "";
  renderList();
};

els.random.onclick = () => select(Math.floor(Math.random() * 151) + 1);
els.prev.onclick = () => select(state.selected - 1);
els.next.onclick = () => select(state.selected + 1);

els.fav.onclick = () => {
  if (state.favorites.has(state.selected)) {
    state.favorites.delete(state.selected);
  } else {
    state.favorites.add(state.selected);
  }

  localStorage.setItem("dexfav", JSON.stringify([...state.favorites]));
  render(currentPokemon());
};

// Abas (INFO, HABILIDADES, STATUS, MOVIMENTOS)
const tabButtons = document.querySelectorAll(".tabs button");

tabButtons.forEach((button) => {
  button.onclick = () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    state.tab = button.dataset.tab;
    renderTab(currentPokemon());
  };
});

// Navegação pelo teclado
document.addEventListener("keydown", (event) => {
  if (event.target === els.search) return; // não navega enquanto digita na busca
  if (event.key === "ArrowLeft") select(state.selected - 1);
  if (event.key === "ArrowRight") select(state.selected + 1);
});

boot();
