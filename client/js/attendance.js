// Attendance System - Calendar Based
let calendarDate = new Date();
let selectedHajriDate = new Date().toISOString().split('T')[0];

function changeMonth(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
}

function formatDateGuj(date) {
    const months = ["જાન્યુઆરી", "ફેબ્રુઆરી", "માર્ચ", "એપ્રિલ", "મે", "જૂન", "જુલાઈ", "ઓગસ્ટ", "સપ્ટેમ્બર", "ઓક્ટોબર", "નવેમ્બર", "ડિસેમ્બર"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function renderCalendar() {
    document.getElementById('currentMonthYear').textContent = formatDateGuj(calendarDate);
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empty spaces for first week
    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const div = document.createElement('div');
        div.className = `calendar-day ${dateStr === selectedHajriDate ? 'selected' : ''}`;
        div.textContent = day;
        div.onclick = () => selectHajriDate(dateStr);
        grid.appendChild(div);
    }
    loadDayAttendance();
}

function selectHajriDate(dateStr) {
    selectedHajriDate = dateStr;
    renderCalendar();
}

async function loadDayAttendance() {
    try {
        const title = document.getElementById('selectedDateTitle');
        const dateObj = new Date(selectedHajriDate);
        title.textContent = `તારીખ: ${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;

        const container = document.getElementById('attendanceList');
        container.innerHTML = '<p class="text-center">લોડ થઈ રહ્યું છે...</p>';

        const workersSnap = await db.collection('workers').get();
        
        if (workersSnap.empty) {
            container.innerHTML = '<div class="text-center" style="padding: 40px 20px; color: var(--text-light);"><p style="margin-bottom: 20px;">અહીં કોઈ કારીગર નથી.</p><p style="font-size: 14px;">કૃપા કરીને પહેલા કારીગર ઉમેરો.</p></div>';
            return;
        }

        const attSnap = await db.collection('attendance').where('date', '==', selectedHajriDate).get();
        const paymentsSnap = await db.collection('payments').where('date', '==', selectedHajriDate).get();

        const attMap = {}; attSnap.forEach(doc => attMap[doc.data().workerId] = doc.data());
        const payMap = {}; paymentsSnap.forEach(doc => payMap[doc.data().workerId] = (payMap[doc.data().workerId] || 0) + doc.data().amount);

        container.innerHTML = '';
        workersSnap.forEach(doc => {
            const w = doc.data();
            const wId = doc.id;
            const status = attMap[wId] ? attMap[wId].status : 'Absent';
            const paidToday = payMap[wId] || 0;

            const card = document.createElement('div');
            card.className = 'card';
            card.style.margin = '0 0 10px 0';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>${w.name}</h4>
                    ${paidToday > 0 ? `<span style="color:var(--success); font-weight:700;">લીધેલા: ₹${paidToday}</span>` : ''}
                </div>
                <div class="attendance-options">
                    <div class="att-opt ${status === 'Full' ? 'selected' : ''}" onclick="saveHajri('${wId}', '${w.name}', ${w.dailyWage}, 'Full')">પૂર્ણ દિવસ</div>
                    <div class="att-opt ${status === 'Half' ? 'selected' : ''}" onclick="saveHajri('${wId}', '${w.name}', ${w.dailyWage}, 'Half')">અડધો દિવસ</div>
                    <div class="att-opt ${status === 'Night' ? 'selected' : ''}" onclick="saveHajri('${wId}', '${w.name}', ${w.dailyWage}, 'Night')">રાત સુધી</div>
                    <div class="att-opt ${status === 'Absent' ? 'selected' : ''}" onclick="saveHajri('${wId}', '${w.name}', ${w.dailyWage}, 'Absent')">ગેરહાજર</div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('હાજરી લોડ કરવામાં ભૂલ:', error);
        document.getElementById('attendanceList').innerHTML = '<p class="text-center" style="color: red; padding: 20px;">ભૂલ: ' + error.message + '</p>';
    }
}

function saveHajri(workerId, workerName, dailyWage, status) {
    let mult = 0;
    if(status === 'Full') mult = 1; else if(status === 'Half') mult = 0.5; else if(status === 'Night') mult = 1.5;
    const payable = dailyWage * mult;
    db.collection('attendance').doc(`${selectedHajriDate}_${workerId}`).set({
        date: selectedHajriDate, workerId, workerName, status, payable, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        loadDayAttendance();
    }).catch(error => {
        alert('ભૂલ: ' + error.message);
    });
}

function loadAttendanceUI() { renderCalendar(); }
