const pokemonInput = document.querySelector("#pokemon-input");
const searchBtn = document.querySelector("#search-btn");
const pokemonCard = document.querySelector("#pokemon-card");

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
const speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`
);

const speciesData = await speciesResponse.json();
const entry = speciesData.flavor_text_entries.find(
    item => item.language.name === "es"
);

const curiosity = entry.flavor_text
    .replace(/\n/g, " ")
    .replace(/\f/g, " ");
console.log(curiosity);

const pokemonTypes = data.types
    .map(typeInfo => typeInfo.type.name)
    .join(", ");
 pokemonCard.innerHTML = `
        <div class="pokemon-info">
            <img src="${data.sprites.front_default}" alt="${data.name}">

            <h2>${data.name}</h2>

            <p><strong>Tipos:</strong> Tipo: ${pokemonTypes}</p>

            <p><strong>Altura:</strong> ${data.height}</p>

            <p><strong>Peso:</strong> ${data.weight}</p>

            <p><strong>Curiosidad:</strong></p>

            <p>${curiosity}</p>
        </div>
    `;

    } catch (error) {

        pokemonCard.innerHTML = `
            <p>Pokémon no encontrado.</p>
        `;

        console.error(error);
    }
}

searchBtn.addEventListener("click", searchPokemon);