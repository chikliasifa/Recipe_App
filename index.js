// -------------------------------------------------------------
// Enhanced Food Recipe Application  – fixed “Remove in Favorites”
// -------------------------------------------------------------
class RecipeApp {
  constructor() {
    /* ========== API CONFIG ========== */
    this.config = {
      app_id:  "e29608b5",
      app_key: "784a08fbd101193f7306943046a193fb",
      userId:  "AsifaShaik",
      baseUrl: "https://api.edamam.com/api/recipes/v2"
    };

    /* ========== DOM ELEMENTS ========== */
    this.elements = {
      searchBtn:          document.getElementById("searchBtn"),
      searchInput:        document.getElementById("searchInput"),
      recipesContainer:   document.getElementById("results"),
      favoritesSection:   document.getElementById("favoritesSection"),
      favoritesContainer: document.getElementById("favoritesContainer"),
      navbarHeartBtn:     document.querySelector(".navbar-heart"),
      closeFavoritesBtn:  document.getElementById("closeFavorites"),
      recipeModal:        document.getElementById("recipeModal"),
      modalBody:          document.getElementById("modalBody"),
      closeModalBtn:      document.getElementById("closeModal"),
      loadingSpinner:     document.getElementById("loadingSpinner"),
      errorMessage:       document.getElementById("errorMessage"),
      favoritesCount:     document.getElementById("favoritesCount"),
      backToTopBtn:       document.getElementById("backToTop")
    };

    /* ========== APP STATE ========== */
    this.state = {
      favorites:     {},
      currentQuery:  "",
      isLoading:     false,
      currentRecipes:[]
    };

    this.init();
  }

  /* ---------------------------------
     INITIALISATION
  ----------------------------------*/
  init() {
    this.loadFavoritesFromStorage();
    this.updateFavoritesCount();
    this.setupEventListeners();
    this.setupIntersectionObserver();
    this.fetchRecipes("popular");

    /* hide startup spinner after 1 s */
    setTimeout(() => this.hideLoading(), 1000);
  }

