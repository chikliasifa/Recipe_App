const app_id = "e29608b5";
const app_key = "784a08fbd101193f7306943046a193fb";
const userId = "AsifaShaik";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const recipesContainer = document.getElementById("results");
const favoritesSection = document.getElementById("favoritesSection");
const favoritesContainer = document.getElementById("favoritesContainer");
const navbarHeartBtn = document.querySelector(".navbar-heart");
const closeFavoritesBtn = document.getElementById("closeFavorites");
const recipeModal = document.getElementById("recipeModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModal");

let favorites = {};

// Load favorites from localStorage on page load
window.addEventListener("DOMContentLoaded", () => {
  loadFavoritesFromStorage();
  fetchRecipes("popular");
});

// Search button click event
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchRecipes(query);
    hideFavorites();
  }
});

// Navbar heart icon click toggles favorites section
navbarHeartBtn.addEventListener("click", () => {
  if (favoritesSection.style.display === "block") {
    hideFavorites();
  } else {
    showFavorites();
  }
});

// Close favorites button
closeFavoritesBtn.addEventListener("click", hideFavorites);

// Close modal button
closeModalBtn.addEventListener("click", () => {
  recipeModal.style.display = "none";
});

// Fetch recipes from Edamam API
async function fetchRecipes(query) {
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${app_id}&app_key=${app_key}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Edamam-Account-User": userId,
      },
    });
    if (!res.ok) throw new Error("Network error");

    const data = await res.json();
    displayRecipes(data.hits);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    recipesContainer.innerHTML = "<p>Failed to load recipes. Please try again later.</p>";
  }
}

// Display fetched recipes in grid
function displayRecipes(hits) {
  recipesContainer.innerHTML = "";
  if (!hits || hits.length === 0) {
    recipesContainer.innerHTML = "<p>No recipes found. Please try another search term.</p>";
    return;
  }

  hits.forEach(({ recipe }) => {
    const card = document.createElement("div");
    card.className = "recipe";
    const encodedRecipe = encodeURIComponent(JSON.stringify(recipe));
    const isFav = favorites[recipe.uri];

    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.label}" style="width: 100%; max-height: 350px; object-fit: cover; border-radius: 12px;"/>
      <div class="content">
        <h3>${recipe.label}</h3>
        <div class="buttons">
          <button class="card-btn know-more-btn" data-recipe="${encodedRecipe}">Know More</button>
          <button class="favorite-btn" data-uri="${recipe.uri}">${isFav ? 'Remove ' : 'Add'}</button>
        </div>
      </div>`;

    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", () => toggleFavorite(recipe, favBtn));

    const knowMoreBtn = card.querySelector(".know-more-btn");
    knowMoreBtn.addEventListener("click", () => showRecipeModal(recipe));

    recipesContainer.appendChild(card);
  });
}

// Toggle favorite recipes and save to localStorage
function toggleFavorite(recipe, button) {
  const uri = recipe.uri;
  if (favorites[uri]) {
    delete favorites[uri];
    button.textContent = "Add";
  } else {
    favorites[uri] = recipe;
    button.textContent = "Remove";
  }
  saveFavoritesToStorage();
}

// Show favorites section with favorite recipes
function showFavorites() {
  recipesContainer.style.display = "none";
  favoritesSection.style.display = "block";
  favoritesContainer.innerHTML = "";

  const favRecipes = Object.values(favorites);
  if (favRecipes.length === 0) {
    favoritesContainer.innerHTML = "<p>No favorite recipes yet. Add some from the search results!</p>";
    return;
  }

  favRecipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe";
    const encodedRecipe = encodeURIComponent(JSON.stringify(recipe));

    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.label}" style="width: 100%; object-fit: cover; border-radius: 12px;"/>
      <div class="content">
        <h3>${recipe.label}</h3>
        <div class="buttons">
          <button class="card-btn know-more-btn" data-recipe="${encodedRecipe}">Know More</button>
          <button class="favorite-btn" data-uri="${recipe.uri}">Remove</button>
        </div>
      </div>`;

    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", () => {
      toggleFavorite(recipe, favBtn);
      if (!favorites[recipe.uri]) card.remove();
      if (Object.keys(favorites).length === 0) {
        favoritesContainer.innerHTML = "<p>No favorite recipes yet. Add some from the search results!</p>";
      }
    });

    const knowMoreBtn = card.querySelector(".know-more-btn");
    knowMoreBtn.addEventListener("click", () => showRecipeModal(recipe));

    favoritesContainer.appendChild(card);
  });
}

// Hide favorites section and show search results
function hideFavorites() {
  favoritesSection.style.display = "none";
  recipesContainer.style.display = "grid";
}

// Save favorites to localStorage
function saveFavoritesToStorage() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

// Load favorites from localStorage
function loadFavoritesFromStorage() {
  const stored = localStorage.getItem("favorites");
  if (stored) {
    favorites = JSON.parse(stored);
  }
}

// Show recipe details modal
function showRecipeModal(recipe) {
  modalBody.innerHTML = `
    <button onclick="document.getElementById('recipeModal').style.display='none'" style="margin-bottom: 10px; padding: 6px 12px; background: #0a192f; color: white; border: none; border-radius: 6px;">← Back</button>
    <h2>${recipe.label}</h2>
    <img src="${recipe.image}" alt="${recipe.label}" style="width:100%; border-radius: 10px; margin-bottom: 10px;" />
    <p><strong>Calories:</strong> ${Math.round(recipe.calories)}</p>
    <p><strong>Diet Labels:</strong> ${recipe.dietLabels.join(", ") || "N/A"}</p>
    <p><strong>Health Labels:</strong> ${recipe.healthLabels.join(", ")}</p>
    <h3>Ingredients:</h3>
    <ul>
      ${recipe.ingredientLines.map(line => `<li>${line}</li>`).join("")}
    </ul>
    <a href="${recipe.url}" target="_blank" rel="noopener noreferrer">Full Recipe Link</a>
  `;
  recipeModal.style.display = "flex";
  recipeModal.scrollTop = 0;
}

// Side navbar dropdown toggle
document.querySelectorAll(".side-dropdown > button").forEach(btn => {
  btn.addEventListener("click", () => {
    const content = btn.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
  });
});

// Dropdown menu links search (both nav and side nav)
document.querySelectorAll("nav .dropdown-content a, aside .side-dropdown-content a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    const query = e.target.getAttribute("data-search");
    if (query) {
      fetchRecipes(query);
      hideFavorites();
    }
  });
});
