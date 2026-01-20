// Worker Management

function addWorker() {
    const name = document.getElementById('wName').value;
    const wage = parseFloat(document.getElementById('wWage').value);
    const role = document.getElementById('wRole').value;

    if(!name || !wage) {
        alert("વિગત ભરો");
        return;
    }

    db.collection('workers').add({
        name,
        dailyWage: wage,
        role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("કારીગર ઉમેરાઈ ગયો!");
        closeModal('addWorkerModal');
        loadWorkers();
    }).catch(err => showError(err.message));
}

function loadWorkers() {
    const container = document.getElementById('workersList');
    db.collection('workers').orderBy('name').get().then(snapshot => {
        container.innerHTML = '';
        if(snapshot.empty) {
            container.innerHTML = '<p class="text-center">કોઈ કારીગર નથી</p>';
            return;
        }

        snapshot.forEach(doc => {
            const w = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <div>
                    <h4>${w.name}</h4>
                    <p>${w.role}</p>
                </div>
                <div class="amount">₹${w.dailyWage}/day</div>
            `;
            container.appendChild(div);
        });
    });
}
