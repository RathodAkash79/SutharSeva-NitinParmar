// Admin Dashboard Logic - Summary & Navigation
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogin();
});

function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        document.getElementById('email').value = "user@mail.com";
        document.getElementById('password').value = "password";
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            auth.signInWithEmailAndPassword(
                document.getElementById('email').value,
                document.getElementById('password').value
            ).catch((error) => alert("લોગિન નિષ્ફળ: " + error.message));
        });
    }
}

function logout() { auth.signOut().then(() => window.location.reload()); }

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-nav button').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('nav-' + sectionId.replace('Section', '')).classList.add('active');

    if(sectionId === 'projectsSection') loadProjects();
    if(sectionId === 'workersSection') loadWorkers();
    if(sectionId === 'attendanceSection') loadAttendanceUI();
}

function showModal(id) { 
    const modal = document.getElementById(id);
    modal.style.display = 'flex';
}

function closeModal(id) { 
    const modal = document.getElementById(id);
    modal.style.display = 'none';
}

function loadDashboardData() {
    showSection('projectsSection');
    updateDashboardSummary();
}

async function updateDashboardSummary() {
    const projectsSnap = await db.collection('projects').get();
    const attSnap = await db.collection('attendance').get();
    
    let totalIncome = 0;
    let totalMajduri = 0;

    projectsSnap.forEach(doc => {
        const p = doc.data();
        if(p.status === 'Completed') totalIncome += (p.totalAmount || 0);
    });

    attSnap.forEach(doc => {
        totalMajduri += (doc.data().payable || 0);
    });

    document.getElementById('monthIncome').textContent = `₹${totalIncome.toLocaleString('en-IN')}`;
    document.getElementById('monthMajduri').textContent = `₹${totalMajduri.toLocaleString('en-IN')}`;
    document.getElementById('monthProfit').textContent = `₹${(totalIncome - totalMajduri).toLocaleString('en-IN')}`;
}
