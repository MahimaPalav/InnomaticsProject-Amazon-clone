const CURRENT_USER_KEY = "amazon_clone_current_user";
const USERS_KEY = "amazon_clone_users";
const accountNav = document.getElementById("accountNav");

function updateAccountNav() {
  if (!accountNav) return;

  const currentIdentifier = localStorage.getItem(CURRENT_USER_KEY);
  if (!currentIdentifier) {
    accountNav.innerHTML = `<p>Hello, sign in</p><h4>Account & Lists</h4>`;
    return;
  }

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch (err) {
    users = [];
  }

  const user = users.find(
    (u) => u.email.toLowerCase() === currentIdentifier.toLowerCase(),
  );
  const displayName =
    user && user.name ? user.name.split(" ")[0] : currentIdentifier;

  accountNav.innerHTML = `<p>Hello, ${displayName}</p><h4>Account & Lists</h4>`;
}

updateAccountNav();

const CART_KEY = "amazon_clone_cart";
const cartCountEl = document.getElementById("cartCount");

function updateCartCount() {
  if (!cartCountEl) return;

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (err) {
    cart = [];
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCountEl.textContent = totalItems;
}

updateCartCount();

let searchIndex = [];

function addToSearchIndex(items) {
  searchIndex = searchIndex.concat(items);
}

const homeContent = document.getElementById("homeContent");
const searchResultsSection = document.getElementById("searchResultsSection");
const categorySelect = document.getElementById("categorySelect");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

function normalizeText(text) {
  return (text || "").toString().toLowerCase();
}

function keywordMatches(keyword, term) {
  if (!term) return true;
  return normalizeText(keyword).includes(normalizeText(term));
}

function itemMatches(item, category, query) {
  const categoryOk =
    category === "All" || keywordMatches(item.keyword, category);

  if (!categoryOk) return false;
  if (!query) return true;

  const haystack = normalizeText(item.title);
  return haystack.includes(normalizeText(query));
}

function renderSearchResults(category, query) {
  const results = searchIndex.filter((item) =>
    itemMatches(item, category, query),
  );

  if (results.length === 0) {
    searchResultsSection.innerHTML = `
      <div class="search-results-header">
        <h2>No results found</h2>
        <p>Try a different search term or category.</p>
      </div>
    `;
  } else {
    searchResultsSection.innerHTML = `
      <div class="search-results-header">
        <h2>${results.length} result${results.length === 1 ? "" : "s"}${query ? ` for "${query}"` : ""
      }${category !== "All" ? ` in ${category}` : ""}</h2>
      </div>
      <div class="search-results-grid">
        ${results
        .map(
          (item) => `
            <a href="${item.link || "#"}" class="search-result-card">
              <img src="${item.image}" alt="${item.name || ""}">
              <span class="search-result-name">${item.name || ""}</span>
              ${item.price
              ? `<span class="search-result-price">${item.price}</span>`
              : ""
            }
            </a>
          `,
        )
        .join("")}
      </div>
    `;
  }

  homeContent.style.display = "none";
  searchResultsSection.style.display = "block";
}

function clearSearch() {
  searchInput.value = "";
  categorySelect.value = "All";
  searchResultsSection.style.display = "none";
  homeContent.style.display = "";
}

function runSearch() {
  const category = categorySelect.value;
  const query = searchInput.value.trim();

  if (category === "All" && query === "") {
    clearSearch();
    return;
  }

  renderSearchResults(category, query);
}

searchButton.addEventListener("click", runSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    runSearch();
  }
});

document.querySelector(".nav-logo").addEventListener("click", clearSearch);

// banner section
const carouselInner = document.getElementById("bannerCarouselInner");

fetch("./data/banner-imgs.json")
  .then((response) => response.json())
  .then((bannerImages) => {
    carouselInner.innerHTML = bannerImages
      .map(
        (banner, index) => `
          <div class="carousel-item ${index === 0 ? "active" : ""}">
            <img src="${banner.image}" class="d-block w-100" alt="${banner.title}">
          </div>
        `,
      )
      .join("");
  })
  .catch((error) => {
    console.error("Unable to load banner images:", error);
    carouselInner.innerHTML = `
      <div class="carousel-item active">
        <img src="./images/amazon-banner-backup.jpg" class="d-block w-100" alt="Amazon banner">
      </div>
    `;
  });

