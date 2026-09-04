const METRIC_KEYS = ["authority", "influence", "history", "value"];

const RARITY_ORDER = ["Bronze", "Silver", "Gold", "Platinum", "Legendary"];
const RARITY_CLASS = {
    Bronze: "bronze",
    Silver: "silver",
    Gold: "gold",
    Platinum: "platinum",
    Legendary: "legendary",
};

const RARITY_CODES = {
    Bronze: "B",
    Silver: "A",
    Gold: "S",
    Platinum: "SR",
    Legendary: "SSR",
};

const RARITY_THRESHOLDS = [
    { rarity: "Legendary", min: 95 },
    { rarity: "Platinum", min: 88 },
    { rarity: "Gold", min: 76 },
    { rarity: "Silver", min: 62 },
    { rarity: "Bronze", min: 0 },
];

const RARITY_PROBABILITIES = [
    { rarity: "Bronze", chance: 0.72 },
    { rarity: "Silver", chance: 0.18 },
    { rarity: "Gold", chance: 0.07 },
    { rarity: "Platinum", chance: 0.025 },
    { rarity: "Legendary", chance: 0.005 },
];

const METRIC_WEIGHTS = {
    authority: 0.32,
    influence: 0.30,
    history: 0.20,
    value: 0.18,
};

const FLAVOR_BY_RARITY = {
    Bronze: "기초를 단단히 받쳐 주는 기본 공식 카드.",
    Silver: "범용성과 활용도가 높은 실전형 공식 카드.",
    Gold: "시대를 대표할 만큼 영향력이 큰 핵심 공식 카드.",
    Platinum: "여러 분야에 깊게 스며든 최상위권 공식 카드.",
    Legendary: "수학 그 자체의 상징처럼 다뤄지는 전설적 공식 카드.",
};

const GITHUB_CONTENTS_API = "https://api.github.com/repos/demon-strater/interation-practice/contents?ref=main";
const DEFAULT_CARD_ART = "";
const DEFAULT_CARD_BACK = "back.png";
const DEFAULT_CARD_BACK_KEYWORD = "back";
const DEFAULT_PACK_ART = "pack.png";
const KOREAN_CARD_NAME_TO_ID = {
    "나비에스토크스방정식": "navier_stokes",
    "벨의부등식": "bell_inequality",
    "섀넌엔트로피": "shannon_entropy",
    "오일러라그랑주": "euler_lagrange",
    "질량에너지": "mass_energy",
};
const DETAIL_COPY = {
    euler_identity: {
        origin:
            "1748년 레온하르트 오일러가 정리한 식으로, 수학의 핵심 상수 다섯 개를 하나의 관계식으로 묶는다는 점에서 특히 유명해졌습니다.",
        core:
            "오일러 공식 e^(ix) = cos(x) + i sin(x)에서 x에 pi를 대입하면 e^(i*pi) = -1이 되고, 이를 정리하면 e^(i*pi) + 1 = 0이 됩니다.",
        significance:
            "0, 1, i, pi, e를 한 줄로 연결한다는 점에서 상징성이 매우 큽니다. 대수, 기하, 복소해석의 감각이 응축되어 있어 수학적 아름다움의 대표 예시로 자주 언급됩니다.",
    },
};

const STORAGE_KEY = "formula-relics-tcg-inventory-v5";
const CATALOG_ORDER_KEY = "formula-relics-tcg-catalog-order-v1";
let memoryInventoryStore = null;

