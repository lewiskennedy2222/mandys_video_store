/* ===========================
   MANDY’S VIDEO STORE SCRIPT
   CodeSandbox friendly with TMDb proxy
   =========================== */

/* --- Proxy for CodeSandbox --- */
const PROXY = "https://cors-anywhere.herokuapp.com/";
const TMDB_BASE = PROXY + "https://api.themoviedb.org/3";
const TMDB_V4_BEARER =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMDc3OWI2MWZlMzQwOTVlZTAzZTc3ZjBmODg1YTQzNyIsIm5iZiI6MTc1ODg5OTk2Mi4wMzYsInN1YiI6IjY4ZDZhZWZhY2Y4ZmU5MTE1ODA5NWZlNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.M1LRr7Ob6VDSeChUWNdit_41GEhBJRCngzGGAkzxawQ";
const IMG_500 = "https://image.tmdb.org/t/p/w500";

/* ====== DATA ====== */
const GENRES = [
  "Horror",
  "Drama",
  "Comedy",
  "Thriller",
  "Superhero",
  "Science Fiction",
  "Western",
  "Fantasy",
  "Action",
  "Rom com",
  "Musical",
  "Children's animation",
  "Teen movies",
  "Mystery",
];
const GENRE_MAP = {
  Horror: 27,
  Drama: 18,
  Comedy: 35,
  Thriller: 53,
  "Science Fiction": 878,
  Western: 37,
  Fantasy: 14,
  Action: 28,
  "Rom com": 10749,
  Musical: 10402,
  "Children's animation": 16,
  "Teen movies": 35,
  Mystery: 9648,
};
const SUPERHERO_KEYWORD_ID = 9715;
const TEEN_KEYWORDS = "3106,2343";
const DECADES_WEIGHTED = [
  "1960s",
  "1960s",
  "1960s",
  "1970s",
  "1970s",
  "1970s",
  "1980s",
  "1980s",
  "1980s",
  "1990s",
  "1990s",
  "1990s",
  "2000s",
  "2000s",
  "2000s",
  "2010s",
  "2010s",
  "2010s",
  "2020s",
  "2020s",
  "1950s",
  "1940s",
];
const FILM_SCROLL = [
  "Psycho",
  "Moonlight",
  "Rear Window",
  "The Dark Knight",
  "Fury Road",
  "The Matrix",
  "Alien",
  "Die Hard",
  "Toy Story",
  "Spirited Away",
  "The Godfather",
  "The Exorcist",
  "La La Land",
  "Heat",
  "Oldboy",
  "Blade Runner",
];

/* ===== Helpers ===== */
function decadeRange(dec) {
  const s = parseInt(dec.slice(0, 4), 10);
  return { start: s, end: s + 9 };
}
function yearOK(y) {
  if (!y) return false;
  const yy = parseInt(y, 10);
  return yy >= 1940 && yy <= 2024;
}
function inDecade(y, dec) {
  const r = decadeRange(dec);
  const yy = parseInt(y, 10);
  return yy >= r.start && yy <= r.end;
}
function setPoster(el, bg) {
  el.style.backgroundImage = bg;
}
function posterBG(title) {
  const safe = (title || "No Poster").replace(/&/g, "&amp;");
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'><rect width='100%' height='100%' fill='#101010'/><text x='50%' y='50%' font-size='28' font-family='Arial' fill='#eee' text-anchor='middle' dominant-baseline='middle'>${safe}</text></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}
function hasGenre(m, gid) {
  return Array.isArray(m.genre_ids) && m.genre_ids.includes(gid);
}

/* ===== Robots ===== */
const ROBOT_QUOTES = {
  Mandy: [
    "You left your trousers at mine last night. You should come and collect them.",
    "When are you going to take me to the movies?",
    "You smell like popcorn again. I like it.",
    "I alphabetised your name under 'trouble'.",
    "Bring snacks next time, sweetheart.",
    "My heart skips a beat whenever you rewind properly.",
    "Careful, I might start charging you double for being cute.",
    "If you scratch that DVD, you are buying me dinner.",
    "You should come over, I have a projector and bad ideas.",
    "Stop making me blush, this is not a romcom.",
  ],
  PP: [
    "Restocked the rom com aisle again. It is getting heavy.",
    "Someone put Die Hard in the Christmas section again.",
  ],
  Charkins: [
    "Clocked in, clocked out, still here somehow.",
    "If the VHS rewinder breaks again, I am leaving.",
  ],
  LPK: [
    "I polished the discs till I could see my reflection.",
    "Customer of the week? You, obviously.",
  ],
  "Marcus TX 17 Aspirin": [
    "Inventory scan complete. Everything is dusty.",
    "Popcorn aroma detected. Emotion chip warming.",
  ],
  Kipper: [
    "Sorry, I dropped the biscuits again.",
    "Do we still rent Finding Nemo or is that weird?",
  ],
  Fisher: [
    "I reeled in a rare copy of Jaws earlier.",
    "Mandy says I talk too much about fish.",
  ],
  Adam: [
    "Corporate sent a new memo. I did not read it.",
    "Remember to rewind before Mandy catches you.",
  ],
  "Graham Sanders": [
    "Coffee break number seven. Do not tell Mandy.",
    "I have been here since 89. Still cannot work the till.",
  ],
  Finley: [
    "Just editing my short film behind the counter.",
    "Do you think this counts as film school credit?",
  ],
  JLB99: [
    "I hear the tapes whisper after closing time.",
    "The neon flickers when a good movie is near.",
  ],
};

const employeeName = document.getElementById("employeeName");
const employeeQuote = document.getElementById("employeeQuote");
const robotSelect = document.getElementById("robot");
function randOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)] || "";
}
function applyClerk(name) {
  employeeName.textContent = name;
  const lines = ROBOT_QUOTES[name] || [];
  employeeQuote.textContent = lines.length ? `"${randOf(lines)}"` : "";
}
applyClerk("Mandy");
robotSelect.addEventListener("change", (e) => applyClerk(e.target.value));

