// Admin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogin();
});

function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        // Set default credentials for testing
        document.getElementById('email').value = "user@mail.com";
        document.getElementById('password').value = "password";

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    // checkAuth() handler handles UI switch
                })
                .catch((error) => {
                    alert("લોગિન નિષ્ફળ: " + error.message);
                });
        });
    }
}

function logout() {
    auth.signOut().then(() => {
        window.location.reload();
    });
}

// UI Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.admin-nav button').forEach(el => el.classList.remove('active'));

    // Show target
    document.getElementById(sectionId).style.display = 'block';

    // Activate tab
    if(sectionId === 'projectsSection') document.getElementById('nav-projects').classList.add('active');
    if(sectionId === 'attendanceSection') document.getElementById('nav-attendance').classList.add('active');
    if(sectionId === 'workersSection') document.getElementById('nav-workers').classList.add('active');

    // Load Data
    if(sectionId === 'projectsSection') loadProjects();
    if(sectionId === 'workersSection') loadWorkers();
    if(sectionId === 'attendanceSection') loadAttendanceUI();
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Global Data Loaders
function loadDashboardData() {
    showSection('projectsSection'); // Default view
    // Load summary stats could go here
    calculateSummary();
}

function calculateSummary() {
    // Simple logic to sum up project income
    // In real app, querying Firestore efficiently is key
}

// Rate Management
function updateRate() {
    const newRate = parseFloat(document.getElementById('newRateInput').value);
    if(!newRate) return;

    db.collection('settings').doc('rates').set({
        perFoot: newRate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("રેટ અપડેટ થઈ ગયો!");
        closeModal('rateModal');
    })
    .catch(err => showError(err.message));
}
