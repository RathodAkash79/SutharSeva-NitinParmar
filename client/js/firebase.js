// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCN7K3itKRzzs0FcrgXopPnGytpB-8sb0g",
  authDomain: "sutharseva-nitinparmar.firebaseapp.com",
  projectId: "sutharseva-nitinparmar",
  storageBucket: "sutharseva-nitinparmar.firebasestorage.app",
  messagingSenderId: "804703586458",
  appId: "1:804703586458:web:813cddd31e17b247457723",
  measurementId: "G-R7QJ8QLDLS"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Configure persistence to keep user logged in across refreshes
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Persistence error:", error);
  });

// Helper to check auth
function checkAuth() {
    auth.onAuthStateChanged(user => {
        const path = window.location.pathname.toLowerCase();
        // More robust admin page detection
        const isPageAdmin = path.includes('admin.html');
        
        console.log("DEBUG - Path:", path, "Is Admin:", isPageAdmin, "User:", user ? user.email : "None");

        if (user) {
            if(isPageAdmin) {
                const loginScreen = document.getElementById('loginScreen');
                const adminDashboard = document.getElementById('adminDashboard');
                if (loginScreen) loginScreen.style.display = 'none';
                if (adminDashboard) adminDashboard.style.display = 'block';
                loadDashboardData();
            }
        } else {
            if(isPageAdmin) {
                const loginScreen = document.getElementById('loginScreen');
                const adminDashboard = document.getElementById('adminDashboard');
                if (loginScreen) loginScreen.style.display = 'flex';
                if (adminDashboard) adminDashboard.style.display = 'none';
            }
        }
    });
}

// Global Error Handler
function showError(msg) {
    alert("ભૂલ: " + msg);
}

// Export for other files (implicitly global in vanilla JS)