const FORMULA_LIBRARY = [
    {
        id: "euler_identity",
        name: "Euler's Identity",
        latex: "e^{i\\pi} + 1 = 0",
        discoverer: "Leonhard Euler",
        year: 1748,
        metrics: { authority: 100, influence: 100, history: 99, value: 100 },
    },
    {
        id: "pythagorean_theorem",
        name: "Pythagorean Theorem",
        latex: "a^2 + b^2 = c^2",
        discoverer: "Pythagoras",
        year: -530,
        metrics: { authority: 99, influence: 98, history: 98, value: 94 },
    },
    {
        id: "quadratic_formula",
        name: "Quadratic Formula",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        discoverer: "Brahmagupta",
        year: 628,
        metrics: { authority: 97, influence: 89, history: 88, value: 82 },
    },
    {
        id: "fundamental_theorem_calculus",
        name: "Fundamental Theorem of Calculus",
        latex: "\\int_a^b f'(x)\\,dx = f(b) - f(a)",
        discoverer: "Isaac Newton & Gottfried Leibniz",
        year: 1668,
        metrics: { authority: 98, influence: 97, history: 95, value: 84 },
    },
    {
        id: "newton_second_law",
        name: "Newton's Second Law",
        latex: "F = ma",
        discoverer: "Isaac Newton",
        year: 1687,
        metrics: { authority: 95, influence: 99, history: 92, value: 90 },
    },
    {
        id: "mass_energy",
        name: "Mass-Energy Equivalence",
        latex: "E = mc^2",
        discoverer: "Albert Einstein",
        year: 1905,
        metrics: { authority: 98, influence: 99, history: 96, value: 91 },
    },
    {
        id: "bayes_theorem",
        name: "Bayes' Theorem",
        latex: "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}",
        discoverer: "Thomas Bayes",
        year: 1763,
        metrics: { authority: 96, influence: 97, history: 87, value: 86 },
    },
    {
        id: "gaussian_integral",
        name: "Gaussian Integral",
        latex: "\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}",
        discoverer: "Carl Friedrich Gauss",
        year: 1809,
        metrics: { authority: 95, influence: 86, history: 82, value: 95 },
    },
    {
        id: "shannon_entropy",
        name: "Shannon Entropy",
        latex: "H(X) = -\\sum p(x)\\log p(x)",
        discoverer: "Claude Shannon",
        year: 1948,
        metrics: { authority: 95, influence: 96, history: 86, value: 84 },
    },
    {
        id: "bell_inequality",
        name: "Bell's Inequality",
        latex: "|E(a,b) - E(a,b') + E(a',b) + E(a',b')| \\le 2",
        discoverer: "John Stewart Bell",
        year: 1964,
        metrics: { authority: 94, influence: 92, history: 84, value: 78 },
    },
    {
        id: "navier_stokes",
        name: "Navier-Stokes Equation",
        latex: "\\rho\\left(\\frac{\\partial u}{\\partial t} + u\\cdot\\nabla u\\right) = -\\nabla p + \\mu\\nabla^2u + f",
        discoverer: "Claude-Louis Navier & George Stokes",
        year: 1845,
        metrics: { authority: 90, influence: 94, history: 88, value: 62 },
    },
    {
        id: "black_scholes",
        name: "Black-Scholes Equation",
        latex: "\\frac{\\partial V}{\\partial t} + \\frac{1}{2}\\sigma^2S^2\\frac{\\partial^2V}{\\partial S^2} + rS\\frac{\\partial V}{\\partial S} - rV = 0",
        discoverer: "Black, Scholes & Merton",
        year: 1973,
        metrics: { authority: 87, influence: 91, history: 80, value: 64 },
    },
    {
        id: "riemann_zeta",
        name: "Riemann Zeta Functional Equation",
        latex: "\\zeta(s) = 2^s\\pi^{s-1}\\sin\\left(\\frac{\\pi s}{2}\\right)\\Gamma(1-s)\\zeta(1-s)",
        discoverer: "Bernhard Riemann",
        year: 1859,
        metrics: { authority: 93, influence: 85, history: 91, value: 79 },
    },
    {
        id: "euclid_primes",
        name: "Euclid's Prime Infinitude",
        latex: "\\text{There are infinitely many primes.}",
        discoverer: "Euclid",
        year: -300,
        metrics: { authority: 97, influence: 84, history: 97, value: 92 },
    },
    {
        id: "de_moivre",
        name: "De Moivre's Formula",
        latex: "(\\cos x + i\\sin x)^n = \\cos(nx) + i\\sin(nx)",
        discoverer: "Abraham de Moivre",
        year: 1730,
        metrics: { authority: 92, influence: 81, history: 78, value: 90 },
    },
    {
        id: "binomial_theorem",
        name: "Binomial Theorem",
        latex: "(x+y)^n = \\sum_{k=0}^{n}\\binom{n}{k}x^{n-k}y^k",
        discoverer: "Isaac Newton",
        year: 1665,
        metrics: { authority: 95, influence: 88, history: 83, value: 86 },
    },
    {
        id: "green_theorem",
        name: "Green's Theorem",
        latex: "\\oint_C (L\\,dx + M\\,dy) = \\iint_D \\left(\\frac{\\partial M}{\\partial x} - \\frac{\\partial L}{\\partial y}\\right)dA",
        discoverer: "George Green",
        year: 1828,
        metrics: { authority: 92, influence: 83, history: 80, value: 74 },
    },
    {
        id: "heron_formula",
        name: "Heron's Formula",
        latex: "A = \\sqrt{s(s-a)(s-b)(s-c)}",
        discoverer: "Heron of Alexandria",
        year: 60,
        metrics: { authority: 91, influence: 72, history: 86, value: 90 },
    },
    {
        id: "law_of_cosines",
        name: "Law of Cosines",
        latex: "c^2 = a^2 + b^2 - 2ab\\cos C",
        discoverer: "Al-Kashi",
        year: 1427,
        metrics: { authority: 93, influence: 75, history: 73, value: 82 },
    },
    {
        id: "ceva_theorem",
        name: "Ceva's Theorem",
        latex: "\\frac{AF}{FB}\\cdot\\frac{BD}{DC}\\cdot\\frac{CE}{EA} = 1",
        discoverer: "Giovanni Ceva",
        year: 1678,
        metrics: { authority: 86, influence: 63, history: 68, value: 78 },
    },
    {
        id: "pick_theorem",
        name: "Pick's Theorem",
        latex: "A = I + \\frac{B}{2} - 1",
        discoverer: "Georg Pick",
        year: 1899,
        metrics: { authority: 84, influence: 58, history: 64, value: 88 },
    },
    {
        id: "inclusion_exclusion",
        name: "Inclusion-Exclusion Principle",
        latex: "|A \\cup B| = |A| + |B| - |A \\cap B|",
        discoverer: "Abraham de Moivre",
        year: 1718,
        metrics: { authority: 89, influence: 74, history: 70, value: 76 },
    },
    {
        id: "eulers_formula",
        name: "Euler's Formula",
        latex: "e^{ix} = \\cos x + i\\sin x",
        discoverer: "Leonhard Euler",
        year: 1748,
        metrics: { authority: 97, influence: 95, history: 91, value: 93 },
    },
    {
        id: "cauchy_schwarz",
        name: "Cauchy-Schwarz Inequality",
        latex: "|\\langle u,v\\rangle| \\leq \\|u\\|\\|v\\|",
        discoverer: "Cauchy & Schwarz",
        year: 1821,
        metrics: { authority: 93, influence: 89, history: 82, value: 77 },
    },
    {
        id: "stokes_theorem",
        name: "Stokes' Theorem",
        latex: "\\int_S (\\nabla \\times F)\\cdot dS = \\oint_{\\partial S} F\\cdot dr",
        discoverer: "George Stokes",
        year: 1854,
        metrics: { authority: 94, influence: 87, history: 81, value: 76 },
    },
    {
        id: "maxwell_equations",
        name: "Maxwell's Equations",
        latex: "\\nabla\\cdot E=\\rho/\\epsilon_0,\\; \\nabla\\cdot B=0",
        discoverer: "James Clerk Maxwell",
        year: 1865,
        metrics: { authority: 96, influence: 99, history: 90, value: 88 },
    },
    {
        id: "wave_equation",
        name: "Wave Equation",
        latex: "\\frac{\\partial^2 u}{\\partial t^2}=c^2\\nabla^2 u",
        discoverer: "Jean le Rond d'Alembert",
        year: 1747,
        metrics: { authority: 91, influence: 90, history: 79, value: 72 },
    },
    {
        id: "heat_equation",
        name: "Heat Equation",
        latex: "\\frac{\\partial u}{\\partial t}=\\alpha \\nabla^2 u",
        discoverer: "Joseph Fourier",
        year: 1822,
        metrics: { authority: 92, influence: 92, history: 83, value: 73 },
    },
    {
        id: "taylor_series",
        name: "Taylor Series",
        latex: "f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n",
        discoverer: "Brook Taylor",
        year: 1715,
        metrics: { authority: 94, influence: 91, history: 84, value: 81 },
    },
    {
        id: "lagrange_multiplier",
        name: "Lagrange Multipliers",
        latex: "\\nabla f = \\lambda \\nabla g",
        discoverer: "Joseph-Louis Lagrange",
        year: 1788,
        metrics: { authority: 90, influence: 86, history: 77, value: 74 },
    },
    {
        id: "euler_lagrange",
        name: "Euler-Lagrange Equation",
        latex: "\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot{q}} - \\frac{\\partial L}{\\partial q} = 0",
        discoverer: "Leonhard Euler & Joseph-Louis Lagrange",
        year: 1755,
        metrics: { authority: 93, influence: 90, history: 88, value: 86 },
    },
    {
        id: "gauss_divergence",
        name: "Gauss Divergence Theorem",
        latex: "\\iiint_V \\nabla\\cdot F\\,dV = \\iint_{\\partial V} F\\cdot n\\,dS",
        discoverer: "Carl Friedrich Gauss",
        year: 1813,
        metrics: { authority: 93, influence: 88, history: 82, value: 75 },
    },
    {
        id: "central_limit_theorem",
        name: "Central Limit Theorem",
        latex: "\\frac{\\bar X-\\mu}{\\sigma/\\sqrt n} \\to N(0,1)",
        discoverer: "Laplace & Lyapunov",
        year: 1810,
        metrics: { authority: 95, influence: 96, history: 85, value: 83 },
    },
];

