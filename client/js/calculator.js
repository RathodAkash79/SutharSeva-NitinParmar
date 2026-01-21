// Customer Side Logic - Search, Filter, Calculator
document.addEventListener('DOMContentLoaded', () => {
    fetchCurrentRate();
    setupCalculator();
    loadVillages();
    loadGallery('બધા');
    setupSearch();
});

let currentRate = 0;
let allProjects = [];

function fetchCurrentRate() {
    db.collection('public').doc('rates').get().then(doc => {
        if (doc.exists) {
            currentRate = doc.data().perFoot || 0;
            document.getElementById('currentRate').textContent = currentRate;
            calculateTotal();
        }
    });
}

function setupCalculator() {
    document.getElementById('feetInput').addEventListener('input', calculateTotal);
}

function calculateTotal() {
    const feet = parseFloat(document.getElementById('feetInput').value) || 0;
    const total = feet * currentRate;
    document.getElementById('totalCost').textContent = '₹' + total.toLocaleString('en-IN');
}

function sendEstimateToWhatsapp() {
    const feet = document.getElementById('feetInput').value;
    const total = document.getElementById('totalCost').textContent;
    if(!feet) return alert("ફૂટ લખો");
    const message = `નમસ્તે નિતિનભાઈ, %0a%0aમારે અંદાજે ${feet} ફૂટ ફર્નિચર કામ કરાવવું છે. %0aઅંદાજિત ભાવ ₹${total} બતાવે છે. વિગત માટે સંપર્ક કરશો.`;
    window.open(`https://wa.me/918160911612?text=${message}`, '_blank');
}

function loadVillages() {
    db.collection('projects').get().then(snap => {
        const villages = new Set();
        snap.forEach(doc => villages.add(doc.data().village));
        const container = document.getElementById('villageList');
        container.innerHTML = '<span class="chip active" onclick="filterByVillage(\'બધા\', this)">બધા</span>';
        villages.forEach(v => {
            if(v) container.innerHTML += `<span class="chip" onclick="filterByVillage('${v}', this)">${v}</span>`;
        });
    });
}

function loadGallery(filter = 'બધા') {
    db.collection('projects').orderBy('createdAt', 'desc').onSnapshot(snap => {
        allProjects = [];
        snap.forEach(doc => {
            const p = doc.data();
            p.id = doc.id;
            allProjects.push(p);
        });
        renderGallery(allProjects);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        if(!term) {
            loadGallery('બધા');
            return;
        }
        
        const filtered = allProjects.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.village.toLowerCase().includes(term) ||
            (p.workTypes && p.workTypes.some(t => t.toLowerCase().includes(term)))
        );
        
        renderGallery(filtered);
    });
}

function filterGalleryByType(type) {
    if(type === 'બધા') {
        loadGallery('બધા');
        return;
    }
    const filtered = allProjects.filter(p => 
        p.workTypes && p.workTypes.includes(type)
    );
    renderGallery(filtered);
}

function filterByVillage(village, el) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const filtered = village === 'બધા' ? allProjects : allProjects.filter(p => p.village === village);
    renderGallery(filtered);
}

function renderGallery(projects) {
    const container = document.getElementById('galleryGrid');
    if(projects.length === 0) {
        container.innerHTML = '<div class="gallery-placeholder">કોઈ કામ મળ્યું નથી.</div>';
        return;
    }
    
    // Group projects by category for better UX
    const grouped = {};
    projects.forEach(p => {
        const types = p.workTypes || ['અન્ય'];
        types.forEach(t => {
            if(!grouped[t]) grouped[t] = [];
            grouped[t].push(p);
        });
    });
    
    let html = '';
    Object.entries(grouped).forEach(([category, items]) => {
        html += `<div class="search-group"><h4 class="group-title">${category}</h4>`;
        items.forEach(p => {
            const mainImg = p.images && p.images.length > 0 ? p.images[0] : 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&q=80';
            const types = p.workTypes ? p.workTypes.map(t => `<span class="badge">${t}</span>`).join('') : '';
            html += `
                <div class="gallery-card">
                    <img src="${mainImg}" alt="${p.name}" loading="lazy">
                    <div class="gallery-info">
                        <h4>${p.name}</h4>
                        <p><i class="fa-solid fa-location-dot"></i> ${p.village}</p>
                        <div class="work-badges">${types}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    });
    
    container.innerHTML = html;
}
