const pokemonInput = document.querySelector("#pokemon-input");
const searchBtn = document.querySelector("#search-btn");
const pokemonCard = document.querySelector("#pokemon-card");
const randomBtn = document.querySelector("#random-btn");
const soundBtn = document.querySelector("#sound-btn");
const favoritesToggleBtn = document.querySelector("#favorites-toggle-btn");
const favoritesList = document.querySelector("#favorites-list");
const recentToggleBtn = document.querySelector("#recent-toggle-btn");
const recentList = document.querySelector("#recent-list");
let isShiny = false;
let currentCry = "";
let favorites = (JSON.parse(localStorage.getItem("pokemonFavorites")) || [])
    .map(pokemon => ({
        id: pokemon.id,
        name: pokemon.name
    }));

let recentPokemon = (JSON.parse(localStorage.getItem("recentPokemon")) || [])
    .map(pokemon => ({
        id: pokemon.id,
        name: pokemon.name
    }));

saveFavorites();
saveRecentPokemon();

function saveFavorites() {
    localStorage.setItem("pokemonFavorites", JSON.stringify(favorites));
}

function isFavorite(pokemonId) {
    return favorites.some(pokemon => pokemon.id === pokemonId);
}

function toggleFavorite(pokemonData) {
    if (isFavorite(pokemonData.id)) {
        favorites = favorites.filter(pokemon => pokemon.id !== pokemonData.id);
    } else {

    if (favorites.length >= 35) {
        alert("Solo puedes guardar 35 Pokémon favoritos.");
        return;
    }
favorites.push({
    id: pokemonData.id,
    name: pokemonData.name
});
}
    saveFavorites();
}

function saveRecentPokemon() {
    localStorage.setItem(
        "recentPokemon",
        JSON.stringify(recentPokemon)
    );
}

function addToRecentPokemon(pokemonData) {

    recentPokemon = recentPokemon.filter(
        pokemon => pokemon.id !== pokemonData.id
    );

recentPokemon.unshift({
    id: pokemonData.id,
    name: pokemonData.name
});

    if (recentPokemon.length > 10) {
        recentPokemon.pop();
    }

    saveRecentPokemon();
}

function getSpriteSet(pokemonData) {
    const normal =
        pokemonData.sprites.front_default ||
        pokemonData.sprites.other?.["official-artwork"]?.front_default ||
        pokemonData.sprites.other?.home?.front_default;

    const shiny =
        pokemonData.sprites.front_shiny ||
        pokemonData.sprites.other?.["official-artwork"]?.front_shiny ||
        pokemonData.sprites.other?.home?.front_shiny ||
        normal;

    return { normal, shiny };
}

