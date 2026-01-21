// Worker Management - Admin
let currentWorkerId = null;

function addWorker() {
    const name = document.getElementById('wName').value.trim();
    const phone = document.getElementById('wPhone').value.trim();
    const village = document.getElementById('wVillage').value.trim();
    const specialty = document.getElementById('wSpecialty').value;
    const wage = parseFloat(document.getElementById('wWage').value);
    
    if(!name || !phone || !specialty || !wage) {
        return alert("તમામ આવશ્યક માહિતી ભરો");
    }
    
    db.collection('workers').add({
        name, 
        phone, 
        village,
        specialty,
        dailyWage: wage,
        status: 'active',
        totalEarned: 0,
        totalPaid: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        // Clear form
        document.getElementById('wName').value = '';
        document.getElementById('wPhone').value = '';
        document.getElementById('wVillage').value = '';
        document.getElementById('wSpecialty').value = '';
        document.getElementById('wWage').value = '';
        
        alert("કારીગર ઉમેરાયો!");
        closeModal('addWorkerModal');
        loadWorkers();
    }).catch(err => alert("ભૂલ: " + err.message));
}

function loadWorkers() {
    const container = document.getElementById('workersList');
    container.innerHTML = '<p class="text-center">લોડ થઈ રહ્યું છે...</p>';
    db.collection('workers').orderBy('name').get().then(snapshot => {
        container.innerHTML = '';
        if(snapshot.empty) {
            container.innerHTML = '<div style="padding:40px 20px; text-align:center; color:var(--text-light);"><p style="margin-bottom:10px;">કોઈ કારીગર નથી.</p><p style="font-size:14px;">નવો ઉમેરવા માટે ઉપર બટન પર ક્લિક કરો.</p></div>';
            return;
        }
        snapshot.forEach(doc => {
            const w = doc.data();
            const div = document.createElement('div');
            div.className = 'list-item';
            div.onclick = () => openWorkerDetail(doc.id, w);
            div.innerHTML = `
                <div>
                    <h4>${w.name}</h4>
                    <p>${w.specialty ? '🔨 ' + w.specialty : ''} | ${w.phone || ''}</p>
                    <small style="color:#999;">₹${w.dailyWage}/દિવસ</small>
                </div>
                <i class="fa-solid fa-chevron-right text-light"></i>
            `;
            container.appendChild(div);
        });
    }).catch(error => {
        container.innerHTML = '<p class="text-center" style="color: red; padding: 20px;">ભૂલ: ' + error.message + '</p>';
        console.error('કારીગર લોડ કરવામાં ભૂલ:', error);
    });
}

async function openWorkerDetail(id, w) {
    currentWorkerId = id;
    document.getElementById('detailWorkerName').textContent = w.name;
    document.getElementById('workerPhone').textContent = w.phone || '-';
    document.getElementById('workerSpecialty').textContent = w.specialty || '-';
    document.getElementById('workerWage').textContent = w.dailyWage;
    showModal('workerDetailModal');

    // Calculate Totals
    const attSnap = await db.collection('attendance').where('workerId', '==', id).get();
    const paySnap = await db.collection('payments').where('workerId', '==', id).get();

    let totalPayable = 0; attSnap.forEach(d => totalPayable += (d.data().payable || 0));
    let totalPaid = 0; paySnap.forEach(d => totalPaid += (d.data().amount || 0));

    document.getElementById('workerTotalPayable').textContent = `₹${totalPayable.toLocaleString('en-IN')}`;
    document.getElementById('workerTotalPaid').textContent = `₹${totalPaid.toLocaleString('en-IN')}`;
    document.getElementById('workerBalance').textContent = `₹${(totalPayable - totalPaid).toLocaleString('en-IN')}`;
}

async function addPayment() {
    const amount = parseFloat(document.getElementById('paymentAmount').value);
    if(!amount) return alert("રકમ લખો");
    
    await db.collection('payments').add({
        workerId: currentWorkerId,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("ચુકવણી સેવ થઈ!");
    document.getElementById('paymentAmount').value = '';
    const wDoc = await db.collection('workers').doc(currentWorkerId).get();
    openWorkerDetail(currentWorkerId, wDoc.data());
}
