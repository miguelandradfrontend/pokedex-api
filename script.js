const pokemonInput = document.querySelector("#pokemon-input");
const searchBtn = document.querySelector("#search-btn");
const pokemonCard = document.querySelector("#pokemon-card");
const randomBtn = document.querySelector("#random-btn");
const soundBtn = document.querySelector("#sound-btn");

let isShiny = false;
let currentCry = "";

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
currentCry = data.cries.latest;
const speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
);

const speciesData = await speciesResponse.json();
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
 pokemonCard.innerHTML = `
    <div class="pokemon-info">

        <div class="pokemon-header">
            <h2>${data.name}</h2>
        </div>

        <div class="pokemon-image-frame">
            <img
                id="pokemon-image"
                src="${data.sprites.front_default}"
                alt="${data.name}"
                class="pokemon-image"
            >

            <button
                id="shiny-btn"
                class="shiny-btn"
                data-normal="${data.sprites.front_default}"
                data-shiny="${data.sprites.front_shiny}"
            >
                ✨
            </button>
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

pokemonInput.value = "";
pokemonInput.focus();

    } catch (error) {

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