// banner deal section
const bannerDealSection = document.getElementById("banner-deal-section");

fetch("./data/square-card-data.json")
  .then((response) => response.json())
  .then((bannerDeals) => {
    addToSearchIndex(
      bannerDeals.flatMap((deal) =>
        deal.items
          .filter((item) => item.title && item.title.trim() !== "")
          .map((item) => ({
            name: item.name,
            title: item.title,
            image: item.image,
            keyword: deal.keyword,
            link: item.redirect_url,
          })),
      ),
    );

    bannerDealSection.innerHTML = bannerDeals
      .slice(0, 8)
      .map((deal) => {
        const hasEmptyItemName = deal.items.some((item) => item.name === "");
        return `
      <div class="deal-container">
            <h3>${deal.title}</h3>
            <div class="img-grid-container">
                ${deal.items
            .map(
              (item) => `
                    <a href="${item.redirect_url || "#"}" class="grid-img-details">
                        <img src="${item.image}" alt="${item.name}">
                        <span class="img-title">${item.name}</span>
                    </a>
                `,
            )
            .join("")}
            </div>
            ${hasEmptyItemName
            ? ""
            : `<a class="see-more" href="#">See more</a>`
          }
        </div>
      `;
      })
      .join("");
  });

// rectangle carousel section
const carousel1 = document.getElementById("carousel-card-container1");
const carousel2 = document.getElementById("carousel-card-container2");
const carousel3 = document.getElementById("carousel-card-container3");
const carousel4 = document.getElementById("carousel-card-container4");
fetchCarouselData(carousel1, [1, 2]); //carousel 1 and 2
fetchCarouselData(carousel2, [3, 4]); //carousel 3 and 4
fetchCarouselData(carousel3, [5]); //carousel 5
fetchCarouselData(carousel4, [6]); //carousel 6

function fetchCarouselData(container, filterIds) {
  fetch("./data/carousel-data.json")
    .then((response) => response.json())
    .then((carouselData) => {
      const matchingCarousels = carouselData.filter((carousel) =>
        filterIds.includes(carousel.id),
      );

      addToSearchIndex(
        matchingCarousels.flatMap((carousel) =>
          carousel.items
            .filter((item) => item.title && item.title.trim() !== "")
            .map((item) => ({
              name: item.name,
              title: item.title,
              image: item.image,
              keyword: carousel.keyword,
            })),
        ),
      );

      container.innerHTML = matchingCarousels
        .map(
          (
            carousel,
            index,
          ) => `<div id="carousel-card-${index}" class="carousel-card">
        <button class="prev-carousel">
          <span class="material-symbols-rounded">arrow_back_ios_new</span>
        </button>
            <h3>${carousel.title}</h3>
            <div class="furniture-container">
            ${carousel.items
              .map((item) => `<img src="${item.image}" alt="${item.title}">`)
              .join("")}
            </div>
            <button class="next-carousel">
              <span class="material-symbols-rounded">arrow_forward_ios</span>
            </button>
        </div>

        `,
        )
        .join("");

      document.querySelectorAll(".carousel-card").forEach((card) => {
        const container = card.querySelector(".furniture-container");
        const prev = card.querySelector(".prev-carousel");
        const next = card.querySelector(".next-carousel");

        function updateButtons() {
          if (container.scrollLeft <= 0) {
            prev.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          } else {
            prev.style.backgroundColor = "rgba(255, 255, 255, 1)";
          }
          if (
            container.scrollLeft + container.clientWidth >=
            container.scrollWidth - 2
          ) {
            next.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          } else {
            next.style.backgroundColor = "rgba(255, 255, 255, 1)";
          }
        }

        next.addEventListener("click", () => {
          container.scrollBy({
            left: 600,
            behavior: "smooth",
          });
        });

        prev.addEventListener("click", () => {
          container.scrollBy({
            left: -600,
            behavior: "smooth",
          });
        });

        container.addEventListener("scroll", updateButtons);

        updateButtons();
      });
    });
}

const squareCardContainer = document.getElementById("square-cards-container");