const STARTER_IDS = [
    "shannon_entropy",
    "navier_stokes",
    "bell_inequality",
    "euler_lagrange",
    "mass_energy",
];

const library = FORMULA_LIBRARY.map(enrichFormula);
const formulaById = Object.fromEntries(library.map((card) => [card.id, card]));

const state = {
    inventory: loadInventory(),
    pendingPack: [],
    ripProgress: 0,
    isOpening: false,
    isSnappingOpen: false,
};

const RIP_OPEN_THRESHOLD = 0.94;
const RIP_SNAP_THRESHOLD = 0.52;
const RIP_DRAG_DISTANCE = 240;

function enrichFormula(formula) {
    const weightedScore = Number(
        METRIC_KEYS.reduce((sum, key) => sum + formula.metrics[key] * METRIC_WEIGHTS[key], 0).toFixed(1),
    );
    const rarity = RARITY_THRESHOLDS.find((item) => weightedScore >= item.min).rarity;
    return {
        ...formula,
        weightedScore,
        rarity,
        totalScore: METRIC_KEYS.reduce((sum, key) => sum + formula.metrics[key], 0),
        flavor: FLAVOR_BY_RARITY[rarity],
        artwork: DEFAULT_CARD_ART,
        backArtwork: DEFAULT_CARD_BACK,
        detail: DETAIL_COPY[formula.id] || {
            origin: `${formula.name}은 ${formula.discoverer}와 연결된 공식으로, 이후의 이론과 응용 속에서 반복적으로 등장하며 수학의 고전으로 자리 잡았습니다.`,
            core: `이 카드에서는 ${formula.latex}를 통해 ${formula.name}의 핵심 구조를 보여줍니다. 식의 형태보다 그 안에 담긴 아이디어가 중심입니다.`,
            significance: `서로 다른 개념을 연결하고, 증명을 단순화하거나, 실제 문제 해결에 직접 쓰인다는 점에서 높은 가치를 지닙니다.`,
        },
    };
}

function escapeAssetPath(path) {
    return encodeURI(path).replace(/#/g, "%23");
}

function imageExists(path) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = `${escapeAssetPath(path)}?v=${Date.now()}`;
    });
}

function normalizeImageMatchKey(value) {
    return value
        .replace(/\.[^.]+$/, "")
        .normalize("NFC")
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "");
}

function getFormulaMatchKeys(formula) {
    return new Set([
        normalizeImageMatchKey(formula.id),
        normalizeImageMatchKey(formula.name),
        normalizeImageMatchKey(formula.name.replace(/equation|theorem|formula|inequality|principle/gi, "")),
    ]);
}

