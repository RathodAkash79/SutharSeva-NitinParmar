// Project Management - Money, Types, Photos
let currentProjectId = null;

async function addProject() {
    const name = document.getElementById('pName').value.trim();
    const village = document.getElementById('pVillage').value.trim();
    const totalAmount = parseFloat(document.getElementById('pTotalAmount').value) || 0;
    
    // Get selected work types
    const types = [];
    ['kitchen', 'doors', 'wardrobe', 'tv', 'custom', 'other'].forEach(type => {
        const el = document.getElementById('wt-' + type);
        if(el && el.checked) types.push(el.value);
    });

    if(!name || !village || types.length === 0) {
        return alert("પૂર્ણ માહિતી લખો અને કામનો પ્રકાર પસંદ કરો");
    }

    await db.collection('projects').add({
        name, village, totalAmount, workTypes: types, images: [], photos: [], status: 'Ongoing', 
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("કામ સેવ થઈ ગયું!");
    document.getElementById('pName').value = '';
    document.getElementById('pVillage').value = '';
    document.getElementById('pTotalAmount').value = '';
    
    // Clear checkboxes
    ['kitchen', 'doors', 'wardrobe', 'tv', 'custom', 'other'].forEach(type => {
        const el = document.getElementById('wt-' + type);
        if(el) el.checked = false;
    });
    
    closeModal('addProjectModal');
    loadProjects();
}

function loadProjects() {
    const container = document.getElementById('projectsList');
    container.innerHTML = '<p class="text-center">લોડ થઈ રહ્યું છે...</p>';
    db.collection('projects').orderBy('createdAt', 'desc').get().then(snap => {
        container.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.onclick = () => openProjectDetail(doc.id, p);
            div.innerHTML = `
                <div>
                    <h4>${p.name} ${p.status === 'Completed' ? '✅' : ''}</h4>
                    <p>${p.village} | ${p.workTypes ? p.workTypes.join(', ') : ''}</p>
                </div>
                <div class="text-right">
                    <p style="font-weight:700; color:var(--primary);">₹${(p.totalAmount || 0).toLocaleString('en-IN')}</p>
                </div>
            `;
            container.appendChild(div);
        });
    });
}

async function openProjectDetail(id, p) {
    currentProjectId = id;
    document.getElementById('detailProjectTitle').textContent = p.name;
    document.getElementById('detailProjectVillage').textContent = `📍 ${p.village}`;
    document.getElementById('dtlAmount').textContent = `₹${(p.totalAmount || 0).toLocaleString('en-IN')}`;
    
    // Calculate Majduri for this specific project if possible (future enhancement)
    // For now, let's just show the project total
    document.getElementById('dtlMajduri').textContent = `₹0`; 
    document.getElementById('dtlProfit').textContent = `₹${p.totalAmount || 0}`;

    showModal('projectDetailModal');
    renderProjectPhotos(p.photos || []);
}

function renderProjectPhotos(photos) {
    const grid = document.getElementById('projectPhotosGrid');
    grid.innerHTML = photos.map((p, index) => `
        <div class="photo-item">
            <img src="${p.url}" alt="${p.category}">
            <span class="badge" style="position:absolute; bottom:5px; left:5px;">${p.category}</span>
            <button class="delete-photo" onclick="deleteProjectPhoto(${index})"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

async function uploadProjectPhoto() {
    const fileInput = document.getElementById('projectImageInput');
    const category = document.getElementById('photoCategory').value;
    const btn = document.getElementById('projUploadBtn');
    if(!fileInput.files[0]) return alert("ફોટો પસંદ કરો");

    btn.disabled = true; btn.innerText = "અપલોડ...";
    const formData = new FormData(); formData.append("image", fileInput.files[0]);

    try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        
        const docRef = db.collection('projects').doc(currentProjectId);
        const doc = await docRef.get();
        const photos = doc.data().photos || [];
        const images = doc.data().images || [];
        
        photos.push({ url: data.url, category });
        images.push(data.url); // Legacy compatibility

        await docRef.update({ photos, images });
        renderProjectPhotos(photos);
        fileInput.value = "";
    } catch (e) { alert(e.message); }
    finally { btn.disabled = false; btn.innerText = "ફોટો અપલોડ કરો"; }
}

async function deleteProjectPhoto(index) {
    if(!confirm("કાઢી નાખવો છે?")) return;
    const docRef = db.collection('projects').doc(currentProjectId);
    const doc = await docRef.get();
    const photos = doc.data().photos;
    photos.splice(index, 1);
    await docRef.update({ photos });
    renderProjectPhotos(photos);
}

async function markProjectComplete() {
    if(!confirm("શું આ કામ પૂર્ણ થઈ ગયું છે?")) return;
    await db.collection('projects').doc(currentProjectId).update({ status: 'Completed' });
    alert("કામ પૂર્ણ થયું!");
    closeModal('projectDetailModal');
    loadProjects();
}
