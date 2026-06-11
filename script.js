const pokemonInput = document.querySelector("#pokemon-input");
const searchBtn = document.querySelector("#search-btn");
const pokemonCard = document.querySelector("#pokemon-card");
const randomBtn = document.querySelector("#random-btn");
const soundBtn = document.querySelector("#sound-btn");

let isShiny = false;
let currentCry = "";

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
    return pokemonData.stats.map(statInfo => `
        <div class="stat-row">
            <span class="stat-name">${statInfo.stat.name}</span>
            <span class="stat-value">${statInfo.base_stat}</span>
        </div>
    `).join("");
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
currentCry = data.cries.latest;
const speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
);

const speciesData = await speciesResponse.json();
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
    .map(typeInfo => typeInfo.type.name)
    .join(", ");

const megaButtonHTML = megaForms.length > 0
    ? `<button id="mega-btn" class="mega-btn">M</button>`
    : "";

const formsButtonHTML = normalForms.length > 0
    ? `<button id="forms-btn" class="forms-btn">F</button>`
    : "";

const gmaxButtonHTML = gmaxForms.length > 0
    ? `<button id="gmax-btn" class="gmax-btn">G</button>`
    : "";
 pokemonCard.innerHTML = `
    <div class="pokemon-info">

        <div class="pokemon-header">
            <h2 id="pokemon-name">${data.name}</h2>
            <span id="pokemon-number">
                #${String(data.id).padStart(4, "0")}
            </span>
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
                class="shiny-btn"
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
            <p><strong>Tipos:</strong> ${pokemonTypes}</p>
            <p><strong>Altura:</strong> ${data.height}</p>
            <p><strong>Peso:</strong> ${data.weight}</p>
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

isShiny = false;

const shinyBtn = document.querySelector("#shiny-btn");
const pokemonImage = document.querySelector("#pokemon-image");
const pokemonNameTitle = document.querySelector("#pokemon-name");
const statsList = document.querySelector("#stats-list");

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

            pokemonImage.src = baseSprites.normal;
            pokemonNameTitle.textContent = data.name;

            shinyBtn.dataset.normal = baseSprites.normal;
            shinyBtn.dataset.shiny = baseSprites.shiny;
            statsList.innerHTML = renderStats(data);

            isShiny = false;
            shinyBtn.textContent = "✨";

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

        pokemonImage.src = megaSprites.normal;
        pokemonNameTitle.textContent = megaData.name;
        statsList.innerHTML = renderStats(megaData);

        shinyBtn.dataset.normal = megaSprites.normal;
        shinyBtn.dataset.shiny = megaSprites.shiny;

        isShiny = false;
        shinyBtn.textContent = "✨";

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

            pokemonImage.src = baseSprites.normal;

            shinyBtn.dataset.normal = baseSprites.normal;
            shinyBtn.dataset.shiny = baseSprites.shiny;

            pokemonNameTitle.textContent = data.name;
            statsList.innerHTML = renderStats(data);

            isShiny = false;
            shinyBtn.textContent = "✨";

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

            pokemonImage.src = formSprites.normal;

            shinyBtn.dataset.normal = formSprites.normal;
            shinyBtn.dataset.shiny = formSprites.shiny;

            pokemonNameTitle.textContent = formData.name;
            statsList.innerHTML = renderStats(formData);

            isShiny = false;
            shinyBtn.textContent = "✨";

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

            pokemonImage.src = baseSprites.normal;

            shinyBtn.dataset.normal = baseSprites.normal;
            shinyBtn.dataset.shiny = baseSprites.shiny;

            pokemonNameTitle.textContent = data.name;
            statsList.innerHTML = renderStats(data);

            isShiny = false;
            shinyBtn.textContent = "✨";

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

            pokemonImage.src = gmaxSprites.normal;

            shinyBtn.dataset.normal = gmaxSprites.normal;
            shinyBtn.dataset.shiny = gmaxSprites.shiny;

            pokemonNameTitle.textContent = gmaxData.name;
            statsList.innerHTML = renderStats(gmaxData);
            isShiny = false;
            shinyBtn.textContent = "✨";

        } catch (error) {
            console.error("Gigantamax no disponible:", error);
        }
    });
}

pokemonInput.value = "";
pokemonInput.focus();

}    catch (error) {

        pokemonCard.innerHTML = `
            <p>Pokémon no encontrado.</p>
        `;

        console.error(error);
    }
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