/* ===== TMDb fetch ===== */
async function tmdb(url, paramsObj) {
  const u = new URL(url);
  if (paramsObj) {
    for (const k in paramsObj) {
      if (Object.prototype.hasOwnProperty.call(paramsObj, k))
        u.searchParams.set(k, paramsObj[k]);
    }
  }
  const res = await fetch(u.toString(), {
    headers: { Authorization: "Bearer " + TMDB_V4_BEARER },
  });
  if (!res.ok) throw new Error("TMDb error " + res.status);
  return res.json();
}

/* ===== Decade rules ===== */
function validDecadesForGenre(genre) {
  if (genre === "Superhero")
    return ["1980s", "1990s", "2000s", "2010s", "2020s"];
  if (genre === "Rom com") return ["1980s", "1990s", "2000s", "2010s", "2020s"];
  if (genre === "Teen movies") return ["1990s", "2000s", "2010s", "2020s"];
  if (genre === "Science Fiction")
    return ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  if (genre === "Musical")
    return ["1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"];
  if (genre === "Action")
    return [
      "1950s",
      "1960s",
      "1970s",
      "1980s",
      "1990s",
      "2000s",
      "2010s",
      "2020s",
    ];
  return [
    "1940s",
    "1950s",
    "1960s",
    "1970s",
    "1980s",
    "1990s",
    "2000s",
    "2010s",
    "2020s",
  ];
}

/* ===== Validation per genre ===== */
function validateMovieForGenre(m, genre) {
  const y = m && m.release_date ? m.release_date.slice(0, 4) : null;
  if (!yearOK(y)) return false;
  if (genre === "Rom com") return hasGenre(m, 35) && hasGenre(m, 10749);
  if (genre === "Superhero")
    return (
      hasGenre(m, 28) || hasGenre(m, 878) || hasGenre(m, 14) || hasGenre(m, 12)
    );
  if (genre === "Teen movies") return hasGenre(m, 35) || hasGenre(m, 18);
  if (genre === "Science Fiction") return hasGenre(m, 878);
  if (genre === "Musical") return hasGenre(m, 10402);
  if (genre === "Action") return hasGenre(m, 28);
  if (genre === "Western") return hasGenre(m, 37);
  if (genre === "Fantasy") return hasGenre(m, 14);
  if (genre === "Thriller") return hasGenre(m, 53);
  if (genre === "Mystery") return hasGenre(m, 9648);
  if (genre === "Children's animation") return hasGenre(m, 16);
  if (genre === "Drama") return hasGenre(m, 18);
  if (genre === "Comedy") return hasGenre(m, 35);
  if (genre === "Horror") return hasGenre(m, 27);
  return true;
}

