// Project Management - Money, Types, Photos
let currentProjectId = null;
let currentProjectData = null;

async function addProject() {
    const name = document.getElementById('pName').value.trim();
    const village = document.getElementById('pVillage').value.trim();
    const totalAmount = parseFloat(document.getElementById('pTotalAmount').value) || 0;
    const startDate = document.getElementById('pStartDate').value || new Date().toISOString().split('T')[0];
    const endDate = document.getElementById('pEndDate').value || '';
    
    // Get selected work types
        const types = [];
        const typeIds = [
            'door',
            'window',
            'furniture',
            'almari',
            'kabaat',
            'showcase',
            'tv',
            'sofa',
            'mandir',
            'bed',
            'study',
            'mirror',
            'dressing',
            'ac',
            'kitchen',
            'other'
        ];

        typeIds.forEach(type => {
            const el = document.getElementById('wt-' + type);
            if(el && el.checked) types.push(el.value);
        });

    const customType = document.getElementById('wt-custom')?.value.trim();
    if(customType) types.push(customType);

    if(!name || !village || types.length === 0) {
        return customAlert("પૂર્ણ માહિતી લખો અને કામનો પ્રકાર પસંદ કરો");
    }

    await db.collection('projects').add({
        name, village, totalAmount, workTypes: types, images: [], photos: [], 
        status: 'Ongoing', 
        startDate,
        endDate,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await customAlert("કામ સેવ થઈ ગયું!");
    document.getElementById('pName').value = '';
    document.getElementById('pVillage').value = '';
    document.getElementById('pTotalAmount').value = '';
    document.getElementById('pStartDate').value = '';
    document.getElementById('pEndDate').value = '';
    if(document.getElementById('wt-custom')) document.getElementById('wt-custom').value = '';
    
    // Clear checkboxes
        typeIds.forEach(type => {
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
            const start = p.startDate ? new Date(p.startDate) : null;
            const end = p.endDate ? new Date(p.endDate) : null;
            const startDate = start ? start.toLocaleDateString('en-GB') : '-';
            const endDate = end ? end.toLocaleDateString('en-GB') : 'ચાલુ';
            const isRunning = p.status === 'Ongoing';
            const endForCalc = start ? (p.status === 'Completed' && end ? end : new Date()) : null;
            const days = start && endForCalc ? Math.max(1, Math.floor((endForCalc - start) / (1000 * 60 * 60 * 24)) + 1) : 0;
            const durationLabel = start ? (p.status === 'Completed' ? `✅ ${days} દિવસમાં પૂર્ણ` : `🔄 ${days}મો દિવસ`) : '↗️ શરૂ તારીખ નથી';
            
            const div = document.createElement('div');
            div.className = 'list-item';
            div.onclick = () => openProjectDetail(doc.id, p);
            div.innerHTML = `
                <div>
                    <h4>${p.name} ${p.status === 'Completed' ? '✅' : '🔄'}</h4>
                    <p>${p.village} | ${p.workTypes ? p.workTypes.join(', ') : ''}</p>
                    <small style="color: #2e7d32; font-size: 11px; display:block; margin-bottom:4px;">${durationLabel}</small>
                    <small style="color: #999; font-size: 11px;">📅 ${startDate} → ${endDate}</small>
                </div>
                <div class="text-right">
                    <p style="font-weight:700; color:var(--primary);">₹${(p.totalAmount || 0).toLocaleString('en-IN')}</p>
                    ${isRunning ? '<span class="badge" style="background: var(--success); color: white; font-size: 10px;">ચાલુ</span>' : ''}
                </div>
            `;
            container.appendChild(div);
        });
    });
}