fetch("./data/square-card-data.json")
  .then((response) => response.json())
  .then((squareCardImgs) => {
    const lastFour = squareCardImgs.slice(-4);

    squareCardContainer.innerHTML = lastFour
      .map(
        (squareCard) => `
        <div class="square-card">
          <h3>${squareCard.title}</h3>
          <div class="square-grid">
          ${squareCard.items
            .map((item) => `<img src="${item.image}" alt="" />`)
            .join("")}
          </div>
        </div>`,
      )
      .join("");
  })
  .catch((err) => console.error("Failed to load square card data:", err));

// slider card carousel
const sliderCarousel1 = document.getElementById(
  "square-slider-carousel-container1",
);

const sliderCarousel2 = document.getElementById(
  "square-slider-carousel-container2",
);

fetchSliderCarouselData(sliderCarousel1, [1, 2, 3, 4]); //slider cards 1 2 3 4

fetchSliderCarouselData(sliderCarousel2, [5, 6, 7, 8]); //slider cards 5 6 7 8

function fetchSliderCarouselData(container, filterIds) {
  fetch("./data/slider-square-card.json")
    .then((response) => response.json())
    .then((sliderImages) => {
      const matchingSliders = sliderImages.filter((carousel) =>
        filterIds.includes(carousel.id),
      );

      addToSearchIndex(
        matchingSliders.flatMap((slider) =>
          slider.items
            .filter((item) => item.title && item.title.trim() !== "")
            .map((item) => ({
              name: item.title,
              image: item.image,
              keyword: slider.keyword,
              price: slider.price,
            })),
        ),
      );

      container.innerHTML = matchingSliders
        .map(
          (slider, index) =>
            `<div id="square-slider-${index}" class="square-slider">
          <h3>${slider.title}</h3>

          <div class="slider-carousel">
            <button class="slider-prev-carousel" type="button">
              <span class="material-symbols-rounded">arrow_back_ios_new</span>
            </button>

            <div class="slider">
            ${slider.items
              .map(
                (item) =>
                  `<div class="slider-item"><img src="${item.image}" alt="${item.image}" /></div>`,
              )
              .join("")}
            </div>

            <button class="slider-next-carousel" type="button">
              <span class="material-symbols-rounded">arrow_forward_ios</span>
            </button>
          </div>

          <span class="slider-product-details">${slider.description}</span>
          <span class="slider-product-price">${slider.price}</span>
          <span class="slider-product-mrp">M.R.P: <s>${slider.MRP}</s></span>
        </div>`,
        )
        .join("");

      initSquareSliders();
    })
    .catch((err) => console.error("Failed to load slider data:", err));

  function initSquareSliders() {
    document.querySelectorAll(".square-slider").forEach((card) => {
      const track = card.querySelector(".slider");
      const prevBtn = card.querySelector(".slider-prev-carousel");
      const nextBtn = card.querySelector(".slider-next-carousel");

      let originalSlides = Array.from(track.children);
      if (originalSlides.length === 0) return;

      const firstClone = originalSlides[0].cloneNode(true);
      const lastClone =
        originalSlides[originalSlides.length - 1].cloneNode(true);
      firstClone.classList.add("clone");
      lastClone.classList.add("clone");

      track.appendChild(firstClone);
      track.insertBefore(lastClone, originalSlides[0]);

      const slides = Array.from(track.children);
      const slideCount = slides.length;

      const slideWidth = 70;
      const peekOffset = (100 - slideWidth) / 2;

      let index = 1;
      let isAnimating = false;

      function updateActive() {
        slides.forEach((s) => s.classList.remove("active"));
        slides[index].classList.add("active");
      }

      function setPosition(withTransition = true) {
        track.style.transition = withTransition
          ? "transform 0.4s ease"
          : "none";
        track.style.transform = `translateX(calc(${-index * slideWidth}% + ${peekOffset}%))`;
        updateActive();
      }

      setPosition(false);

      function goNext() {
        if (isAnimating) return;
        isAnimating = true;
        index++;
        setPosition(true);
      }

      function goPrev() {
        if (isAnimating) return;
        isAnimating = true;
        index--;
        setPosition(true);
      }

      track.addEventListener("transitionend", () => {
        isAnimating = false;

        if (index === slideCount - 1) {
          index = 1;
          setPosition(false);
        }
        if (index === 0) {
          index = slideCount - 2;
          setPosition(false);
        }
      });

      nextBtn.addEventListener("click", goNext);
      prevBtn.addEventListener("click", goPrev);
    });
  }
}