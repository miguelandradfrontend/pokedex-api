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

async function searchPokemon() {
    const pokemonName = pokemonInput.value.toLowerCase().trim();

    if (pokemonName === "") {
        pokemonCard.innerHTML = "<p>Escribe un nombre o número de Pokémon.</p>";
        return;
    }

    try {

const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
);

if (!response.ok) {
    throw new Error("Pokémon no encontrado");
}

const data = await response.json();
const baseSprites = getSpriteSet(data);
currentCry = data.cries.latest;
const speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
);

const speciesData = await speciesResponse.json();
const megaForms = speciesData.varieties.filter(
    variety => variety.pokemon.name.includes("-mega")
);

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
 pokemonCard.innerHTML = `
    <div class="pokemon-info">

        <div class="pokemon-header">
            <h2>${data.name}</h2>
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
            <p id="form-message" class="form-message"></p>
        </div>

        <div class="pokemon-details">
            <p><strong>Tipos:</strong> ${pokemonTypes}</p>
            <p><strong>Altura:</strong> ${data.height}</p>
            <p><strong>Peso:</strong> ${data.weight}</p>

            <p class="curiosity-title"><strong>Curiosidad:</strong></p>
            <p class="curiosity-text">${curiosity}</p>
        </div>

    </div>
`;

isShiny = false;

const shinyBtn = document.querySelector("#shiny-btn");
const pokemonImage = document.querySelector("#pokemon-image");

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

if (megaBtn) {
    let megaIndex = 0;

    megaBtn.addEventListener("click", async () => {

        megaIndex++;

        if (megaIndex > megaForms.length) {

            pokemonImage.src = baseSprites.normal;

            shinyBtn.dataset.normal = baseSprites.normal;
            shinyBtn.dataset.shiny = baseSprites.shiny;

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