// Project Management

function addProject() {
    const name = document.getElementById('pName').value;
    const village = document.getElementById('pVillage').value;
    const category = document.getElementById('pCategory').value;
    const feet = parseFloat(document.getElementById('pFeet').value) || 0;

    if(!name || !feet) {
        alert("નામ અને ફૂટ જરૂરી છે");
        return;
    }

    // Get current rate to lock it in
    db.collection('settings').doc('rates').get().then(doc => {
        const rate = doc.exists ? doc.data().perFoot : 0;
        const expectedIncome = feet * rate;

        db.collection('projects').add({
            name,
            village,
            category,
            feet,
            rateLocked: rate,
            expectedIncome,
            status: 'New', // New, Ongoing, Completed
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("પ્રોજેક્ટ ઉમેરાઈ ગયો!");
            closeModal('addProjectModal');
            loadProjects();
        }).catch(err => showError(err.message));
    });
}

function loadProjects() {
    const container = document.getElementById('projectsList');
    container.innerHTML = '<p class="text-center">લોડ થાય છે...</p>';

    db.collection('projects').orderBy('createdAt', 'desc').get().then(snapshot => {
        container.innerHTML = '';
        if(snapshot.empty) {
            container.innerHTML = '<p class="text-center">કોઈ પ્રોજેક્ટ નથી</p>';
            return;
        }

        snapshot.forEach(doc => {
            const p = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div>
                    <h4>${p.name} <small>(${p.village})</small></h4>
                    <p>${p.category} | ${p.status}</p>
                </div>
                <div class="text-right">
                    <div class="amount">₹${p.expectedIncome.toLocaleString('en-IN')}</div>
                    <p>${p.feet} ft</p>
                </div>
            `;
            container.appendChild(div);
        });
    });
}