function renderStats(pokemonData) {
    return pokemonData.stats.map(statInfo => {
        const statName = statInfo.stat.name;
        const statValue = statInfo.base_stat;
        const barWidth = Math.min((statValue / 255) * 100, 100);

        return `
            <div class="stat-row">
                <div class="stat-label">
                    <span class="stat-name">${statName}</span>
                    <span class="stat-value">${statValue}</span>
                </div>

                <div class="stat-bar">
                    <div 
                        class="stat-bar-fill" 
                        style="width: ${barWidth}%"
                    ></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderPokemonList(list, className, emptyMessage) {

    if (list.length === 0) {
        return `
            <p class="favorites-empty">${emptyMessage}</p>
        `;
    }

    return list.map(pokemon => `
        <button class="${className}" data-id="${pokemon.id}">
            <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png"
                alt="${pokemon.name}"
                class="mini-sprite"
            >
            <span>${pokemon.name}</span>
        </button>
    `).join("");
}

function updatePokemonDisplay(
    pokemonData,
    sprites,
    pokemonImage,
    pokemonNameTitle,
    statsList,
    shinyBtn
) {
    pokemonImage.src = sprites.normal;
    pokemonNameTitle.textContent = pokemonData.name;
    statsList.innerHTML = renderStats(pokemonData);

    shinyBtn.dataset.normal = sprites.normal;
    shinyBtn.dataset.shiny = sprites.shiny;

    isShiny = false;
    shinyBtn.textContent = "✨";
}

async function searchPokemon() {
    const pokemonName = pokemonInput.value.toLowerCase().trim().replace(/\s+/g, "-");

    if (pokemonName === "") {
        pokemonCard.innerHTML = "<p>Escribe un nombre o número de Pokémon.</p>";
        return;
    }

    try {

let response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
);

let data;

if (response.ok) {
    data = await response.json();
} else {
    const speciesResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
    );

    if (!speciesResponse.ok) {
        throw new Error("Pokémon no encontrado");
    }

    const speciesData = await speciesResponse.json();

    const defaultVariety = speciesData.varieties.find(
        variety => variety.is_default
    );

    if (!defaultVariety) {
        throw new Error("Forma por defecto no encontrada");
    }

    const defaultPokemonResponse = await fetch(defaultVariety.pokemon.url);

    if (!defaultPokemonResponse.ok) {
        throw new Error("Variedad por defecto no encontrada");
    }

    data = await defaultPokemonResponse.json();
}
const baseSprites = getSpriteSet(data);
addToRecentPokemon(data);
currentCry = data.cries.latest;
const speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
);

const speciesData = await speciesResponse.json();
const evolutionResponse = await fetch(
    speciesData.evolution_chain.url
);

const evolutionData = await evolutionResponse.json();
const megaForms = speciesData.varieties.filter(
    variety => variety.pokemon.name.includes("-mega")
);
const gmaxForms = speciesData.varieties.filter(
    variety => variety.pokemon.name.includes("-gmax")
);

const normalForms = speciesData.varieties.filter(variety => {

    const name = variety.pokemon.name;

    return (
        !variety.is_default &&
        !name.includes("-mega") &&
        !name.includes("-gmax") &&
        !name.includes("power-construct") &&
        !name.includes("starter")
    );
});

const spanishEntry = speciesData.flavor_text_entries.find(
    item => item.language.name === "es"
);

const englishEntry = speciesData.flavor_text_entries.find(
    item => item.language.name === "en"
);

const entry = spanishEntry || englishEntry;

let curiosity = "No hay curiosidad disponible para este Pokémon.";

if (entry) {
    curiosity = entry.flavor_text
        .replace(/\n/g, " ")
        .replace(/\f/g, " ");
}

const pokemonTypes = data.types
    .map(typeInfo => `
        <span class="type-badge type-${typeInfo.type.name}">
            ${typeInfo.type.name}
        </span>
    `)
    .join("");

const megaButtonHTML = megaForms.length > 0
    ? `<button id="mega-btn" class="mega-btn form-button">M</button>`
    : "";

const formsButtonHTML = normalForms.length > 0
    ? `<button id="forms-btn" class="forms-btn form-button">F</button>`
    : "";

const gmaxButtonHTML = gmaxForms.length > 0
    ? `<button id="gmax-btn" class="gmax-btn form-button">G</button>`
    : "";
 pokemonCard.innerHTML = `
    <div class="pokemon-info">

        <div class="pokemon-header">
            <h2 id="pokemon-name">${data.name}</h2>

            <div class="pokemon-header-actions">
                <button id="favorite-btn" class="favorite-btn">
                    ${isFavorite(data.id) ? "★" : "☆"}
                </button>

                <span id="pokemon-number">
                    #${String(data.id).padStart(4, "0")}
                </span>
            </div>
        </div>

        <div class="pokemon-image-frame">
            <img
                id="pokemon-image"
                src="${baseSprites.normal}"
                alt="${data.name}"
                class="pokemon-image"
            >

            <button
                id="shiny-btn"
                class="shiny-btn form-button" 
                data-normal="${baseSprites.normal}"
                data-shiny="${baseSprites.shiny}"
            >
                ✨
            </button>
            ${megaButtonHTML}
            ${formsButtonHTML}
            ${gmaxButtonHTML}
            <p id="form-message" class="form-message"></p>
        </div>

        <div class="pokemon-details">
            <div class="types-row">
                <strong>Tipos:</strong>
                <div class="types-list">
                    ${pokemonTypes}
                </div>
            </div>
            <p><strong>Altura:</strong> ${data.height}</p>
            <p><strong>Peso:</strong> ${data.weight}</p>
            <div class="evolution-section">
                <p><strong>Evoluciones:</strong></p>
                <div id="evolution-chain" class="evolution-chain">
                    Cargando evoluciones...
                </div>
            </div>
            <div class="pokemon-stats">
                <p class="stats-title"><strong>Estadísticas base:</strong></p>
                <div id="stats-list">
                    ${renderStats(data)}
                </div>
            </div>

            <p class="curiosity-title"><strong>Curiosidad:</strong></p>
            <p class="curiosity-text">${curiosity}</p>
        </div>
    </div>
`;
pokemonCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
});

isShiny = false;

const shinyBtn = document.querySelector("#shiny-btn");
const pokemonImage = document.querySelector("#pokemon-image");
const pokemonNameTitle = document.querySelector("#pokemon-name");
const statsList = document.querySelector("#stats-list");
const favoriteBtn = document.querySelector("#favorite-btn");

favoriteBtn.addEventListener("click", () => {
    toggleFavorite(data);
    favoriteBtn.textContent = isFavorite(data.id) ? "★" : "☆";
});

shinyBtn.addEventListener("click", () => {
    isShiny = !isShiny;

    if (isShiny) {
        pokemonImage.src = shinyBtn.dataset.shiny;
        shinyBtn.textContent = "🔁";
    } else {
        pokemonImage.src = shinyBtn.dataset.normal;
        shinyBtn.textContent = "✨";
    }
});

const megaBtn = document.querySelector("#mega-btn");
const formMessage = document.querySelector("#form-message");
const formsBtn = document.querySelector("#forms-btn");
const gmaxBtn = document.querySelector("#gmax-btn");

if (megaBtn) {
    let megaIndex = 0;

    megaBtn.addEventListener("click", async () => {

        megaIndex++;

        if (megaIndex > megaForms.length) {

    updatePokemonDisplay(
        data,
        baseSprites,
        pokemonImage,
        pokemonNameTitle,
        statsList,
        shinyBtn
    );

            formMessage.textContent = "";
            megaIndex = 0;
            return;
        }

        const megaUrl = megaForms[megaIndex - 1].pokemon.url;
    try {
        const megaResponse = await fetch(megaUrl);

        if (!megaResponse.ok) {
            throw new Error("Mega no disponible");
        }

        const megaData = await megaResponse.json();
        const megaSprites = getSpriteSet(megaData);

        if (!megaSprites.normal) {
            throw new Error("Mega sin imagen disponible");
        }

    updatePokemonDisplay(
        megaData,
        megaSprites,
        pokemonImage,
        pokemonNameTitle,
        statsList,
        shinyBtn
    );

        formMessage.textContent = "";

    } catch (error) {
        formMessage.textContent = "Mega no disponible";
        console.error("Mega no disponible:", error);
    }
});
}

if (formsBtn) {

    let formIndex = 0;

    formsBtn.addEventListener("click", async () => {

        formIndex++;

        if (formIndex > normalForms.length) {

    updatePokemonDisplay(
        data,
        baseSprites,
        pokemonImage,
        pokemonNameTitle,
        statsList,
        shinyBtn
    );

            formIndex = 0;

            return;
        }

        try {

            const formUrl = normalForms[formIndex - 1].pokemon.url;
            const formResponse = await fetch(formUrl);

            if (!formResponse.ok) {
                throw new Error("Forma no disponible");
            }

            const formData = await formResponse.json();
            const formSprites = getSpriteSet(formData);

        updatePokemonDisplay(
            formData,
            formSprites,
            pokemonImage,
            pokemonNameTitle,
            statsList,
            shinyBtn
        );

        } catch (error) {
            console.error("Forma no disponible:", error);
        }
    });
}

if (gmaxBtn) {

    let gmaxIndex = 0;

    gmaxBtn.addEventListener("click", async () => {

        gmaxIndex++;

        if (gmaxIndex > gmaxForms.length) {

    updatePokemonDisplay(
        data,
        baseSprites,
        pokemonImage,
        pokemonNameTitle,
        statsList,
        shinyBtn
    );

            gmaxIndex = 0;

            return;
        }

        try {

            const gmaxUrl = gmaxForms[gmaxIndex - 1].pokemon.url;
            const gmaxResponse = await fetch(gmaxUrl);

            if (!gmaxResponse.ok) {
                throw new Error("Gigantamax no disponible");
            }

            const gmaxData = await gmaxResponse.json();
            const gmaxSprites = getSpriteSet(gmaxData);

            if (!gmaxSprites.normal) {
                throw new Error("Gigantamax sin imagen disponible");
            }

    updatePokemonDisplay(
        gmaxData,
        gmaxSprites,
        pokemonImage,
        pokemonNameTitle,
        statsList,
        shinyBtn
    );

        } catch (error) {
            console.error("Gigantamax no disponible:", error);
        }
    });
}

const evolutionChainElement =
    document.querySelector("#evolution-chain");

if (evolutionChainElement) {

    const evolutions = [];

    let currentEvolution = evolutionData.chain;

    while (currentEvolution) {

        evolutions.push(
            currentEvolution.species.name
        );

        currentEvolution =
            currentEvolution.evolves_to[0];
    }

const evolutionItems = await Promise.all(
    evolutions.map(async (pokemonName) => {

        let response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
        );

        let pokemon;

        if (response.ok) {
            pokemon = await response.json();
        } else {
            const speciesResponse = await fetch(
                `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
            );

            const species = await speciesResponse.json();

            const defaultVariety = species.varieties.find(
                variety => variety.is_default
            );

            const defaultPokemonResponse = await fetch(
                defaultVariety.pokemon.url
            );

            pokemon = await defaultPokemonResponse.json();
        }

        const sprites = getSpriteSet(pokemon);

        return `
            <button class="evolution-pokemon" data-pokemon="${pokemon.name}">
                <img src="${sprites.normal}" alt="${pokemon.name}">
                <span class="evolution-name">${pokemonName}</span>
            </button>
        `;
    })
);

