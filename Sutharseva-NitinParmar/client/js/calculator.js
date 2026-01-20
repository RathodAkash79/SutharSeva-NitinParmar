// Calculator Logic for Customer Site

document.addEventListener('DOMContentLoaded', () => {
    fetchCurrentRate();
    setupCalculator();
    loadVillages();
    loadGallery();
});

let currentRate = 0; // Will be fetched from Firestore

function fetchCurrentRate() {
    db.collection('settings').doc('rates').get().then(doc => {
        if (doc.exists) {
            currentRate = doc.data().perFoot || 0;
            document.getElementById('currentRate').textContent = currentRate;
        } else {
            console.log("Rate not set");
        }
    }).catch(error => {
        console.error("Error fetching rate:", error);
    });
}

function setupCalculator() {
    const feetInput = document.getElementById('feetInput');
    feetInput.addEventListener('input', calculateTotal);
}

function calculateTotal() {
    const feet = parseFloat(document.getElementById('feetInput').value) || 0;
    const total = feet * currentRate;
    document.getElementById('totalCost').textContent = '₹' + total.toLocaleString('en-IN');
}

function sendEstimateToWhatsapp() {
    const feet = document.getElementById('feetInput').value;
    const total = document.getElementById('totalCost').textContent;

    if(!feet) {
        alert("કૃપા કરીને ફૂટ દાખલ કરો.");
        return;
    }

    const message = `જય શ્રી વિશ્વકર્મા! %0a%0aમારે ${feet} ફૂટ ફર્નિચરનું કામ છે. %0aઅંદાજિત ખર્ચ: ${total} થાય છે. %0a%0aવધુ વિગત માટે વાત કરવા વિનંતી.`;
    const number = "918160911612"; // Nitin Parmar's number
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
}

function loadVillages() {
    const container = document.getElementById('villageList');
    db.collection('projects').get().then(snapshot => {
        const villages = new Set();
        snapshot.forEach(doc => {
            const data = doc.data();
            if(data.village) villages.add(data.village);
        });

        if(villages.size === 0) {
            container.innerHTML = '<span class="chip">કોઈ ગામ ઉપલબ્ધ નથી</span>';
            return;
        }

        container.innerHTML = '';
        villages.forEach(v => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = v;
            container.appendChild(chip);
        });
    }).catch(err => console.error(err));
}

function loadGallery() {
    const container = document.getElementById('galleryGrid');
    // For demo, we are just listing placeholders.
    // Real implementation would list files from Storage or a 'gallery' collection.

    // Simulating empty gallery
    container.innerHTML = '<div class="gallery-placeholder">ગેલેરી જલ્દી આવી રહી છે...</div>';
}