async function openProjectDetail(id, p) {
    currentProjectId = id;
    const startDate = p.startDate ? new Date(p.startDate) : null;
    const endDate = p.endDate ? new Date(p.endDate) : null;
    const today = new Date();

    document.getElementById('detailProjectTitle').textContent = p.name;
    document.getElementById('detailProjectVillage').textContent = `📍 ${p.village}`;

    const dateText = `${startDate ? startDate.toLocaleDateString('en-GB') : '-'}` +
        ` → ${endDate ? endDate.toLocaleDateString('en-GB') : (p.status === 'Completed' ? 'પૂર્ણ તારીખ ગૂમ' : 'ચાલુ')}`;
    document.getElementById('detailProjectDates').textContent = `📅 ${dateText}`;

    let durationText = '↗️ શરૂ નથી';
    if (startDate) {
        const endForCalc = endDate || today;
        const days = Math.max(1, Math.floor((endForCalc - startDate) / (1000 * 60 * 60 * 24)) + 1);
        durationText = p.status === 'Completed'
            ? `✅ ${days} દિવસમાં પૂર્ણ`
            : `🔄 ${days}મો દિવસ ચાલુ`;
    }
    document.getElementById('detailProjectDuration').textContent = durationText;

    currentProjectData = p;

    const effectiveAmount = p.finalAmount || p.totalAmount || 0;
    document.getElementById('dtlAmount').textContent = `₹${effectiveAmount.toLocaleString('en-IN')}`;

    // Calculate Majduri (attendance payable) for this project
    const attSnap = await db.collection('attendance').where('projectId', '==', id).get();
    let totalMajduri = 0; attSnap.forEach(d => totalMajduri += (d.data().payable || 0));
    document.getElementById('dtlMajduri').textContent = `₹${totalMajduri.toLocaleString('en-IN')}`;
    document.getElementById('dtlProfit').textContent = `₹${((effectiveAmount) - totalMajduri).toLocaleString('en-IN')}`;

    showModal('projectDetailModal');
    renderProjectPhotos(p.photos || []);
    renderWorkTypesCheckboxes(p.workTypes || []);
}

function renderWorkTypesCheckboxes(selectedTypes) {
    const container = document.getElementById('workTypesCheckboxes');
    const allTypes = [
        { id: 'door', label: '🚪 દરવાજા', value: 'દરવાજા' },
        { id: 'window', label: '🪟 બારી', value: 'બારી' },
        { id: 'furniture', label: '🪑 ફર્નિચર', value: 'ફર્નિચર' },
        { id: 'almari', label: '🧥 અલમારી', value: 'અલમારી' },
        { id: 'kabaat', label: '📦 કબાટ', value: 'કબાટ' },
        { id: 'showcase', label: '🗄️ શો-કેસ', value: 'શો-કેસ' },
        { id: 'tv', label: '📺 TV યુનિટ', value: 'TV યુનિટ' },
        { id: 'sofa', label: '🛋️ સોફા', value: 'સોફા' },
        { id: 'mandir', label: '🛕 મંદિર', value: 'મંદિર' },
        { id: 'bed', label: '🛏️ પલંગ', value: 'પલંગ' },
        { id: 'study', label: '📚 સ્ટડી ટેબલ', value: 'સ્ટડી ટેબલ' },
        { id: 'mirror', label: '🪞 કાચ', value: 'કાચ' },
        { id: 'dressing', label: '💄 ડ્રેસિંગ ટેબલ', value: 'ડ્રેસિંગ ટેબલ' },
        { id: 'ac', label: '❄️ AC પેનલિંગ', value: 'AC પેનલિંગ' },
        { id: 'kitchen', label: '🍳 રસોડું', value: 'રસોડું' },
        { id: 'other', label: '✨ અન્ય', value: 'અન્ય' }
    ];

    container.innerHTML = allTypes.map(type => {
        const checked = selectedTypes.includes(type.value) ? 'checked' : '';
        return `<label style="font-size:13px;"><input type="checkbox" id="edit-wt-${type.id}" value="${type.value}" ${checked}> ${type.label}</label>`;
    }).join('');
}

async function saveWorkTypes() {
    const types = [];
    const typeIds = ['door', 'window', 'furniture', 'almari', 'kabaat', 'showcase', 'tv', 'sofa', 'mandir', 'bed', 'study', 'mirror', 'dressing', 'ac', 'kitchen', 'other'];
    
    typeIds.forEach(id => {
        const el = document.getElementById('edit-wt-' + id);
        if(el && el.checked) types.push(el.value);
    });

    const customType = document.getElementById('editCustomType')?.value.trim();
    if(customType) types.push(customType);

    if(types.length === 0) {
        return customAlert("ઓછામાં ઓછો એક પ્રકાર પસંદ કરો");
    }

    await db.collection('projects').doc(currentProjectId).update({ workTypes: types });
    currentProjectData.workTypes = types;
    await customAlert("પ્રકાર સેવ થયા!");
    document.getElementById('editCustomType').value = '';
    loadProjects();
}