evolutionChainElement.innerHTML =
    evolutionItems
        .map((item, index) => {
            const hasNext = index < evolutionItems.length - 1;

            return `
                <div class="evolution-step">
                    ${item}
                    ${hasNext ? '<span class="evolution-arrow">↘</span>' : ''}
                </div>
            `;
        })
        .join("");

evolutionChainElement.querySelectorAll(".evolution-pokemon").forEach(button => {
    button.addEventListener("click", () => {
        pokemonInput.value = button.dataset.pokemon;
        searchPokemon();
    });
});
}
pokemonInput.value = "";
pokemonInput.blur();

}    catch (error) {

        pokemonCard.innerHTML = `
            <p>Pokémon no encontrado.</p>
        `;

        console.error(error);
    }
}

function renderFavoritesList() {

    favoritesList.innerHTML = renderPokemonList(
        favorites,
        "favorite-item",
        "No hay favoritos todavía."
    );

}

function renderRecentList() {

    recentList.innerHTML = renderPokemonList(
        recentPokemon,
        "recent-item",
        "No hay Pokémon recientes todavía."
    );

}

function setupPokemonListClick(listElement) {

    listElement.addEventListener("click", (event) => {
        const item = event.target.closest("button");

        if (!item) {
            return;
        }

        pokemonInput.value = item.dataset.id;

        favoritesList.classList.add("hidden");
        recentList.classList.add("hidden");

        searchPokemon();
    });

}