/* ===== Discover with rules ===== */
async function fetchMoviesBySpec(chosenGenre, chosenDecade) {
  const r = decadeRange(chosenDecade);
  const start = Math.max(r.start, 1940);
  const end = Math.min(r.end, 2024);

  const base = {
    language: "en-US",
    include_adult: "false",
    with_original_language: "en",
    "with_runtime.gte": "60",
    "primary_release_date.gte": start + "-01-01",
    "primary_release_date.lte": end + "-12-31",
    "vote_count.gte": "500",
    sort_by: "popularity.desc",
  };
  function discover(extra) {
    const p = { ...base, ...extra };
    return tmdb(TMDB_BASE + "/discover/movie", p);
  }

  const pages = [1, 2, 3];
  let pools = [];

  if (chosenGenre === "Superhero") {
    for (let p of pages) {
      const d = await discover({
        page: String(p),
        with_keywords: String(SUPERHERO_KEYWORD_ID),
      });
      pools = pools.concat(d.results || []);
    }
  } else if (chosenGenre === "Teen movies") {
    for (let p of pages) {
      const d = await discover({
        page: String(p),
        with_keywords: TEEN_KEYWORDS,
        with_genres: GENRE_MAP["Comedy"] + "," + GENRE_MAP["Drama"],
      });
      pools = pools.concat(d.results || []);
    }
  } else if (chosenGenre === "Rom com") {
    for (let p of pages) {
      const d = await discover({
        page: String(p),
        with_genres: GENRE_MAP["Comedy"] + "," + GENRE_MAP["Rom com"],
      });
      pools = pools.concat(d.results || []);
    }
  } else if (chosenGenre === "Action") {
    for (let p of pages) {
      const d = await discover({
        page: String(p),
        with_genres: GENRE_MAP["Action"] + "," + GENRE_MAP["Adventure"],
      });
      pools = pools.concat(d.results || []);
    }
  } else {
    for (let p of pages) {
      const d = await discover({
        page: String(p),
        with_genres: String(GENRE_MAP[chosenGenre] || ""),
      });
      pools = pools.concat(d.results || []);
    }
  }

  const filtered = pools.filter((m) => {
    const y = m && m.release_date ? m.release_date.slice(0, 4) : null;
    return (
      yearOK(y) &&
      inDecade(y, chosenDecade) &&
      validateMovieForGenre(m, chosenGenre)
    );
  });
  return filtered;
}

async function pickMultipleFilms(chosenGenre, chosenDecade, n) {
  const pool = await fetchMoviesBySpec(chosenGenre, chosenDecade);
  if (!pool || pool.length === 0) return [];
  const chosen = [];
  const used = new Set();
  let tries = 0;
  while (chosen.length < n && tries < 900) {
    tries++;
    const m = pool[Math.floor(Math.random() * pool.length)];
    if (!m || used.has(m.id)) continue;
    used.add(m.id);
    const title = m.title || m.name || "Untitled";
    const year = m.release_date ? m.release_date.slice(0, 4) : "Unknown";
    const rating =
      typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "N/A";
    const poster = m.poster_path ? IMG_500 + m.poster_path : null;
    chosen.push({
      id: m.id,
      title,
      year,
      rating: parseFloat(rating),
      posterCSS: poster ? `url(${poster})` : posterBG(title),
    });
  }
  return chosen;
}

async function fetchMovieDetails(id) {
  const data = await tmdb(TMDB_BASE + "/movie/" + id, {
    language: "en-US",
    append_to_response: "credits",
  });
  let director = "";
  if (data.credits && data.credits.crew) {
    const d = data.credits.crew.find((p) => p.job === "Director");
    director = d && d.name ? d.name : "";
  }
  const tagline = (data.tagline || "").trim();
  let country = "";
  if (
    Array.isArray(data.production_countries) &&
    data.production_countries.length
  ) {
    country = data.production_countries[0].name || "";
  }
  return { tagline, director, country };
}

