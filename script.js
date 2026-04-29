const products = [
    { name: "Nike Air Max", tags: ["shoe", "sneaker", "footwear"], image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
    { name: "Leather Backpack", tags: ["bag", "backpack", "luggage"], image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa" },
    { name: "Classic Aviators", tags: ["eyewear", "sunglasses", "glasses"], image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f" },
    { name: "Smart Watch", tags: ["watch", "electronics", "gadget"], image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30" }
];

const imageInput = document.getElementById('imageInput');
const searchBtn = document.getElementById('searchBtn');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('resultsSection');

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            searchBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

searchBtn.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) return;

    // UI Reset
    loader.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({ image: base64Image }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            displayResults(data.labels);
        } catch (err) {
            alert("Error analyzing image.");
        } finally {
            loader.classList.add('hidden');
        }
    };
});

function displayResults(detectedLabels) {
    resultsSection.classList.remove('hidden');
    const tagsContainer = document.getElementById('tagsContainer');
    const productsGrid = document.getElementById('productsGrid');
    
    tagsContainer.innerHTML = detectedLabels.map(l => `<span class="tag">${l}</span>`).join('');

    const scoredProducts = products.map(p => {
        let score = 0;
        detectedLabels.forEach(label => {
            if (p.tags.includes(label.toLowerCase())) score++;
        });
        return { ...p, score };
    }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

    if (scoredProducts.length === 0) {
        productsGrid.innerHTML = "<p>No matching products found.</p>";
    } else {
        productsGrid.innerHTML = scoredProducts.map(p => `
            <div class="product-card">
                <img src="${p.image}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p class="score">Match Score: ${p.score}</p>
            </div>
        `).join('');
    }
}