async function fetchGithubPngImages() {
    try {
        const response = await fetch(`${GITHUB_CONTENTS_API}&v=${Date.now()}`);
        if (!response.ok) return [];
        const files = await response.json();
        if (!Array.isArray(files)) return [];
        return files
            .filter((file) => file.type === "file" && /\.png$/i.test(file.name) && file.download_url)
            .map((file) => ({
                name: file.name,
                key: normalizeImageMatchKey(file.name),
                url: file.download_url,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
}

function isPackImage(image) {
    return image.key.includes("pack");
}

function isBackImage(image) {
    return image.key.includes(DEFAULT_CARD_BACK_KEYWORD);
}

function applyPackArtwork(images) {
    const packImage = images.find(isPackImage);
    const packArt = packImage?.url || DEFAULT_PACK_ART;
    document.documentElement.style.setProperty("--pack-art", packArt ? `url("${escapeAssetPath(packArt)}")` : "none");
}

async function applyCustomCardDesigns() {
    const githubImages = await fetchGithubPngImages();
    applyPackArtwork(githubImages);

    const backImage = githubImages.find(isBackImage);
    const cardBackArtwork = backImage?.url || DEFAULT_CARD_BACK;
    const cardImages = githubImages.filter((image) => !isPackImage(image) && !isBackImage(image));
    const unusedImages = new Map(cardImages.map((image) => [image.url, image]));

    library.forEach((formula) => {
        formula.backArtwork = cardBackArtwork;
        const formulaKeys = getFormulaMatchKeys(formula);
        const matchedImage = cardImages.find((image) => {
            const mappedId = KOREAN_CARD_NAME_TO_ID[image.key];
            return mappedId === formula.id || formulaKeys.has(image.key);
        });
        if (!matchedImage) return;
        formula.artwork = matchedImage.url;
        unusedImages.delete(matchedImage.url);
    });

    const fallbackImages = [...unusedImages.values()];
    library
        .filter((formula) => !formula.artwork)
        .forEach((formula, index) => {
            const image = fallbackImages[index];
            if (!image) return;
            formula.artwork = image.url;
            formula.backArtwork = cardBackArtwork;
        });

    if (!cardImages.length) {
        library.forEach((formula) => {
            formula.backArtwork = cardBackArtwork;
        });
        return;
    }

    library.forEach((formula) => {
        if (!formula.backArtwork) {
            formula.backArtwork = cardBackArtwork;
        }
    });
}

function safeStorageGet(key) {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return memoryInventoryStore;
    }
}

function safeStorageSet(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        if (key === STORAGE_KEY) {
            memoryInventoryStore = value;
        }
    }
}

function safeStorageRemove(key) {
    try {
        window.localStorage.removeItem(key);
    } catch {
        if (key === STORAGE_KEY) {
            memoryInventoryStore = null;
        }
    }
}

function ensureStarterInventory(entries) {
    const starterIds = new Set(STARTER_IDS);
    const next = entries.filter((entry) => entry.source !== "starter" || starterIds.has(entry.formulaId));
    const existingIds = new Set(next.map((entry) => entry.formulaId));
    let timestamp = Date.now();

    STARTER_IDS.forEach((id) => {
        if (existingIds.has(id)) return;
        next.push({
            formulaId: id,
            acquiredAt: timestamp++,
            source: "starter",
        });
    });

    return next;
}

function loadInventory() {
    const raw = safeStorageGet(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            const normalized = ensureStarterInventory(Array.isArray(parsed) ? parsed : []);
            safeStorageSet(STORAGE_KEY, JSON.stringify(normalized));
            return normalized;
        } catch {
            safeStorageRemove(STORAGE_KEY);
        }
    }

    const now = Date.now();
    const starter = STARTER_IDS.map((id, index) => ({
        formulaId: id,
        acquiredAt: now + index,
        source: "starter",
    }));
    safeStorageSet(STORAGE_KEY, JSON.stringify(starter));
    return starter;
}

function saveInventory() {
    safeStorageSet(STORAGE_KEY, JSON.stringify(state.inventory));
}

function formatYear(year) {
    return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

function formatDate(ts) {
    return new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(ts));
}

function rarityIndex(rarity) {
    return RARITY_ORDER.indexOf(rarity);
}

function thresholdCenter(rarity) {
    if (rarity === "Legendary") return 98;
    if (rarity === "Platinum") return 91;
    if (rarity === "Gold") return 81;
    if (rarity === "Silver") return 68;
    return 50;
}

function getInventoryGroups() {
    const groups = new Map();
    state.inventory.forEach((entry) => {
        const formula = formulaById[entry.formulaId];
        const current = groups.get(entry.formulaId);
        if (current) {
            current.count += 1;
            current.lastAcquiredAt = Math.max(current.lastAcquiredAt, entry.acquiredAt);
        } else {
            groups.set(entry.formulaId, {
                formula,
                count: 1,
                lastAcquiredAt: entry.acquiredAt,
            });
        }
    });
    return [...groups.values()];
}

function getOwnedFormulaIds() {
    return new Set(state.inventory.map((entry) => entry.formulaId));
}

function loadCatalogOrder() {
    const raw = safeStorageGet(CATALOG_ORDER_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        safeStorageRemove(CATALOG_ORDER_KEY);
        return [];
    }
}

function saveCatalogOrder(order) {
    safeStorageSet(CATALOG_ORDER_KEY, JSON.stringify(order));
}

function getCatalogOrderMap() {
    return new Map(loadCatalogOrder().map((id, index) => [id, index]));
}

function getOwnedOrderMap() {
    const order = new Map();
    state.inventory.forEach((entry, index) => {
        if (!order.has(entry.formulaId)) {
            order.set(entry.formulaId, { index, acquiredAt: entry.acquiredAt });
        }
    });
    return order;
}

function sortInventory(items, mode) {
    const sorted = [...items];
    sorted.sort((a, b) => {
        if (mode === "name") {
            return a.formula.name.localeCompare(b.formula.name);
        }
        if (mode === "date") {
            return b.lastAcquiredAt - a.lastAcquiredAt;
        }
        const rarityDiff = rarityIndex(b.formula.rarity) - rarityIndex(a.formula.rarity);
        if (rarityDiff !== 0) return rarityDiff;
        return b.formula.weightedScore - a.formula.weightedScore;
    });
    return sorted;
}

function rollRarity() {
    const seed = Math.random();
    let cursor = 0;
    for (const item of RARITY_PROBABILITIES) {
        cursor += item.chance;
        if (seed <= cursor) return item.rarity;
    }
    return "Bronze";
}

function drawCardByRarity(rarity, excludedIds = new Set()) {
    const illustratedCards = library.filter((formula) => Boolean(formula.artwork));
    const availableCards = illustratedCards.filter((formula) => !excludedIds.has(formula.id));
    const pool = availableCards.filter((formula) => formula.rarity === rarity);
    if (pool.length) {
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return availableCards
        .slice()
        .sort((a, b) => Math.abs(a.weightedScore - thresholdCenter(rarity)) - Math.abs(b.weightedScore - thresholdCenter(rarity)))[0];
}

function createPack() {
    const count = 5;
    const selectedIds = new Set();
    return Array.from({ length: count }, () => {
        const rarity = rollRarity();
        const card = drawCardByRarity(rarity, selectedIds);
        if (card) {
            selectedIds.add(card.id);
        }
        return card;
    }).filter(Boolean);
}

function radarPolygonPoints(metrics) {
    const anchors = [
        [120, 22, metrics.authority],
        [214, 86, metrics.influence],
        [176, 214, metrics.value],
        [64, 214, metrics.history],
    ];
    return anchors
        .map(([x, y, value]) => {
            const scale = value / 100;
            const px = 120 + (x - 120) * scale;
            const py = 120 + (y - 120) * scale;
            return `${px},${py}`;
        })
        .join(" ");
}

function buildRadarChart(formula) {
    const rings = [0.25, 0.5, 0.75, 1].map((scale) => {
        const points = [
            [120, 18],
            [220, 82],
            [220, 188],
            [120, 222],
            [20, 188],
            [20, 82],
        ].map(([x, y]) => `${120 + (x - 120) * scale},${120 + (y - 120) * scale}`).join(" ");
        return `<polygon points="${points}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
    }).join("");

    return `
        <svg class="radar-svg" viewBox="0 0 240 240" role="img" aria-label="${formula.name} radar chart">
            ${rings}
            <line x1="120" y1="120" x2="120" y2="22" stroke="rgba(255,255,255,0.12)" />
            <line x1="120" y1="120" x2="214" y2="86" stroke="rgba(255,255,255,0.12)" />
            <line x1="120" y1="120" x2="176" y2="214" stroke="rgba(255,255,255,0.12)" />
            <line x1="120" y1="120" x2="64" y2="214" stroke="rgba(255,255,255,0.12)" />
            <polygon points="${radarPolygonPoints(formula.metrics)}" fill="rgba(121,214,227,0.25)" stroke="rgba(121,214,227,0.92)" stroke-width="2" />
            <text x="120" y="14" text-anchor="middle">Authority</text>
            <text x="222" y="80" text-anchor="end">Influence</text>
            <text x="176" y="230" text-anchor="middle">Value</text>
            <text x="64" y="230" text-anchor="middle">History</text>
        </svg>
    `;
}

function createCardElement(formula, options = {}) {
    const { featured = false } = options;
    const template = document.getElementById("cardTemplate");
    const node = template.content.firstElementChild.cloneNode(true);
    const hasBackFace = Boolean(formula.backArtwork || DEFAULT_CARD_BACK);

    node.dataset.rarity = formula.rarity;
    if (featured) node.classList.add("is-featured");
    const artSeed = Math.abs(formula.year) + formula.name.length * 13;
    const artPalette = [220, 232, 244, 256, 268, 280, 32, 44];
    const artHue = artPalette[artSeed % artPalette.length];
    const artHueSecondary = artPalette[(artSeed + 3) % artPalette.length];
    const artHueAccent = artPalette[(artSeed + 5) % artPalette.length];
    const monogram = formula.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();

    // Top: Rarity and Name
    const rarityBadge = node.querySelector(".card-rarity-code");
    rarityBadge.textContent = RARITY_CODES[formula.rarity];
    rarityBadge.classList.add(RARITY_CLASS[formula.rarity]);
    
    node.querySelector(".card-name").textContent = formula.name;
    if (formula.artwork) {
        node.style.setProperty("--card-art", `url("${escapeAssetPath(formula.artwork)}")`);
    } else {
        node.style.removeProperty("--card-art");
        node.classList.add("is-generated-art");
    }

    if (formula.backArtwork || DEFAULT_CARD_BACK) {
        node.style.setProperty("--card-back-art", `url("${escapeAssetPath(formula.backArtwork || DEFAULT_CARD_BACK)}")`);
    } else {
        node.style.removeProperty("--card-back-art");
    }
    node.style.setProperty("--art-hue", String(artHue));
    node.style.setProperty("--art-hue-secondary", String(artHueSecondary));
    node.style.setProperty("--art-hue-accent", String(artHueAccent));
    node.querySelector(".formula-sigil-anim").textContent = monogram;
    
    // Formula Bar (Below Name)
    node.querySelector(".card-formula-display").textContent = formula.latex;
    
    // Middle: Art Window (Discoverer & Year overlay)
    node.querySelector(".card-discoverer").textContent = formula.discoverer;
    node.querySelector(".card-year").textContent = formatYear(formula.year);
    
    // Bottom: Stats and Flavor
    const statRow = node.querySelector(".card-stat-row");
    statRow.innerHTML = `
        <div class="stat-gem"><span class="label">AUTH</span><strong>${formula.metrics.authority}</strong></div>
        <div class="stat-gem"><span class="label">INFL</span><strong>${formula.metrics.influence}</strong></div>
        <div class="stat-gem"><span class="label">HIST</span><strong>${formula.metrics.history}</strong></div>
        <div class="stat-gem"><span class="label">VALU</span><strong>${formula.metrics.value}</strong></div>
    `;
    
    node.querySelector(".card-flavor").textContent = formula.flavor;
    node.title = hasBackFace ? `${formula.name} - drag sideways to flip` : formula.name;
    let flipAngle = 0;
    let dragStartX = 0;
    let dragStartAngle = 0;
    let isFlipDragging = false;
    let didFlipDrag = false;
    let activeFlipPointerId = null;

    node.draggable = false;

    const setFlipAngle = (angle) => {
        flipAngle = Math.max(0, Math.min(180, angle));
        node.style.setProperty("--flip-angle", `${flipAngle.toFixed(2)}deg`);
        // Explicitly fade the large composited face near edge-on. Some browsers
        // otherwise leave its dark GPU backing layer over neighbouring cards.
        const distanceFromEdge = Math.abs(flipAngle - 90);
        const faceVisibility = Math.min(1, distanceFromEdge / 12);
        const edgeVisibility = Math.max(0, 1 - distanceFromEdge / 10);
        node.style.setProperty("--face-visibility", faceVisibility.toFixed(3));
        node.style.setProperty("--edge-visibility", edgeVisibility.toFixed(3));
        const showingBack = flipAngle > 90;
        node.classList.toggle("is-flipped", showingBack);
        node.setAttribute("aria-pressed", showingBack ? "true" : "false");
    };

    const toggleFlip = () => {
        if (!hasBackFace) return;
        setFlipAngle(flipAngle > 90 ? 0 : 180);
    };

    node.addEventListener("pointerdown", (event) => {
        if (!hasBackFace || event.button !== 0) return;
        isFlipDragging = true;
        didFlipDrag = false;
        activeFlipPointerId = event.pointerId;
        dragStartX = event.clientX;
        dragStartAngle = flipAngle;
        node.classList.add("is-flip-dragging");
        try { node.setPointerCapture(event.pointerId); } catch { /* synthetic hand pointer */ }
        window.addEventListener("pointerup", finishFlipDrag, true);
        window.addEventListener("pointercancel", finishFlipDrag, true);
    });

    node.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCardModal(formula);
    });

    node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleFlip();
        }
    });

    // Continuous drag rotation plus a light hover tilt.
    node.addEventListener("pointermove", (e) => {
        if (isFlipDragging) {
            const deltaX = e.clientX - dragStartX;
            if (Math.abs(deltaX) > 3) didFlipDrag = true;
            setFlipAngle(dragStartAngle + deltaX * 0.9);
            return;
        }
        if (node.classList.contains("is-flipped")) return;
        const rect = node.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -12;
        const rotateY = ((x - centerX) / centerX) * 12;
        const glare = Math.min(1, Math.hypot(x - centerX, y - centerY) / Math.hypot(centerX, centerY));
        
        node.style.transition = "none";
        node.style.setProperty("--shine-x", `${((x / rect.width) * 100).toFixed(2)}%`);
        node.style.setProperty("--shine-y", `${((y / rect.height) * 100).toFixed(2)}%`);
        node.style.setProperty("--tilt-glare", glare.toFixed(3));
        node.style.transform = `perspective(1000px) translateY(-8px) scale(1.03) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    const finishFlipDrag = (event) => {
        if (!isFlipDragging) return;
        if (activeFlipPointerId !== null && event.pointerId !== activeFlipPointerId) return;
        isFlipDragging = false;
        activeFlipPointerId = null;
        node.classList.remove("is-flip-dragging");
        window.removeEventListener("pointerup", finishFlipDrag, true);
        window.removeEventListener("pointercancel", finishFlipDrag, true);
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        if (didFlipDrag) {
            // Settle on whichever face is closest when the card is released.
            setFlipAngle(flipAngle >= 90 ? 180 : 0);
        }
    };

    node.addEventListener("pointerup", finishFlipDrag);
    node.addEventListener("pointercancel", finishFlipDrag);
    node.addEventListener("lostpointercapture", finishFlipDrag);
    node.addEventListener("dragstart", (event) => event.preventDefault());

    node.addEventListener("click", (event) => {
        if (didFlipDrag) {
            event.preventDefault();
        } else {
            toggleFlip();
        }
        didFlipDrag = false;
    });

    node.addEventListener("pointerleave", () => {
        if (isFlipDragging) return;
        node.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease";
        node.style.setProperty("--shine-x", "50%");
        node.style.setProperty("--shine-y", "20%");
        node.style.setProperty("--tilt-glare", "0");
        node.style.transform = "";
    });

    return node;
}

function buildModalStats(formula) {
    return METRIC_KEYS.map((key) => `
        <div class="modal-stat">
            <span>${key.toUpperCase()}</span>
            <strong>${formula.metrics[key]}</strong>
        </div>
    `).join("");
}

function openCardModal(formula) {
    const modal = document.getElementById("cardModal");
    const visual = document.getElementById("modalCard3d");
    const rarityNode = document.getElementById("modalRarity");

    document.getElementById("modalTitle").textContent = formula.name;
    rarityNode.textContent = formula.rarity;
    rarityNode.className = `rarity-chip ${RARITY_CLASS[formula.rarity]}`;
    document.getElementById("modalScore").textContent = `가중 점수 ${formula.weightedScore}`;
    document.getElementById("modalDiscoverer").textContent = formula.discoverer;
    document.getElementById("modalYear").textContent = formatYear(formula.year);
    document.getElementById("modalOrigin").textContent = formula.detail.origin;
    document.getElementById("modalSignificance").textContent = formula.detail.significance;
    document.getElementById("modalStats").innerHTML = buildModalStats(formula);

    const modalCard = createCardElement(formula, { featured: true });
    modalCard.classList.add("modal-preview-card");
    visual.replaceChildren(modalCard);

    modal.classList.remove("hidden");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeCardModal() {
    const modal = document.getElementById("cardModal");
    const visual = document.getElementById("modalCard3d");
    modal.classList.add("hidden");
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    visual.replaceChildren();
    document.body.classList.remove("modal-open");
}

function bindModalEvents() {
    const modal = document.getElementById("cardModal");
    document.getElementById("closeModalButton").addEventListener("click", closeCardModal);
    modal.addEventListener("click", (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
            closeCardModal();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.classList.contains("hidden")) {
            closeCardModal();
        }
    });
}

function renderCatalog() {
    const grid = document.getElementById("catalogGrid");
    const emptyState = document.getElementById("catalogEmptyState");
    const ownedIds = getOwnedFormulaIds();
    const catalogOrder = getCatalogOrderMap();
    const cards = library
        .filter((formula) => Boolean(formula))
        .sort((a, b) => {
            const ownedDiff = Number(ownedIds.has(b.id)) - Number(ownedIds.has(a.id));
            if (ownedDiff !== 0) return ownedDiff;

            const artworkDiff = Number(Boolean(b.artwork)) - Number(Boolean(a.artwork));
            if (artworkDiff !== 0) return artworkDiff;

            const orderA = catalogOrder.has(a.id) ? catalogOrder.get(a.id) : Number.MAX_SAFE_INTEGER;
            const orderB = catalogOrder.has(b.id) ? catalogOrder.get(b.id) : Number.MAX_SAFE_INTEGER;
            if (orderA !== orderB) return orderA - orderB;

            const rarityDiff = rarityIndex(b.rarity) - rarityIndex(a.rarity);
            if (rarityDiff !== 0) return rarityDiff;

            return b.weightedScore - a.weightedScore || a.name.localeCompare(b.name);
        })
        .map((formula) => {
            const card = createCardElement(formula);
            card.dataset.formulaId = formula.id;
            card.draggable = false;
            if (!ownedIds.has(formula.id)) {
                card.classList.add("is-unowned");
            }
            card.classList.add("enter");
            return card;
        });

    grid.replaceChildren(...cards);
    if (emptyState) {
        emptyState.classList.add("hidden");
    }
}

function bindCatalogReorder() {
    const grid = document.getElementById("catalogGrid");
    if (!grid) return;

    let draggedId = null;

    grid.addEventListener("dragstart", (event) => {
        const card = event.target instanceof HTMLElement ? event.target.closest(".tcg-card") : null;
        if (!card) return;
        draggedId = card.dataset.formulaId || null;
        card.classList.add("is-dragging");
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", draggedId || "");
        }
    });

    grid.addEventListener("dragend", (event) => {
        const card = event.target instanceof HTMLElement ? event.target.closest(".tcg-card") : null;
        if (card) {
            card.classList.remove("is-dragging");
        }
        draggedId = null;
    });

    grid.addEventListener("dragover", (event) => {
        if (!draggedId) return;
        event.preventDefault();
    });

    grid.addEventListener("drop", (event) => {
        if (!draggedId) return;
        event.preventDefault();
        const targetCard = event.target instanceof HTMLElement ? event.target.closest(".tcg-card") : null;
        if (!targetCard) return;
        const targetId = targetCard.dataset.formulaId;
        if (!targetId || targetId === draggedId) return;

        const currentIds = [...grid.querySelectorAll(".tcg-card")]
            .map((node) => node.dataset.formulaId)
            .filter(Boolean);
        const draggedIndex = currentIds.indexOf(draggedId);
        const targetIndex = currentIds.indexOf(targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;

        currentIds.splice(draggedIndex, 1);
        currentIds.splice(targetIndex, 0, draggedId);
        saveCatalogOrder(currentIds);
        renderCatalog();
    });
}

let pageTransitionToken = 0;

function showPage(pageName) {
    const pageStack = document.getElementById("pageStack");
    const views = [...document.querySelectorAll(".page-view")];
    const currentView = views.find((view) => !view.hidden && view.classList.contains("is-active"));
    const nextView = views.find((view) => view.dataset.page === pageName);
    document.body.classList.toggle("is-opening-page", pageName === "opening");
    if (!nextView || currentView === nextView) return;
    const pageOrder = views.map((view) => view.dataset.page);
    const direction = pageOrder.indexOf(pageName) > pageOrder.indexOf(currentView?.dataset.page) ? 1 : -1;
    const token = ++pageTransitionToken;

    if (pageStack) {
        pageStack.dataset.page = pageName;
    }

    views.forEach((view) => {
        const isActive = view.dataset.page === pageName;
        view.classList.toggle("is-active", isActive);
        if (isActive) {
            view.hidden = false;
            view.style.display = "flex";
        } else if (view !== currentView) {
            view.hidden = true;
            view.style.display = "none";
        }
        view.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (currentView && !reduceMotion) {
        pageStack?.classList.add("is-transitioning");
        const outgoing = currentView.animate([
            { transform: "translateX(0)", opacity: 1 },
            { transform: `translateX(${-direction * 12}%)`, opacity: 0 }
        ], { duration: 380, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
        nextView.animate([
            { transform: `translateX(${direction * 18}%)`, opacity: 0 },
            { transform: "translateX(0)", opacity: 1 }
        ], { duration: 460, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" });
        outgoing.finished.catch(() => {}).then(() => {
            if (token !== pageTransitionToken) return;
            currentView.hidden = true;
            currentView.style.display = "none";
            pageStack?.classList.remove("is-transitioning");
        });
    } else if (currentView) {
        currentView.hidden = true;
        currentView.style.display = "none";
    }

    document.querySelectorAll(".page-tab").forEach((button) => {
        const isActive = button.dataset.pageTarget === pageName;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function renderInventory() {
    const grid = document.getElementById("inventoryGrid");
    if (!grid) return;
    const mode = document.getElementById("inventorySort")?.value || "rarity";
    const items = sortInventory(getInventoryGroups(), mode);
    grid.innerHTML = "";

    items.forEach((item) => {
        const box = document.createElement("article");
        box.className = "inventory-item";
        box.innerHTML = `
            <div class="card-topline">
                <span class="rarity-chip ${RARITY_CLASS[item.formula.rarity]}">${item.formula.rarity}</span>
                <span class="count-chip">x${item.count}</span>
            </div>
            <h3>${item.formula.name}</h3>
            <p class="mini-expression">${item.formula.latex}</p>
                        <p class="mini-meta">Discoverer: ${item.formula.discoverer}</p>
            <p class="mini-meta">Acquired: ${formatDate(item.lastAcquiredAt)}</p>
            <p class="mini-meta">Score: ${item.formula.totalScore} / Weighted ${item.formula.weightedScore}</p>
        `;
        grid.append(box);
    });
}

function updateStats() {
    return getInventoryGroups();
}

function setRipInstructions(text) {
    document.getElementById("ripInstructions").textContent = "";
}

function resetPackUI() {
    const packButton = document.getElementById("ripPackButton");
    const spreadFan = document.getElementById("spreadFan");
    packButton.classList.remove("is-opened", "is-ripping", "is-disabled");
    packButton.dataset.ripState = "sealed";
    packButton.disabled = false;
    packButton.style.pointerEvents = "auto";
    packButton.hidden = false;
    state.isSnappingOpen = false;
    packButton.style.setProperty("--drag-x", "0px");
    packButton.style.setProperty("--drag-y", "0px");
    updatePackOpenState(0);
    spreadFan.innerHTML = "";
    document.getElementById("openingTitle").textContent = "";
    document.getElementById("revealMessage").textContent = "";
}

function prepareNewPack() {
    if (state.isOpening) return;
    state.pendingPack = createPack();
    state.ripProgress = 0;
    resetPackUI();
    setRipInstructions("");
}

function updatePackOpenState(progress) {
    const packButton = document.getElementById("ripPackButton");
    state.ripProgress = Math.max(0, Math.min(1, progress));
    packButton.dataset.ripState = state.ripProgress > 0.02 ? "tearing" : "sealed";
    packButton.style.setProperty("--rip-open", state.ripProgress.toFixed(3));
    packButton.style.setProperty("--card-peek", Math.max(0, (state.ripProgress - 0.92) / 0.08).toFixed(3));

    if (state.ripProgress < 0.18) {
        setRipInstructions("");
    } else if (state.ripProgress < 0.5) {
        setRipInstructions("");
    } else if (state.ripProgress < RIP_OPEN_THRESHOLD) {
        setRipInstructions("");
    }
}

function addPackToInventory(cards) {
    const now = Date.now();
    cards.forEach((card, index) => {
        state.inventory.push({
            formulaId: card.id,
            acquiredAt: now + index,
            source: "gacha",
        });
    });
    saveInventory();
}

function revealPack(cards) {
    const cardStage = document.getElementById("cardStage");
    const spreadFan = document.getElementById("spreadFan");
    const bestCard = cards.slice().sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.weightedScore - a.weightedScore)[0];

    cardStage.classList.remove("is-bursting");
    spreadFan.innerHTML = "";

    cards.forEach((card, index) => {
        const shell = document.createElement("div");
        // Apply different class based on total card count for better centering
        shell.className = `spread-card card-slot-${index}${cards.length === 5 ? '-5' : ''}`;
        
        const node = createCardElement(card, { featured: card.id === bestCard.id });
        shell.append(node);
        spreadFan.append(shell);
        requestAnimationFrame(() => {
            shell.classList.add("is-visible");
        });
    });

    document.getElementById("openingTitle").textContent = "";
    document.getElementById("revealMessage").textContent = "";
    setRipInstructions("");
    state.isOpening = false;
}

function openPack() {
    if (!state.pendingPack.length || state.isOpening) return;
    state.isOpening = true;

    const cardStage = document.getElementById("cardStage");
    const packButton = document.getElementById("ripPackButton");
    updatePackOpenState(1);
    packButton.dataset.ripState = "opened";
    packButton.classList.add("is-opened");
    packButton.disabled = true;
    packButton.style.pointerEvents = "none";
    packButton.style.setProperty("--tilt-x", "0deg");
    packButton.style.setProperty("--tilt-y", "0deg");
    document.getElementById("openingTitle").textContent = "";
    setRipInstructions("");
    cardStage.classList.remove("is-bursting");
    void cardStage.offsetWidth;
    cardStage.classList.add("is-bursting");
    const openedCards = [...state.pendingPack];
    setTimeout(() => {
        packButton.hidden = true;
        revealPack(openedCards);
        state.pendingPack = [];
    }, 520);

    addPackToInventory(state.pendingPack);
    updateStats();
    try {
        renderInventory();
        renderCatalog();
    } catch (error) {
        console.error("Collected-card rendering failed after opening a pack", error);
    }
}

function snapOpenPack() {
    if (state.isOpening || state.isSnappingOpen || state.ripProgress < RIP_SNAP_THRESHOLD) return;
    const packButton = document.getElementById("ripPackButton");
    state.isSnappingOpen = true;
    packButton.style.pointerEvents = "none";
    packButton.classList.add("is-snapping-open");
    const startedAt = performance.now();
    const startProgress = state.ripProgress;
    const duration = 280;

    const finishTear = (now) => {
        const elapsed = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        updatePackOpenState(startProgress + (1 - startProgress) * eased);
        if (elapsed < 1) {
            requestAnimationFrame(finishTear);
            return;
        }
        packButton.classList.remove("is-snapping-open");
        state.isSnappingOpen = false;
        openPack();
    };

    requestAnimationFrame(finishTear);
}

function bindPackDrag() {
    const packButton = document.getElementById("ripPackButton");
    let pointerDown = false;
    let startX = 0;
    let startY = 0;
    let baseProgress = 0;

    const updatePackTilt = (clientX, clientY) => {
        const rect = packButton.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((y - centerY) / centerY) * -6;
        const tiltY = ((x - centerX) / centerX) * 8;
        packButton.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        packButton.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    };

    packButton.addEventListener("pointerdown", (event) => {
        if (packButton.disabled) return;
        pointerDown = true;
        startX = event.clientX;
        startY = event.clientY;
        baseProgress = state.ripProgress;
        updatePackTilt(event.clientX, event.clientY);
        try { packButton.setPointerCapture(event.pointerId); } catch { /* synthetic hand pointer */ }
    });

    packButton.addEventListener("pointermove", (event) => {
        if (packButton.disabled) return;
        updatePackTilt(event.clientX, event.clientY);
        if (!pointerDown) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const offsetX = Math.max(-18, Math.min(24, deltaX * 0.08));
        const offsetY = Math.max(-12, Math.min(18, deltaY * 0.05));
        packButton.style.setProperty("--drag-x", `${offsetX}px`);
        packButton.style.setProperty("--drag-y", `${offsetY}px`);
        const nextProgress = baseProgress + Math.max(0, deltaX) / RIP_DRAG_DISTANCE;
        updatePackOpenState(nextProgress);
        if (nextProgress >= RIP_SNAP_THRESHOLD) {
            pointerDown = false;
            snapOpenPack();
        }
    });

    packButton.addEventListener("pointerup", () => {
        pointerDown = false;
        packButton.style.setProperty("--drag-x", "0px");
        packButton.style.setProperty("--drag-y", "0px");
        if (!state.isOpening && state.ripProgress >= RIP_SNAP_THRESHOLD) {
            snapOpenPack();
        }
    });

    packButton.addEventListener("pointercancel", () => {
        pointerDown = false;
        packButton.style.setProperty("--drag-x", "0px");
        packButton.style.setProperty("--drag-y", "0px");
        packButton.style.setProperty("--tilt-x", "0deg");
        packButton.style.setProperty("--tilt-y", "0deg");
        if (!state.isOpening && state.ripProgress >= RIP_SNAP_THRESHOLD) {
            snapOpenPack();
        }
    });

    packButton.addEventListener("pointerleave", () => {
        if (pointerDown) return;
        packButton.style.setProperty("--tilt-x", "0deg");
        packButton.style.setProperty("--tilt-y", "0deg");
    });

    packButton.addEventListener("click", () => {
        if (packButton.disabled) return;
        updatePackOpenState(Math.min(1, state.ripProgress + 0.22));
        packButton.classList.add("is-ripping");
        setTimeout(() => packButton.classList.remove("is-ripping"), 280);
        if (state.ripProgress >= RIP_SNAP_THRESHOLD) {
            snapOpenPack();
        }
    });
}

function bindEvents() {
    document.getElementById("newPackButton").addEventListener("click", prepareNewPack);
    document.getElementById("inventorySort")?.addEventListener("change", renderInventory);
    document.querySelectorAll(".page-tab").forEach((button) => {
        button.addEventListener("click", () => {
            showPage(button.dataset.pageTarget);
        });
    });
    bindPackDrag();
    bindCatalogReorder();
    bindModalEvents();
}

function init() {
    // Render immediately from bundled assets. Remote artwork discovery must
    // never block pack interaction or the collected-card catalog.
    applyPackArtwork([]);
    library.forEach((formula) => {
        formula.backArtwork = formula.backArtwork || DEFAULT_CARD_BACK;
    });
    showPage("opening");
    renderCatalog();
    renderInventory();
    updateStats();
    bindEvents();
    prepareNewPack();

    applyCustomCardDesigns().then(() => {
        renderCatalog();
        renderInventory();
    }).catch((error) => {
        console.warn("Using bundled card artwork because remote artwork discovery failed", error);
    });
}

document.addEventListener("DOMContentLoaded", init);

