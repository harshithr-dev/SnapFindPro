// Enhanced product dataset
const products = [
  { name: "Nike Air Max 90", tags: ["shoe", "sneaker", "nike", "air max", "running", "footwear"], image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop" },
  { name: "Adidas Ultraboost", tags: ["shoe", "sneaker", "adidas", "boost", "running", "athletic"], image: "https://images.unsplash.com/photo-1543273987-1e8def6a2928?w=400&h=300&fit=crop" },
  { name: "Leather Handbag", tags: ["bag", "handbag", "purse", "leather", "fashion", "accessory"], image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop" },
  { name: "Designer Watch", tags: ["watch", "wristwatch", "timepiece", "luxury", "accessory"], image: "https://images.unsplash.com/photo-1524592094714-0f0652e6d5e9?w=400&h=300&fit=crop" },
  { name: "Wireless Headphones", tags: ["headphones", "earphones", "audio", "wireless", "bluetooth"], image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop" },
  { name: "Running Shoes", tags: ["shoe", "sneaker", "running", "athletic", "sport", "footwear"], image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop" },
  { name: "Backpack", tags: ["bag", "backpack", "rucksack", "travel", "luggage"], image: "https://images.unsplash.com/photo-1553062388-ee62e750b294?w=400&h=300&fit=crop" },
  { name: "Sunglasses", tags: ["sunglasses", "eyewear", "glasses", "sun", "accessory"], image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop" },
  { name: "Smartphone", tags: ["phone", "smartphone", "mobile", "cellphone", "device"], image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop" },
  { name: "Laptop", tags: ["laptop", "computer", "notebook", "device", "tech"], image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop" }
];

// DOM Elements
const sections = {
  upload: document.getElementById('uploadSection'),
  loading: document.getElementById('loadingSection'),
  results: document.getElementById('resultsSection'),
  history: document.getElementById('historySection')
};

const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const historyBtn = document.getElementById('historyBtn');
const tagsGrid = document.getElementById('tagsGrid');
const productsGrid = document.getElementById('productsGrid');
const noResults = document.getElementById('noResults');
const historyGrid = document.getElementById('historyGrid');

// History management
let searchHistory = JSON.parse(localStorage.getItem('snapfindHistory')) || [];

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
uploadArea.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', handleImageSelect);
searchBtn.addEventListener('click', handleSearch);
clearBtn.addEventListener('click', clearPreview);
historyBtn.addEventListener('click', showHistory);
document.getElementById('newSearchBtn')?.addEventListener('click', showUpload);
document.getElementById('noResultsBtn')?.addEventListener('click', showUpload);
document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);

// Drag & Drop
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

function initApp() {
  showSection('upload');
  loadHistory();
}

function showSection(sectionName) {
  Object.values(sections).forEach(section => section.classList.remove('active'));
  sections[sectionName].classList.add('active');
  sections[sectionName].style.display = 'block';
}

function handleImageSelect() {
  const file = imageInput.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.style.display = 'block';
      previewContainer.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }
}

function handleDragOver(e) {
  e.preventDefault();
  uploadArea.style.borderColor = '#1a73e8';
  uploadArea.style.background = 'rgba(26, 115, 232, 0.04)';
}

function handleDragLeave(e) {
  e.preventDefault();
  uploadArea.style.borderColor = '#dadce0';
  uploadArea.style.background = 'transparent';
}

function handleDrop(e) {
  e.preventDefault();
  uploadArea.style.borderColor = '#dadce0';
  uploadArea.style.background = 'transparent';
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    imageInput.files = files;
    handleImageSelect();
  }
}

function clearPreview() {
  imageInput.value = '';
  previewContainer.style.display = 'none';
  previewImage.src = '';
}

async function handleSearch() {
  const file = imageInput.files[0];
  if (!file) {
    alert('Please select an image first');
    return;
  }

  showSection('loading');
  
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.labels && data.labels.length > 0) {
      await displayResults(data.labels, file);
    } else {
      showNoResults();
    }
  } catch (error) {
    console.error('Search error:', error);
    alert('Search failed. Check console for details or try another image.');
    showUpload();
  }
}

async function displayResults(labels, imageFile) {
  // Save to history
  const historyItem = {
    id: Date.now(),
    image: URL.createObjectURL(imageFile),
    labels: labels.slice(0, 5),
    timestamp: new Date().toLocaleString()
  };
  searchHistory.unshift(historyItem);
  searchHistory = searchHistory.slice(0, 50); // Keep last 50
  localStorage.setItem('snapfindHistory', JSON.stringify(searchHistory));
  
  // Show tags
  document.getElementById('tagCount').textContent = labels.length;
  tagsGrid.innerHTML = '';
  labels.slice(0, 10).forEach(label => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = label;
    tagsGrid.appendChild(tag);
  });

  // Match products (IMPROVED ALGORITHM)
  const matchedProducts = products
    .map(product => {
      let score = 0;
      labels.forEach(label => {
        // Exact match
        if (product.tags.includes(label)) score += 40;
        // Partial match
        if (product.tags.some(tag => tag.includes(label) || label.includes(tag))) score += 20;
      });
      // Name similarity bonus
      if (product.name.toLowerCase().includes(labels[0])) score += 30;
      return { ...product, score: Math.min(score, 100) };
    })
    .filter(p => p.score >= 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  productsGrid.innerHTML = '';
  noResults.style.display = 'none';

  if (matchedProducts.length === 0) {
    showNoResults();
    return;
  }

  matchedProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="match-score">
          <span class="score-value">${product.score}%</span>
          <div class="score-bar">
            <div class="score-fill" style="width: ${product.score}%"></div>
          </div>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  showSection('results');
}

function showNoResults() {
  noResults.style.display = 'block';
  showSection('results');
}

function showUpload() {
  clearPreview();
  showSection('upload');
}

function showHistory() {
  loadHistory();
  showSection('history');
}

function loadHistory() {
  historyGrid.innerHTML = '';
  
  if (searchHistory.length === 0) {
    historyGrid.innerHTML = `
      <div class="empty-history">
        <i class="material-icons">history</i>
        <h3>No searches yet</h3>
        <p>Upload an image to get started</p>
      </div>
    `;
    return;
  }

  searchHistory.forEach(item => {
    const historyCard = document.createElement('div');
    historyCard.className = 'history-item';
    historyCard.onclick = () => {
      // Preview history item
      previewImage.src = item.image;
      previewContainer.style.display = 'flex';
      showSection('upload');
    };
    historyCard.innerHTML = `
      <img src="${item.image}" alt="History" class="history-preview">
      <div class="history-tags">
        ${item.labels.map(tag => `<span class="history-tag">${tag}</span>`).join('')}
      </div>
      <div style="font-size: 14px; color: #5f6368;">${item.timestamp}</div>
    `;
    historyGrid.appendChild(historyCard);
  });
}

function clearHistory() {
  if (confirm('Clear all search history?')) {
    searchHistory = [];
    localStorage.removeItem('snapfindHistory');
    loadHistory();
  }
}
