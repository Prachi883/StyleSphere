// StyleSphere demo frontend. Data is saved in this browser using localStorage.
// Later, the localStorage functions can be replaced with PHP + MySQL requests.
const starterClothes = [
  {id:1,name:"Ivory knit sweater",category:"Tops",color:"Ivory",season:"Winter",occasion:"College"},
  {id:2,name:"White cotton shirt",category:"Tops",color:"White",season:"All season",occasion:"Formal"},
  {id:3,name:"Blue straight jeans",category:"Bottoms",color:"Blue",season:"All season",occasion:"Everyday"},
  {id:4,name:"Black tailored trousers",category:"Bottoms",color:"Black",season:"All season",occasion:"Formal"},
  {id:5,name:"Floral midi dress",category:"Dresses",color:"Rose",season:"Summer",occasion:"Party"},
  {id:6,name:"Brown long coat",category:"Outerwear",color:"Brown",season:"Winter",occasion:"Everyday"}
];
const readData = (key, fallback) => {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
};
const saveData = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let clothes = [];
let activeFilter = "All";

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message; toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2300);
}

// Display clothing records on the Wardrobe page
function renderClothes() {

    const grid = document.getElementById("clothingGrid");

    if (!grid) return;

    const search = (document.getElementById("searchInput")?.value || "").toLowerCase();

    const filtered = clothes.filter(item =>
    (activeFilter === "All" || item.category.toLowerCase() === activeFilter.toLowerCase()) &&
    (
        item.name.toLowerCase().includes(search) ||
        (item.color || "").toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search)
    )
);

    grid.innerHTML = filtered.map((item, index) => `
        <article class="clothing-card">

            <button class="delete-item"
                data-delete="${item.id}"
                aria-label="Delete ${item.name}">×</button>

            
<div class="clothing-visual tone-${(index % 3) + 1}">
    ${
        item.image_path
            ? `<img src="${escapeHtml(item.image_path)}"
                    alt="${escapeHtml(item.name)}"
                    loading="lazy">`
            : `<span>${escapeHtml(item.name)}</span>`
    }
</div>
 

            <div class="clothing-info">
                <h3>${escapeHtml(item.name)}</h3>

                <div class="clothing-meta">
                    <span>${escapeHtml(item.category)} · ${escapeHtml(item.color || "")}</span>
                    <span>${escapeHtml(item.season || "")}</span>
                </div>
            </div>

        </article>
    `).join("");

    const emptyMessage = document.getElementById("emptyMessage");

    if (emptyMessage) {
        emptyMessage.hidden = filtered.length !== 0;
    }

    const itemCount = document.getElementById("itemCount");
    const categories = new Set(
    clothes.map(item => item.category.toLowerCase())
);

document.getElementById("categoryCount").textContent =
    String(categories.size).padStart(2, "0");

    if (itemCount) {
        itemCount.textContent = clothes.length;
    }
}


// Fetch clothing records from MySQL using PHP
async function loadClothes() {

    const grid = document.getElementById("clothingGrid");

    if (!grid) return;

    try {

        const response = await fetch("fetch_clothing.php");

        if (!response.ok) {
            throw new Error("Unable to fetch clothing.");
        }

        clothes = await response.json();

        console.log("Clothing received from MySQL:", clothes);

        renderClothes();

    } catch (error) {

        console.error("Error loading clothing:", error);

        grid.innerHTML = "<p>Unable to load wardrobe.</p>";

    }
}


// Protect the website from unsafe HTML characters
function escapeHtml(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}

document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation
  document.querySelector(".menu-toggle")?.addEventListener("click", () => document.querySelector(".nav-links")?.classList.toggle("open"));
  // Wardrobe search and category filters
  loadClothes();
  // Success message after insert_clothing.php redirects back with ?added=1
  if (new URLSearchParams(location.search).get("added") === "1") {
    showToast("Clothing added to your wardrobe!");
    history.replaceState(null, "", location.pathname);
  }
  document.getElementById("searchInput")?.addEventListener("input", renderClothes);
  document.getElementById("filterChips")?.addEventListener("click", event => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".chip").forEach(chip => chip.classList.toggle("selected", chip === button));
    renderClothes();
  });
  
document.getElementById("clothingGrid")?.addEventListener("click", async (event) => {

    const button = event.target.closest("[data-delete]");

    if (!button) return;

    const id = button.dataset.delete;

    button.disabled = true;

    const formData = new FormData();
    formData.append("id", id);

    try {

        const response = await fetch("delete_clothing.php", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Delete failed");
        }

        // Remove the item from the displayed array
        clothes = clothes.filter(item => String(item.id) !== String(id));

        // Refresh the clothing cards
        renderClothes();

        showToast("Clothing item deleted successfully!");

    } catch (error) {

        console.error("Delete error:", error);

        showToast("Unable to delete clothing.");

        button.disabled = false;

    }

});


  // Add clothing modal and demo form
  const modal = document.getElementById("addModal");
  document.getElementById("openAddForm")?.addEventListener("click", () => modal.hidden = false);
  document.getElementById("closeAddForm")?.addEventListener("click", () => modal.hidden = true);
  modal?.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
  

  // Style Matcher choices
  document.querySelectorAll(".choice-options").forEach(group => group.addEventListener("click", event => {
    const button = event.target.closest(".choice");
    if (!button) return;
    group.querySelectorAll(".choice").forEach(choice => choice.classList.toggle("active", choice === button));
  }));
  document.getElementById("findOutfit")?.addEventListener("click", () => {
    const selected = [...document.querySelectorAll(".choice-options")].map(group => group.querySelector(".active")?.textContent || "");
    const [occasion,weather,mood] = selected;
    const title = weather === "Cold" ? "The cosy, considered edit" : mood === "Bold" ? "The confident statement" : occasion === "Formal" ? "The polished everyday edit" : "The effortless edit";
    document.getElementById("matchTitle").textContent = title;
    document.getElementById("matchText").textContent = `${occasion} plans · ${weather.toLowerCase()} weather · ${mood.toLowerCase()} mood. Start with a favourite piece from your wardrobe and build around it.`;
    document.getElementById("matchResult").hidden = false;
  });

  // Save an outfit idea
  document.getElementById("saveLook")?.addEventListener("click", () => {
    const look = {id:Date.now(),top:document.getElementById("studioTop").value,bottom:document.getElementById("studioBottom").value,shoes:document.getElementById("studioShoes").value};
    const looks = readData("stylesphere-looks", []); looks.unshift(look); saveData("stylesphere-looks", looks); showToast("Your look has been saved!");
  });
  const savedLooks = document.getElementById("savedLooks");
  if (savedLooks) {
    const looks = readData("stylesphere-looks", []);
    savedLooks.innerHTML = looks.map(look => `<article class="saved-look"><p class="eyebrow">SAVED OUTFIT</p><h3>Your outfit edit</h3><p>Top: ${escapeHtml(look.top)}<br>Bottom: ${escapeHtml(look.bottom)}<br>Footwear: ${escapeHtml(look.shoes)}</p></article>`).join("");
    document.getElementById("noLooks").hidden = looks.length > 0;
  }
});