/* ===== Reel class for UI ===== */
class Reel {
  constructor(list, outerEl, cellsEl, speed = 34) {
    this.list = list;
    this.outerEl = outerEl;
    this.cellsEl = cellsEl;
    this.spinning = false;
    this.offset = 0;
    this.cellH = 56;
    this.speed = speed;
    this._raf = null;
    this._stopTimeout = null;
  }
  build() {
    const seq = this.list.concat(this.list, this.list);
    this.cellsEl.innerHTML = "";
    for (let i = 0; i < seq.length; i++) {
      const d = document.createElement("div");
      d.className = "cell";
      d.textContent = seq[i];
      this.cellsEl.appendChild(d);
    }
    this.offset = 0;
    this.cellsEl.style.transform = "translateY(0px)";
    this.outerEl.classList.remove("stopped");
  }
  start() {
    if (this.spinning) return;
    this.build();
    this.spinning = true;
    const step = () => {
      this.offset -= this.speed;
      if (-this.offset >= this.cellH) {
        this.cellsEl.appendChild(this.cellsEl.firstElementChild);
        this.offset += this.cellH;
      }
      this.cellsEl.style.transform =
        "translateY(" + Math.round(this.offset) + "px)";
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
    this._stopTimeout = setTimeout(() => this.stop(), 30000);
  }
  stop() {
    if (!this.spinning) return null;
    this.spinning = false;
    cancelAnimationFrame(this._raf);
    clearTimeout(this._stopTimeout);
    const val = this.list[Math.floor(Math.random() * this.list.length)];
    this.cellsEl.innerHTML = "";
    const d = document.createElement("div");
    d.className = "cell";
    d.textContent = val;
    this.cellsEl.appendChild(d);
    this.cellsEl.style.transform = "translateY(0px)";
    this.outerEl.classList.add("stopped");
    return val;
  }
}

/* ===== DOM ===== */
const btnGenre = document.getElementById("btnGenre");
const btnDecade = document.getElementById("btnDecade");
const btnFilm = document.getElementById("btnFilm");
const genreOuter = document.getElementById("genreReel");
const decadeOuter = document.getElementById("decadeReel");
const filmOuter = document.getElementById("filmReel");
const genreCells = document.getElementById("genreCells");
const decadeCells = document.getElementById("decadeCells");
const filmCells = document.getElementById("filmCells");

const previewArea = document.getElementById("previewArea");
const filmPoster = document.getElementById("filmPoster");
const filmTitle = document.getElementById("filmTitle");
const filmMeta = document.getElementById("filmMeta");

const candidatesPanel = document.getElementById("candidatesPanel");
const candidatesEl = document.getElementById("candidates");
const candToggle = document.getElementById("candToggle");
const candidateMessage = document.getElementById("candidateMessage");

const lineupEl = document.getElementById("lineup");
const lineupInfo = document.getElementById("lineupInfo");
const shuffleCaption = document.getElementById("shuffleCaption");
const rentalMessage = document.getElementById("rentalMessage");
const returnWrap = document.getElementById("returnWrap");
const returnBtn = document.getElementById("returnBtn");

/* ===== Reels init ===== */
const SPIN_SPEED = 36;
const genreReel = new Reel(GENRES, genreOuter, genreCells, SPIN_SPEED);
const decadeReel = new Reel(
  DECADES_WEIGHTED,
  decadeOuter,
  decadeCells,
  SPIN_SPEED + 2
);
const filmReel = new Reel(FILM_SCROLL, filmOuter, filmCells, SPIN_SPEED + 2);
genreReel.build();
decadeReel.build();
filmReel.build();

let chosenGenre = null,
  chosenDecade = null;
let lineupFilms = [];
let shuffledFilms = [];
let candidateFilms = [];
let candidateSpinning = false;
let candidateSpinTimer = null;
let candidateHighlightIndex = 0;
let fetching = false;
let holdingInRoulette = false;

/* ===== Buttons: Genre / Decade ===== */
btnGenre.addEventListener("click", () => {
  if (holdingInRoulette || fetching || candidateSpinning) return;
  if (!genreReel.spinning) {
    btnGenre.textContent = "Stop Genre";
    genreReel.start();
  } else {
    chosenGenre = genreReel.stop();
    btnGenre.disabled = true;
    btnDecade.disabled = false;
    btnGenre.textContent = "Spin Genre";
  }
});

btnDecade.addEventListener("click", () => {
  if (holdingInRoulette || fetching || candidateSpinning) return;
  if (!chosenGenre) return;
  if (!decadeReel.spinning) {
    const allowed = validDecadesForGenre(chosenGenre);
    const weighted = DECADES_WEIGHTED.filter((d) => allowed.includes(d));
    decadeReel.list = weighted.length ? weighted : allowed;
    decadeReel.build();
    btnDecade.textContent = "Stop Decade";
    decadeReel.start();
  } else {
    chosenDecade = decadeReel.stop();
    btnDecade.disabled = true;
    btnFilm.disabled = false;
    btnDecade.textContent = "Spin Decade";
  }
});

/* ===== Film button: spin, stop, fetch candidates ===== */
btnFilm.addEventListener("click", async () => {
  if (holdingInRoulette || fetching) return;
  if (!chosenGenre || !chosenDecade) return;

  if (!filmReel.spinning) {
    filmOuter.style.display = "block";
    btnFilm.textContent = "Stop";
    filmReel.start();
  } else {
    filmReel.stop();
    filmOuter.style.display = "none"; // hide placeholders
    btnFilm.textContent = "Generate";
    btnFilm.disabled = true;
    fetching = true;
    try {
      const four = await pickMultipleFilms(chosenGenre, chosenDecade, 4);
      if (!four || four.length < 1) {
        alert("No movies found. Try a new spin.");
        btnFilm.disabled = false;
        fetching = false;
        return;
      }
      candidateFilms = four;
      drawCandidates(four);
      candidatesPanel.style.display = "block";
      candToggle.disabled = false;
      candToggle.textContent = "Generate";
      const round = lineupFilms.length + 1;
      candidateMessage.textContent =
        round === 1
          ? "Please now generate your first film."
          : round === 2
          ? "Please now generate your second film."
          : "Please now generate your final film.";
    } catch (e) {
      console.error(e);
      alert(
        "Could not fetch from TMDb in this sandbox. If this keeps happening, deploy to GitHub Pages or use the proxy activation link for cors-anywhere before testing."
      );
      btnFilm.disabled = false;
    } finally {
      fetching = false;
    }
  }
});

/* ===== Candidates spin highlight ===== */
function drawCandidates(four) {
  candidatesEl.innerHTML = "";
  four.forEach((f) => {
    const c = document.createElement("div");
    c.className = "candidate";
    const p = document.createElement("div");
    p.className = "cand-poster";
    p.style.backgroundImage = f.posterCSS;
    const t = document.createElement("div");
    t.className = "cand-title";
    t.textContent = f.title;
    c.appendChild(p);
    c.appendChild(t);
    candidatesEl.appendChild(c);
  });
  candidateHighlightIndex = 0;
  updateCandidateHighlight();
}
function updateCandidateHighlight() {
  const items = candidatesEl.querySelectorAll(".candidate");
  items.forEach((el, idx) => {
    el.classList.toggle("highlight", idx === candidateHighlightIndex);
  });
}
function startCandidateSpin() {
  if (candidateSpinning) return;
  candidateSpinning = true;
  candidateSpinTimer = setInterval(() => {
    const count = candidatesEl.children.length || 1;
    candidateHighlightIndex = (candidateHighlightIndex + 1) % count;
    updateCandidateHighlight();
  }, 90);
}
function stopCandidateSpin() {
  candidateSpinning = false;
  if (candidateSpinTimer) clearInterval(candidateSpinTimer);
  candidateSpinTimer = null;
}

candToggle.addEventListener("click", () => {
  if (!candidateFilms || !candidateFilms.length) return;
  if (!candidateSpinning) {
    startCandidateSpin();
    candToggle.textContent = "Stop";
  } else {
    stopCandidateSpin();
    candToggle.textContent = "Generate";
    candToggle.disabled = true;
    const picked = candidateFilms[candidateHighlightIndex];
    pickCandidate(picked);
  }
});

/* ===== Pick selected candidate -> preview 3s -> lineup ===== */
function pickCandidate(film) {
  previewArea.style.display = "flex";
  filmTitle.textContent = film.title;
  filmMeta.textContent = `${film.year} • ${Number(film.rating).toFixed(1)}/10`;
  setPoster(filmPoster, film.posterCSS);

  holdingInRoulette = true;
  setTimeout(() => {
    placeFilmIntoLineup({
      id: film.id,
      title: film.title,
      year: film.year,
      rating: film.rating,
      poster: film.posterCSS,
    });

    // Reset above for next round if lineup not full
    if (lineupFilms.length < 3) {
      chosenGenre = null;
      chosenDecade = null;
      genreReel.build();
      decadeReel.build();
      filmReel.build();
      filmOuter.style.display = "block";
      btnGenre.disabled = false;
      btnDecade.disabled = true;
      btnFilm.disabled = true;

      previewArea.style.display = "none";
      filmPoster.style.backgroundImage = "";
      filmTitle.textContent = "";
      filmMeta.textContent = "";
    }

    candidatesPanel.style.display = "none";
    candidatesEl.innerHTML = "";
    holdingInRoulette = false;
  }, 3000);
}

/* ===== Lineup and ABC ===== */
function placeFilmIntoLineup(f) {
  if (lineupFilms.length >= 3) return;
  const idx = lineupFilms.length;
  const slot = lineupEl.querySelector(`.slot[data-slot="${idx}"]`);
  lineupFilms.push(f);
  slot.querySelector(".head span:last-child").textContent = "Ready";
  const p = slot.querySelector(".poster");
  p.classList.remove("blank");
  setPoster(p, f.poster);
  slot.querySelector(".title").textContent = f.title;
  lineupInfo.textContent = `Filled ${lineupFilms.length} of 3`;
  if (lineupFilms.length === 3) prepareABC();
}

function prepareABC() {
  shuffledFilms = [].concat(lineupFilms).sort(() => Math.random() - 0.5);
  shuffleCaption.style.display = "block";
  shuffleCaption.textContent =
    "The films have been randomly re-ordered, please select A, B or C.";

  const labels = ["A", "B", "C"];
  for (let i = 0; i < 3; i++) {
    const slot = lineupEl.querySelector(`.slot[data-slot="${i}"]`);
    const head = slot.querySelector(".head");
    head.querySelector(".label").textContent = labels[i];
    head.querySelector("span:last-child").textContent = "Shuffled";

    const poster = slot.querySelector(".poster");
    poster.classList.add("bigChoice");
    poster.style.backgroundImage = "";
    poster.innerHTML = `<span>${labels[i]}</span>`;
    const letter = labels[i];
    poster.onclick = function () {
      handleChoice(letter);
    };
    slot.querySelector(".title").textContent = "";
    slot.querySelector(".tagline").textContent = "";
    slot.querySelector(".byline").textContent = "";
  }

  btnGenre.disabled = true;
  btnDecade.disabled = true;
  btnFilm.disabled = true;
}

async function handleChoice(letter) {
  // Unbind clicks and clear letters
  for (let j = 0; j < 3; j++) {
    const slot = lineupEl.querySelector(`.slot[data-slot="${j}"]`);
    const poster = slot.querySelector(".poster");
    poster.onclick = null;
    poster.classList.remove("bigChoice");
    poster.innerHTML = "";
  }

  const idx = { A: 0, B: 1, C: 2 }[letter];
  const winner = shuffledFilms[idx];
  const winSlot = lineupEl.querySelector(`.slot[data-slot="${idx}"]`);
  setPoster(winSlot.querySelector(".poster"), winner.poster);
  winSlot.querySelector(".title").textContent = `${winner.title} - ${
    winner.year
  } • ${winner.rating.toFixed(1)}/10`;

  try {
    const details = await fetchMovieDetails(winner.id);
    if (details.tagline)
      winSlot.querySelector(".tagline").textContent = `“${details.tagline}”`;
    const by = details.director
      ? `Directed by ${details.director}`
      : details.country
      ? `Produced in ${details.country}`
      : "";
    winSlot.querySelector(".byline").textContent = by;
  } catch (e) {}

  rentalMessage.textContent = `You have chosen to rent ${winner.title} - you have 1 week to watch and return to Mandy’s Video Store. Late fees apply.`;
  rentalMessage.style.display = "block";
  returnWrap.style.display = "flex";

  // Reveal the missed after 5s
  setTimeout(async () => {
    for (let i = 0; i < 3; i++) {
      if (i === idx) continue;
      const f = shuffledFilms[i];
      const slot = lineupEl.querySelector(`.slot[data-slot="${i}"]`);
      setPoster(slot.querySelector(".poster"), f.poster);
      slot.querySelector(".title").textContent = `${f.title} - ${
        f.year
      } • ${f.rating.toFixed(1)}/10`;
      try {
        const d = await fetchMovieDetails(f.id);
        if (d.tagline)
          slot.querySelector(".tagline").textContent = `“${d.tagline}”`;
        const by2 = d.director
          ? `Directed by ${d.director}`
          : d.country
          ? `Produced in ${d.country}`
          : "";
        slot.querySelector(".byline").textContent = by2;
      } catch (e) {}
    }
  }, 5000);
}

/* ===== Reset ===== */
function resetAll() {
  chosenGenre = null;
  chosenDecade = null;
  lineupFilms = [];
  shuffledFilms = [];
  candidateFilms = [];
  candidateSpinning = false;
  if (candidateSpinTimer) clearInterval(candidateSpinTimer);
  candidateSpinTimer = null;

  candidatesEl.innerHTML = "";
  candidatesPanel.style.display = "none";
  genreReel.list = GENRES;
  decadeReel.list = DECADES_WEIGHTED;
  filmReel.list = FILM_SCROLL;
  genreReel.build();
  decadeReel.build();
  filmReel.build();
  filmOuter.style.display = "block";

  previewArea.style.display = "none";
  filmPoster.style.backgroundImage = "";
  filmTitle.textContent = "";
  filmMeta.textContent = "";
  btnGenre.textContent = "Spin Genre";
  btnDecade.textContent = "Spin Decade";
  btnFilm.textContent = "Generate";
  btnGenre.disabled = false;
  btnDecade.disabled = true;
  btnFilm.disabled = true;

  for (let i = 0; i < 3; i++) {
    const slot = lineupEl.querySelector(`.slot[data-slot="${i}"]`);
    slot.querySelector(".head .label").textContent(["A", "B", "C"][i]);
    slot.querySelector(".head span:last-child").textContent = "Empty";
    const p = slot.querySelector(".poster");
    p.classList.add("blank");
    p.style.backgroundImage = "";
    p.classList.remove("bigChoice");
    p.innerHTML = "";
    slot.querySelector(".title").textContent = "";
    slot.querySelector(".tagline").textContent = "";
    slot.querySelector(".byline").textContent = "";
  }
  shuffleCaption.style.display = "none";
  rentalMessage.style.display = "none";
  rentalMessage.textContent = "";
  returnWrap.style.display = "none";
}

/* ===== Sweet Generator ===== */
const SWEETS = [
  "Cadbury Dairy Milk",
  "McVitie’s Penguin Orange",
  "Mars Bar",
  "Galaxy Caramel",
  "KitKat Chunky",
  "Twix",
  "Smarties",
  "Maltesers",
  "Aero Mint",
  "Cadbury Crunchie",
  "Bolands Jam Mallows",
  "Kellogg’s Rice Krispies Squares",
  "Jaffa Cakes",
  "Cadbury Buttons",
  "Galaxy Minstrels",
  "Double Decker",
  "Toffee Crisp",
  "Wispa",
  "Yorkie",
  "Munchies",
  "Caramel Nibbles",
  "Flake",
  "Topic",
  "Picnic",
  "Milkybar",
  "Fudge",
  "Toblerone",
  "Revels",
  "Crunchie Rocks",
  "Cadbury Shortcake Snacks",
];

const sweetReel = document.getElementById("sweetReel");
const sweetCells = document.getElementById("sweetCells");
const sweetToggle = document.getElementById("sweetToggle");
const sweetResult = document.getElementById("sweetResult");

let sweetSpinning = false;
let sweetOffset = 0;
let sweetFrame;
function buildSweetReel() {
  const long = SWEETS.concat(SWEETS, SWEETS);
  sweetCells.innerHTML = long
    .map((s) => `<div class="cell">${s}</div>`)
    .join("");
  sweetCells.style.transform = "translateY(0px)";
  sweetOffset = 0;
}
buildSweetReel();
function spinSweet() {
  sweetSpinning = true;
  sweetToggle.textContent = "Stop";
  function step() {
    sweetOffset -= 18;
    if (-sweetOffset >= 64) {
      sweetOffset = 0;
    }
    sweetCells.style.transform = `translateY(${sweetOffset}px)`;
    if (sweetSpinning) sweetFrame = requestAnimationFrame(step);
  }
  step();
}
sweetToggle.addEventListener("click", () => {
  if (!sweetSpinning) {
    spinSweet();
  } else {
    sweetSpinning = false;
    cancelAnimationFrame(sweetFrame);
    sweetToggle.textContent = "Generate";
    const pick = SWEETS[Math.floor(Math.random() * SWEETS.length)];
    sweetResult.textContent = `You will be eating ${pick} with your movie, enjoy!`;
  }
});

/* ===== Smooch ===== */
const kissBtn = document.getElementById("kissBtn");
const kissNote = document.getElementById("kissNote");
kissBtn.addEventListener("click", () => {
  kissNote.textContent = "Mwah!";
  setTimeout(() => (kissNote.textContent = ""), 1500);
});

console.log("Mandy’s Video Store ready.");