function renderProjectPhotos(photos) {
    const grid = document.getElementById('projectPhotosGrid');
    grid.innerHTML = photos.map((p, index) => {
        const label = p.type || p.category || 'અન્ય';
        return `
        <div class="photo-item">
            <img src="${p.url}" alt="${label}">
            <span class="badge" style="position:absolute; bottom:5px; left:5px;">${label}</span>
            <button class="delete-photo" onclick="deleteProjectPhoto(${index})"><i class="fa-solid fa-trash"></i></button>
        </div>
        `;
    }).join('');
}

async function uploadProjectPhoto() {
    const fileInput = document.getElementById('projectImageInput');
    const category = document.getElementById('photoCategory').value;
    const btn = document.getElementById('projUploadBtn');
    if(!fileInput.files[0]) return customAlert("ફોટો પસંદ કરો");
    if(!category) return customAlert("ફોટોનો પ્રકાર પસંદ કરો");

    btn.disabled = true; btn.innerText = "અપલોડ...";
    const formData = new FormData(); formData.append("image", fileInput.files[0]);

    try {
        // Get Firebase auth token for secure upload
        const user = auth.currentUser;
        if (!user) {
            throw new Error("તમે લોગિન કરેલા નથી");
        }
        const token = await user.getIdToken();
        
        const res = await fetch("/api/upload", { 
            method: "POST", 
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData 
        });
        if(!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(err.message || "અપલોડ નિષ્ફળ");
        }
        const data = await res.json();
        
        const docRef = db.collection('projects').doc(currentProjectId);
        const doc = await docRef.get();
        const photos = doc.data().photos || [];
        const images = doc.data().images || [];
        
        const safeCategory = category || 'અન્ય';
        if(!data.url) throw new Error('અપલોડથી URL મળ્યો નથી');

        photos.push({ url: data.url, category: safeCategory, type: safeCategory });
        images.push(data.url); // Legacy compatibility

        await docRef.update({ photos, images });
        renderProjectPhotos(photos);
        fileInput.value = "";
    } catch (e) { customAlert(e.message); }
    finally { btn.disabled = false; btn.innerText = "ફોટો અપલોડ કરો"; }
}

async function deleteProjectPhoto(index) {
    if(!(await customConfirm("કાઢી નાખવો છે?"))) return;
    const docRef = db.collection('projects').doc(currentProjectId);
    const doc = await docRef.get();
    const photos = doc.data().photos;
    photos.splice(index, 1);
    await docRef.update({ photos });
    renderProjectPhotos(photos);
}

async function markProjectComplete() {
    if(!(await customConfirm("શું આ કામ પૂર્ણ થઈ ગયું છે?"))) return;
    const today = new Date().toISOString().split('T')[0];

    const defaultAmount = (currentProjectData && (currentProjectData.finalAmount || currentProjectData.totalAmount)) || 0;
    const amountStr = await customPrompt("આ કામ માટે લેવાયેલ રકમ (₹)", defaultAmount.toString());
    const finalAmount = amountStr === null ? null : parseFloat(amountStr) || 0;
    if(finalAmount === null) return;

    await db.collection('projects').doc(currentProjectId).update({ status: 'Completed', endDate: today, finalAmount });
    await customAlert("કામ પૂર્ણ થયું!");
    closeModal('projectDetailModal');
    loadProjects();
}

async function deleteProject() {
    if(!currentProjectId) return;
    if(!(await customConfirm("⚠️ Dev only: આ કામ પૂરેપૂરું કાઢી નાખવું?"))) return;
    await db.collection('projects').doc(currentProjectId).delete();
    await customAlert("કામ ડિલીટ થયું (dev)!");
    closeModal('projectDetailModal');
    loadProjects();
}
