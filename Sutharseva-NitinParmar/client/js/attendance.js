// Attendance System

let selectedDate = new Date();

function changeDate(days) {
    selectedDate.setDate(selectedDate.getDate() + days);
    loadAttendanceUI();
}

function formatDate(date) {
    return date.toLocaleDateString('gu-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function loadAttendanceUI() {
    document.getElementById('attendanceDate').textContent = formatDate(selectedDate);

    const container = document.getElementById('attendanceList');
    container.innerHTML = 'લોડ થાય છે...';

    // 1. Get all workers
    db.collection('workers').get().then(async (snapshot) => {
        if(snapshot.empty) {
            container.innerHTML = 'પહેલા કારીગર ઉમેરો';
            return;
        }

        container.innerHTML = '';

        // 2. Get existing attendance for this date
        const dateKey = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const attSnapshot = await db.collection('attendance')
            .where('date', '==', dateKey)
            .get();

        const attendanceMap = {};
        attSnapshot.forEach(doc => {
            attendanceMap[doc.data().workerId] = doc.data();
        });

        snapshot.forEach(doc => {
            const w = doc.data();
            const wId = doc.id;
            const currentStatus = attendanceMap[wId] ? attendanceMap[wId].status : 'Absent';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.margin = '0 0 10px 0';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <h4>${w.name}</h4>
                    <small>${w.role}</small>
                </div>
                <div class="attendance-grid">
                    <div class="att-btn ${currentStatus === 'Full' ? 'selected' : ''}"
                         onclick="markAttendance('${wId}', '${w.name}', ${w.dailyWage}, 'Full', '${dateKey}')">
                        🟢 પૂર્ણ દિવસ
                    </div>
                    <div class="att-btn ${currentStatus === 'Half' ? 'selected' : ''}"
                         onclick="markAttendance('${wId}', '${w.name}', ${w.dailyWage}, 'Half', '${dateKey}')">
                        🟡 અડધો દિવસ
                    </div>
                    <div class="att-btn ${currentStatus === 'Absent' ? 'selected' : ''}"
                         onclick="markAttendance('${wId}', '${w.name}', ${w.dailyWage}, 'Absent', '${dateKey}')">
                        🔴 ગેરહાજર
                    </div>
                    <div class="att-btn ${currentStatus === 'Night' ? 'selected' : ''}"
                         onclick="markAttendance('${wId}', '${w.name}', ${w.dailyWage}, 'Night', '${dateKey}')">
                        🌙 રાત સુધી
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function markAttendance(workerId, workerName, dailyWage, status, dateKey) {
    let multiplier = 0;
    if(status === 'Full') multiplier = 1;
    if(status === 'Half') multiplier = 0.5;
    if(status === 'Night') multiplier = 1.5;
    if(status === 'Absent') multiplier = 0;

    const payable = dailyWage * multiplier;

    // Use a composite ID for simplicity: date_workerId
    const docId = `${dateKey}_${workerId}`;

    db.collection('attendance').doc(docId).set({
        date: dateKey,
        workerId,
        workerName,
        status,
        payable,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        // Refresh UI to show selection
        loadAttendanceUI();
    }).catch(err => showError(err.message));
}