  /* ---------------------------------
     EVENT LISTENERS
  ----------------------------------*/
  setupEventListeners() {
    /* SEARCH */
    this.elements.searchBtn.addEventListener("click", () => this.handleSearch());
    this.elements.searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") this.handleSearch();
    });

    /* FAVOURITES */
    this.elements.navbarHeartBtn.addEventListener("click", () => this.toggleFavoritesSection());
    this.elements.closeFavoritesBtn.addEventListener("click", () => this.hideFavorites());

    /* MODAL */
    this.elements.closeModalBtn.addEventListener("click", () => this.hideModal());
    this.elements.recipeModal.addEventListener("click", e => {
      if (e.target === this.elements.recipeModal) this.hideModal();
    });

    /* ESC key – close modal / favourites */
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        this.hideModal();
        this.hideFavorites();
      }
    });

    /* SIDENAV / CATEGORY LINKS */
    this.setupSideNavDropdowns();
    this.setupCategoryNavigation();

    /* BACK‑TO‑TOP */
    this.elements.backToTopBtn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        this.elements.backToTopBtn.classList.add("visible");
      } else {
        this.elements.backToTopBtn.classList.remove("visible");
      }
    });
  }

  /* ---------------------------------
     SIDENAV HELPERS
  ----------------------------------*/
  setupSideNavDropdowns() {
    document.querySelectorAll(".side-dropdown > button").forEach(btn => {
      btn.addEventListener("click", () => {
        const dropdown = btn.parentElement;
        const isActive = dropdown.classList.contains("active");

        /* close all */
        document.querySelectorAll(".side-dropdown").forEach(d => {
          d.classList.remove("active");
          d.querySelector("button").setAttribute("aria-expanded", "false");
        });

        if (!isActive) {
          dropdown.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  setupCategoryNavigation() {
    document.querySelectorAll("[data-search]").forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        const query = e.target.getAttribute("data-search");
        if (query) {
          this.fetchRecipes(query);
          this.hideFavorites();
          this.closeSidebar();
          this.elements.searchInput.value = query;
        }
      });
    });
  }

  closeSidebar() {
    document.querySelector(".side-navbar")?.classList.remove("show-sidebar");
  }

  /* ---------------------------------
     SEARCH
  ----------------------------------*/
  handleSearch() {
    const query = this.elements.searchInput.value.trim();
    if (query) {
      this.fetchRecipes(query);
      this.hideFavorites();
    } else {
      this.showError("Please enter a search term");
    }
  }

  /* ---------------------------------
     LOADING / ERROR HANDLING
  ----------------------------------*/
  showLoading()  { this.state.isLoading = true;  this.elements.loadingSpinner.style.display = "flex"; }
  hideLoading()  { this.state.isLoading = false; this.elements.loadingSpinner.style.display = "none"; }

  showError(message) {
    this.elements.errorMessage.querySelector("p").textContent = message;
    this.elements.errorMessage.style.display = "block";
    setTimeout(() => (this.elements.errorMessage.style.display = "none"), 5000);
  }

  /* ---------------------------------
     API CALL
  ----------------------------------*/
  async fetchRecipes(query) {
    if (this.state.isLoading) return;

    this.showLoading();
    this.state.currentQuery = query;

    const url = `${this.config.baseUrl}?type=public&q=${encodeURIComponent(query)}&app_id=${this.config.app_id}&app_key=${this.config.app_key}&random=true`;

    try {
      const response = await fetch(url, {
        headers: { "Edamam-Account-User": this.config.userId }
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      this.state.currentRecipes = data.hits ?? [];
      this.displayRecipes(this.state.currentRecipes);
    } catch (err) {
      console.error(err);
      this.showError("Failed to load recipes. Please try again.");
      this.elements.recipesContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem">
          <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--primary-color)"></i>
          <h3 style="color:white;margin:1rem 0">Oops! Something went wrong</h3>
          <button onclick="window.recipeApp.fetchRecipes('${query}')"
                  style="background:var(--primary-color);color:white;border:none;padding:.75rem 1.5rem;border-radius:25px;cursor:pointer">
            Try Again
          </button>
        </div>`;
    } finally {
      this.hideLoading();
    }
  }

  /* ---------------------------------
     DISPLAY RESULTS
  ----------------------------------*/
  displayRecipes(hits) {
    this.elements.recipesContainer.innerHTML = "";

    if (!hits || hits.length === 0) {
      this.elements.recipesContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:white">
          <i class="fas fa-search" style="font-size:3rem;color:var(--primary-color)"></i>
          <h3 style="margin:1rem 0">No recipes found</h3>
          <p style="opacity:.8">Try another search or browse categories.</p>
        </div>`;
      return;
    }

    hits.forEach(({ recipe }, idx) => {
      const card = this.createRecipeCard(recipe, idx);
      this.elements.recipesContainer.appendChild(card);

      /* animate with IntersectionObserver */
      if (this.observer) {
        card.style.opacity   = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition= "opacity .6s ease, transform .6s ease";
        this.observer.observe(card);
      }
    });
  }

  /* ---------------------------------
     RECIPE CARD  (no data-attribute)
  ----------------------------------*/
  createRecipeCard(recipe, index) {
    const card = document.createElement("div");
    card.className         = "recipe";
    card.style.animationDelay = `${index * 0.1}s`;

    const isFav       = !!this.state.favorites[recipe.uri];
    const shortLabel  = recipe.label.length > 50 ? recipe.label.slice(0, 50) + "…" : recipe.label;

    card.innerHTML = `
      <div class="thumb">
        <img src="${recipe.image}" alt="${recipe.label}" loading="lazy">
        <div class="time-tag">
          <i class="fas fa-clock"></i> ${Math.round(recipe.totalTime) || 30} min
        </div>
      </div>

      <div class="content">
        <h3 title="${recipe.label}">${shortLabel}</h3>

        <div class="meta">
          <span class="cal"><i class="fas fa-fire"></i> ${Math.round(recipe.calories)} cal</span>
          ${recipe.dietLabels.slice(0, 2).map(l => `<span class="diet">${l}</span>`).join("")}
        </div>

        <div class="buttons">
          <button class="know-more-btn"><i class="fas fa-info-circle"></i> Know More</button>
          <button class="favorite-btn ${isFav ? "favorited" : ""}">
            <i class="fas fa-heart"></i> ${isFav ? "Remove" : "Add"}
          </button>
        </div>
      </div>`;

    /* LISTENERS */
    const favBtn  = card.querySelector(".favorite-btn");
    const moreBtn = card.querySelector(".know-more-btn");

    favBtn.addEventListener("click", e => {
      e.stopPropagation();
      this.toggleFavorite(recipe, favBtn);
    });

    moreBtn.addEventListener("click", e => {
      e.stopPropagation();
      this.showRecipeModal(recipe);
    });

    card.addEventListener("click", () => this.showRecipeModal(recipe));

    return card;
  }

  /* ---------------------------------
     FAVOURITES TOGGLE  (fixed)
  ----------------------------------*/
  toggleFavorite(recipe, button) {
    const uri  = recipe.uri;
    const icon = button.querySelector("i");

    /* pop animation */
    icon.style.transform = "scale(1.3)";
    setTimeout(() => (icon.style.transform = "scale(1)"), 200);

    const card    = button.closest(".recipe");
    const inFav   = card && card.closest("#favoritesContainer"); // true when inside favourites page

    /* REMOVE */
    if (this.state.favorites[uri]) {
      delete this.state.favorites[uri];
      button.innerHTML = '<i class="fas fa-heart"></i> Add';
      button.classList.remove("favorited");

      /* fade out card if we're currently in the favourites pane */
      if (inFav) {
        card.style.animation = "fadeOut .3s ease-out both";
        setTimeout(() => card.remove(), 300);

        /* if list empty, re-render “No favourites yet” */
        if (Object.keys(this.state.favorites).length === 0) {
          setTimeout(() => this.showFavorites(), 310);
        }
      }
    }
    /* ADD */
    else {
      this.state.favorites[uri] = recipe;
      button.innerHTML = '<i class="fas fa-heart"></i> Remove';
      button.classList.add("favorited");
    }

    this.saveFavoritesToStorage();
    this.updateFavoritesCount();
  }

  updateFavoritesCount() {
    const count = Object.keys(this.state.favorites).length;
    this.elements.favoritesCount.textContent = count;
    this.elements.favoritesCount.style.display = count ? "flex" : "none";
  }

  /* ---------------------------------
     FAVOURITES SECTION  (duplicate listener removed)
  ----------------------------------*/
  toggleFavoritesSection() {
    if (this.elements.favoritesSection.style.display === "block") {
      this.hideFavorites();
    } else {
      this.showFavorites();
    }
  }

  showFavorites() {
    this.elements.recipesContainer.style.display   = "none";
    this.elements.favoritesSection.style.display   = "block";
    this.elements.favoritesContainer.innerHTML     = "";

    const favRecipes = Object.values(this.state.favorites);

    if (favRecipes.length === 0) {
      this.elements.favoritesContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:white">
          <i class="fas fa-heart-broken" style="font-size:4rem;color:var(--primary-color);opacity:.5"></i>
          <h3 style="margin:1rem 0;font-family:var(--font-display)">No favorites yet!</h3>
          <button onclick="window.recipeApp.hideFavorites();window.recipeApp.fetchRecipes('popular')"
                  style="background:var(--primary-color);color:white;border:none;padding:.75rem 2rem;border-radius:25px;cursor:pointer">
            <i class="fas fa-search"></i> Explore Recipes
          </button>
        </div>`;
      return;
    }

    favRecipes.forEach((r, i) =>
      this.elements.favoritesContainer.appendChild(this.createRecipeCard(r, i))
    );
  }

  hideFavorites() {
    this.elements.favoritesSection.style.display = "none";
    this.elements.recipesContainer.style.display = "grid";
  }

  /* ---------------------------------
     MODAL
  ----------------------------------*/
  showRecipeModal(recipe) {
    const ingredients = recipe.ingredientLines.map(l => `<li>${l}</li>`).join("");

    /* Optional nutrition block */
    const n = recipe.totalNutrients;
    const nutrition = n ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1rem 0;padding:1rem;background:rgba(255,99,71,.05);border-radius:8px">
        ${n.ENERC_KCAL ? `<div><strong>Calories:</strong><br>${Math.round(n.ENERC_KCAL.quantity)} kcal</div>` : ""}
        ${n.PROCNT     ? `<div><strong>Protein:</strong><br>${Math.round(n.PROCNT.quantity)} g</div>` : ""}
        ${n.FAT        ? `<div><strong>Fat:</strong><br>${Math.round(n.FAT.quantity)} g</div>` : ""}
        ${n.CHOCDF     ? `<div><strong>Carbs:</strong><br>${Math.round(n.CHOCDF.quantity)} g</div>` : ""}
      </div>` : "";

    this.elements.modalBody.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.label}">
      <div style="margin-bottom:1.5rem">
        <span style="background:var(--primary-color);color:white;padding:.5rem 1rem;border-radius:20px;font-size:.9rem;display:inline-block;margin-right:.5rem">
          <i class="fas fa-clock"></i> ${Math.round(recipe.totalTime)||30} min
        </span>
        <span style="background:#4CAF50;color:white;padding:.5rem 1rem;border-radius:20px;font-size:.9rem;display:inline-block">
          <i class="fas fa-users"></i> ${recipe.yield} servings
        </span>
      </div>
      ${nutrition}
      <h3><i class="fas fa-list"></i> Ingredients</h3>
      <ul style="margin-bottom:1.5rem;padding-left:1.25rem">${ingredients}</ul>
      <div style="text-align:center">
        <a href="${recipe.url}" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt"></i> View Full Recipe & Instructions
        </a>
      </div>`;

    this.elements.recipeModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  hideModal() {
    this.elements.recipeModal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  /* ---------------------------------
     STORAGE
  ----------------------------------*/
  saveFavoritesToStorage() {
    try { localStorage.setItem("recipeAppFavorites", JSON.stringify(this.state.favorites)); }
    catch (e) { console.error(e); this.showError("Unable to save favorites."); }
  }

  loadFavoritesFromStorage() {
    try {
      const stored = localStorage.getItem("recipeAppFavorites");
      if (stored) this.state.favorites = JSON.parse(stored);
    } catch (e) {
      console.error(e);
      this.state.favorites = {};
    }
  }

  /* ---------------------------------
     INTERSECTION OBSERVER
  ----------------------------------*/
  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      entries => entries.forEach(ent => {
        if (ent.isIntersecting) {
          ent.target.style.opacity   = "1";
          ent.target.style.transform = "translateY(0)";
        }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
  }
}

/* ========== BOOTSTRAP APP ========== */
window.addEventListener("DOMContentLoaded", () => {
  window.recipeApp = new RecipeApp();
});

/* fadeOut keyframes for card removal */
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.8)} }
`;
document.head.appendChild(style);

/* PWA Service Worker (optional) */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(r => console.log("SW registered:", r))
      .catch(e => console.log("SW registration failed:", e));
  });
}