searchBtn.addEventListener("click", searchPokemon);
pokemonInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        searchPokemon();
    }
});

randomBtn.addEventListener("click", () => {

    const randomPokemon =
        Math.floor(Math.random() * 1025) + 1;

    pokemonInput.value = randomPokemon;

    searchPokemon();

});

soundBtn.addEventListener("click", () => {
    if (!currentCry) {
        return;
    }

    const cry = new Audio(currentCry);
    cry.play();
});

favoritesToggleBtn.addEventListener("click", () => {
    renderFavoritesList();
    favoritesList.classList.toggle("hidden");
    recentList.classList.add("hidden");
});

recentToggleBtn.addEventListener("click", () => {
    renderRecentList();
    recentList.classList.toggle("hidden");
    favoritesList.classList.add("hidden");
});

setupPokemonListClick(favoritesList);
setupPokemonListClick(recentList);

window.addEventListener("load", () => {

    const splash = document.getElementById("splash-screen");

    setTimeout(() => {

        splash.classList.add("hidden");

        setTimeout(() => {
            splash.remove();
        }, 600);

    }, 2000);

});

const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");

if (aboutBtn && aboutModal && closeAboutBtn) {
    aboutBtn.addEventListener("click", () => {
        aboutModal.classList.remove("hidden");
    });

    closeAboutBtn.addEventListener("click", () => {
        aboutModal.classList.add("hidden");
    });

    aboutModal.addEventListener("click", (event) => {
        if (event.target === aboutModal) {
            aboutModal.classList.add("hidden");
        }
    });
}