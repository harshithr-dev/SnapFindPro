// Product dataset
const products = [
  {
    name: "Nike Air Max 90",
    tags: ["shoe", "sneaker", "footwear", "nike", "air max", "running"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"
  },
  {
    name: "Adidas Ultraboost",
    tags: ["shoe", "sneaker", "running", "adidas", "boost", "athletic"],
    image: "https://images.unsplash.com/photo-1543273987-1e8def6a2928?w=400&h=400&fit=crop"
  },
  {
    name: "Leather Handbag",
    tags: ["bag", "handbag", "purse", "leather", "fashion"],
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop"
  },
  {
    name: "Designer Watch",
    tags: ["watch", "wristwatch", "timepiece", "luxury"],
    image: "https://images.unsplash.com/photo-1524592094714-0f0652e6d5e9?w=400&h=400&fit=crop"
  },
  {
    name: "Wireless Headphones",
    tags: ["headphones", "earphones", "audio", "wireless", "bluetooth"],
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"
  },
  {
    name: "Running Shoes",
    tags: ["shoe", "sneaker", "running", "athletic", "sport"],
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"
  },
  {
    name: "Backpack",
    tags: ["bag", "backpack", "rucksack", "travel"],
    image: "https://images.unsplash.com/photo-1553062388-ee62e750b294?w=400&h=400&fit=crop"
  },
  {
    name: "Sunglasses",
    tags: ["sunglasses", "eyewear", "glasses", "sun"],
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop"
  }
];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const tagsGrid = document.getElementById('tagsGrid');
const productsGrid = document.getElementById('productsGrid');
const noResults = document.getElementById('noResults');

// Upload functionality
uploadArea.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', handleImageSelect);

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#ff6b6b';
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '#4ecdc4';
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = '#4ecdc4';
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    imageInput.files = files;
    handleImageSelect();
  }
});

function handleImageSelect() {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }
}

// Search functionality
searchBtn.addEventListener('click', async () => {
  const file = imageInput.files[0];
  if (!file) return;

  showLoading();
  
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.labels && data.labels.length > 0) {
      displayResults(data.labels);
    } else {
      showNoResults();
    }
  } catch (error) {
    console.error('Error:', error);
    showNoResults();
  }
});

function showLoading() {
  uploadArea.style.display = 'none';
  previewContainer.style.display = 'none';
  loading.style.display = 'block';
  resultsSection.style.display = 'none';
}

function showResults() {
  loading.style.display = 'none';
  resultsSection.style.display = 'block';
}

function showNoResults() {
  loading.style.display = 'none';
  resultsSection.style.display = 'block';
  noResults.style.display = 'block';
  productsGrid.innerHTML = '';
}

function displayResults(labels) {
  // Display detected tags
  tagsGrid.innerHTML = '';
  labels.slice(0, 8).forEach(label => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = label;
    tagsGrid.appendChild(tag);
  });

  // Match products
  const matchedProducts = products.map(product => {
    let score = 0;
    const productTags = product.tags;
    
    labels.forEach(label => {
      if (productTags.includes(label.toLowerCase())) {
        score += 30;
      }
    });
    
    // Bonus for exact matches
    labels.forEach(label => {
      const similarity = stringSimilarity(label.toLowerCase(), product.name.toLowerCase());
      if (similarity > 0.6) score += 20;
    });

    return { ...product, score, percentage: Math.min(score, 100) };
  }).filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  noResults.style.display = 'none';
  productsGrid.innerHTML = '';

  if (matchedProducts.length === 0) {
    showNoResults();
    return;
  }

  matchedProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image">
      <div class="product-name">${product.name}</div>
      <div class="match-score">
        <i class="fas fa-star"></i>
        <span>${product.percentage}% Match</span>
        <div class="score-bar">
          <div class="score-fill" style="width: ${product.percentage}%"></div>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  showResults();
}

// Simple string similarity (Jaccard similarity)
function stringSimilarity(str1, str2) {
  const set1 = new Set(str1.split(' '));
  const set2 = new Set(str2.split(' '));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}