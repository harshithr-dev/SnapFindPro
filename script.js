// ===== Product Dataset =====
const products = [
  {
    name: "Nike Air Max",
    tags: ["shoe", "sneaker", "footwear", "running", "sport"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop"
  },
  {
    name: "Classic Leather Watch",
    tags: ["watch", "accessory", "fashion", "wrist", "time"],
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop"
  },
  {
    name: "Ray-Ban Sunglasses",
    tags: ["sunglasses", "glasses", "eyewear", "fashion", "accessory"],
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop"
  },
  {
    name: "Denim Jacket",
    tags: ["jacket", "clothing", "denim", "fashion", "apparel"],
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400&h=300&fit=crop"
  },
  {
    name: "Wireless Headphones",
    tags: ["headphones", "audio", "music", "electronics", "tech"],
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
  },
  {
    name: "Backpack",
    tags: ["bag", "backpack", "travel", "accessory", "luggage"],
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
  },
  {
    name: "Coffee Mug",
    tags: ["mug", "cup", "coffee", "drink", "kitchen"],
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=300&fit=crop"
  },
  {
    name: "Running Shorts",
    tags: ["shorts", "clothing", "sport", "running", "apparel"],
    image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=300&fit=crop"
  },
  {
    name: "Laptop Stand",
    tags: ["laptop", "stand", "desk", "office", "tech"],
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop"
  },
  {
    name: "Yoga Mat",
    tags: ["yoga", "mat", "fitness", "exercise", "sport"],
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=300&fit=crop"
  }
];

// ===== DOM Elements =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImage');
const searchBtn = document.getElementById('searchBtn');
const loadingSection = document.getElementById('loadingSection');
const labelsSection = document.getElementById('labelsSection');
const labelsContainer = document.getElementById('labelsContainer');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');
const noResults = document.getElementById('noResults');

let selectedFile = null;

// ===== Event Listeners =====
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

removeImageBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetUpload();
});

searchBtn.addEventListener('click', analyzeImage);

// ===== File Handling =====
function handleFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file.');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be under 5MB.');
    return;
  }

  selectedFile = file;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
    removeImageBtn.classList.remove('hidden');
    searchBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  imagePreview.src = '';
  imagePreview.classList.add('hidden');
  uploadPlaceholder.classList.remove('hidden');
  removeImageBtn.classList.add('hidden');
  searchBtn.disabled = true;
  
  // Hide results
  labelsSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  noResults.classList.add('hidden');
}

// ===== Analyze Image =====
async function analyzeImage() {
  if (!selectedFile) return;

  // Show loading
  loadingSection.classList.remove('hidden');
  labelsSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  noResults.classList.add('hidden');
  searchBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('image', selectedFile);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const data = await response.json();
    const labels = data.labels || [];

    // Show detected labels
    displayLabels(labels);

    // Match and display products
    const matches = findMatchingProducts(labels);
    displayResults(matches);

  } catch (error) {
    console.error('Error:', error);
    alert('Something went wrong. Please try again.');
  } finally {
    loadingSection.classList.add('hidden');
    searchBtn.disabled = false;
  }
}

// ===== Display Labels =====
function displayLabels(labels) {
  labelsContainer.innerHTML = '';
  
  if (labels.length === 0) {
    labelsSection.classList.add('hidden');
    return;
  }

  labels.forEach(label => {
    const tag = document.createElement('span');
    tag.className = 'label-tag';
    tag.textContent = label;
    labelsContainer.appendChild(tag);
  });

  labelsSection.classList.remove('hidden');
}

// ===== Match Logic =====
function findMatchingProducts(labels) {
  const normalizedLabels = labels.map(l => l.toLowerCase());
  
  const scoredProducts = products.map(product => {
    const normalizedTags = product.tags.map(t => t.toLowerCase());
    let score = 0;
    
    normalizedLabels.forEach(label => {
      normalizedTags.forEach(tag => {
        // Exact match
        if (label === tag) {
          score += 100;
        }
        // Partial match (label contains tag or vice versa)
        else if (label.includes(tag) || tag.includes(label)) {
          score += 50;
        }
      });
    });
    
    return { ...product, score };
  });

  // Filter products with any match and sort by score
  return scoredProducts
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ===== Display Results =====
function displayResults(matches) {
  resultsGrid.innerHTML = '';

  if (matches.length === 0) {
    resultsSection.classList.add('hidden');
    noResults.classList.remove('hidden');
    return;
  }

  matches.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const maxScore = matches[0].score;
    const percentage = Math.round((product.score / maxScore) * 100);

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="product-tags">
          ${product.tags.map(tag => `<span class="product-tag">${tag}</span>`).join('')}
        </div>
        <div class="match-score">
          <div class="score-bar-bg">
            <div class="score-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <span class="score-text">${percentage}%</span>
        </div>
      </div>
    `;
    
    resultsGrid.appendChild(card);
  });

  resultsSection.classList.remove('hidden');
  noResults.classList.add('hidden');
}
