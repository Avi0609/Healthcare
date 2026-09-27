
function dateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const isoDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return {
        date: isoDate,
        day: date.toLocaleDateString("en", { day: "2-digit" }),
        month: date.toLocaleDateString("en", { month: "short" }).toUpperCase()
    };
}

const defaultAppointments = [
    { id: "apt-1", ...dateOffset(0), time: "10:30 AM", name: "Dr. Emily Chen", specialty: "General physician", kind: "Video consultation", initials: "EC", tone: "lavender", status: "Confirmed" },
    { id: "apt-2", ...dateOffset(2), time: "02:00 PM", name: "Dr. Noah Williams", specialty: "Cardiologist", kind: "In-person visit", initials: "NW", tone: "mint", status: "Confirmed" }
];
const doctors = [
    { name: "Dr. Emily Chen", specialty: "General physician · 8 years experience", rating: "★ 4.9", initials: "EC", tone: "lavender", modes: "Video · In person" },
    { name: "Dr. Noah Williams", specialty: "Cardiologist · 12 years experience", rating: "★ 4.8", initials: "NW", tone: "mint", modes: "Video · In person" },
    { name: "Dr. Priya Patel", specialty: "Dermatologist · 10 years experience", rating: "★ 5.0", initials: "PP", tone: "peach", modes: "Video consultation" }
];
const defaultReminders = [
    { id: "med-1", medicine: "Vitamin D3", detail: "1 tablet · After lunch", time: "02:30 PM", icon: "✳", tone: "" },
    { id: "med-2", medicine: "Omega-3", detail: "1 capsule · With food", time: "08:00 PM", icon: "◉", tone: "blue-dot" }
];
const defaultRecords = [
    { name: "Complete blood count", kind: "Lab report", date: "May 16, 2025", icon: "▤" },
    { name: "Annual health checkup", kind: "Visit summary", date: "April 28, 2025", icon: "＋" },
    { name: "Vitamin D prescription", kind: "Prescription", date: "April 28, 2025", icon: "✳" },
    { name: "Blood type report", kind: "Lab report", date: "March 12, 2025", icon: "♥" }
];
const storageKey = "carely-health-demo-v1";
const appData = loadData();
const toast = document.getElementById("toast");
const modalBackdrop = document.getElementById("modalBackdrop");
let toastTimeout;

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && Array.isArray(saved.appointments) && Array.isArray(saved.reminders)) {
            return { ...saved, records: Array.isArray(saved.records) ? saved.records : defaultRecords };
        }
    } catch (error) {
        console.warn("Carely could not load saved demo data.", error);
    }
    return { appointments: defaultAppointments, reminders: defaultReminders, records: defaultRecords };
}

function saveData() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(appData));
    } catch (error) {
        console.error("Carely could not save demo data.", error);
        showToast("Could not save changes in this browser.");
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function todayString() {
    return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()).toUpperCase();
}

function shortDate(isoDate) {
    const date = new Date(`${isoDate}T12:00:00`);
    return { day: date.toLocaleDateString("en", { day: "2-digit" }), month: date.toLocaleDateString("en", { month: "short" }).toUpperCase() };
}

function renderOverview() {
    document.getElementById("welcomeEyebrow").textContent = todayString();
    document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
    document.getElementById("appointmentCount").textContent = String(appData.appointments.length).padStart(2, "0");
    document.querySelector(".nav-item[data-view='appointments'] .nav-count").textContent = appData.appointments.length;
    document.getElementById("recordCount").textContent = String(appData.records.length).padStart(2, "0");
    document.getElementById("recordUpdated").textContent = appData.records[0]?.date || "No records yet";
    document.getElementById("currentYear").textContent = new Date().getFullYear();
    const sortedAppointments = [...appData.appointments].sort((first, second) => first.date.localeCompare(second.date));
    document.getElementById("appointmentPreview").innerHTML = sortedAppointments.length
        ? sortedAppointments.slice(0, 2).map(appointment => `
            <div class="appointment-row">
                <div class="appointment-date"><strong>${escapeHtml(appointment.day)}</strong><small>${escapeHtml(appointment.month)}</small></div>
                <div class="appointment-details"><strong>${escapeHtml(appointment.name)}</strong><span>${escapeHtml(appointment.specialty)} · ${escapeHtml(appointment.kind)}</span></div>
                <span class="appointment-time">${escapeHtml(appointment.time)}</span><span class="appointment-status">${escapeHtml(appointment.status)}</span>
            </div>`).join("")
        : '<p class="empty-note">No upcoming appointments. Book a visit whenever you need one.</p>';
    document.getElementById("reminderPreview").innerHTML = appData.reminders.slice(0, 2).map(reminder => `
        <div class="reminder-row"><div class="medicine-dot ${escapeHtml(reminder.tone)}">${escapeHtml(reminder.icon)}</div>
        <div class="reminder-copy"><strong>${escapeHtml(reminder.medicine)}</strong><span>${escapeHtml(reminder.detail)}</span></div>
        <button class="reminder-check${reminder.takenOn === dateOffset(0).date ? " taken" : ""}" data-taken="${escapeHtml(reminder.id)}" aria-label="${reminder.takenOn === dateOffset(0).date ? "Already taken" : "Mark"} ${escapeHtml(reminder.medicine)}${reminder.takenOn === dateOffset(0).date ? "" : " as taken"}" ${reminder.takenOn === dateOffset(0).date ? "disabled" : ""}>✓</button></div>`).join("") ||
        '<p class="empty-note">No reminders yet. Add one to stay on track.</p>';
}

function openView(view) {
    const titles = {
        overview: ["Overview", "Good morning, Alex", "Here’s your health snapshot for today."],
        appointments: ["Appointments", "Your appointments", "Book a visit or keep track of your upcoming care."],
        donors: ["Donor matching", "Give hope. Find support.", "Explore blood and organ donor connections in your community."],
        reminders: ["Medicine reminders", "Your medicine schedule", "A little reminder can make a big difference."],
        records: ["Health records", "Your health, organized.", "A secure place to keep your health information close."]
    };
    const [title, heading, subtitle] = titles[view] || titles.overview;
    document.getElementById("breadcrumbCurrent").textContent = title;
    document.getElementById("pageTitle").innerHTML = `${heading}${view === "overview" ? ' <span class="wave">✳</span>' : ""}`;
    document.getElementById("pageSubtitle").textContent = subtitle;
    document.getElementById("overviewView").classList.toggle("hidden", view !== "overview");
    const detail = document.getElementById("detailView");
    detail.classList.toggle("hidden", view === "overview");
    document.querySelector(".page-heading > .button").classList.toggle("hidden", view !== "overview" && view !== "appointments");
    if (view !== "overview") renderDetail(view);
    document.querySelectorAll(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    document.getElementById("sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function detailHeading(kicker, title, description, action = "") {
    return `<div class="detail-header"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p></div>${action}</div>`;
}

function renderDetail(view) {
    const detail = document.getElementById("detailView");
    if (view === "appointments") {
        detail.innerHTML = `${detailHeading("FIND THE RIGHT CARE", "Available doctors", "Choose a trusted provider and schedule a consultation.", '<button class="button button-primary" data-action="book">＋ Book appointment</button>')}
            <div class="detail-grid"><div class="detail-card"><div class="filter-row"><button class="filter-chip active">All specialists</button><button class="filter-chip">Primary care</button><button class="filter-chip">Heart health</button></div>
            ${doctors.map(doctor => `<div class="doctor-card"><div class="doctor-avatar">${escapeHtml(doctor.initials)}</div><div class="doctor-info"><strong>${escapeHtml(doctor.name)}</strong><span>${escapeHtml(doctor.specialty)}</span><div class="doctor-rating">${escapeHtml(doctor.rating)} <span style="color:#999">· ${escapeHtml(doctor.modes)}</span></div></div><button class="button button-primary" data-doctor="${escapeHtml(doctor.name)}">Book visit</button></div>`).join("")}
            <h3 style="margin:20px 0 5px">Your upcoming visits</h3>${[...appData.appointments].sort((first, second) => first.date.localeCompare(second.date)).map(appointment => `<div class="appointment-row"><div class="appointment-date"><strong>${escapeHtml(appointment.day)}</strong><small>${escapeHtml(appointment.month)}</small></div><div class="appointment-details"><strong>${escapeHtml(appointment.name)}</strong><span>${escapeHtml(appointment.specialty)} · ${escapeHtml(appointment.kind)}</span></div><span class="appointment-time">${escapeHtml(appointment.time)}</span></div>`).join("") || '<p class="empty-note">No appointments booked yet.</p>'}
            </div><aside class="detail-card detail-side-note"><h3>Care from wherever you are</h3><p>Video consultations make it easier to speak with a clinician from home.</p><ul><li>Book a time that works for you</li><li>Have your health information ready</li><li>Use a private, comfortable space</li></ul><p>For emergencies, contact your local emergency services.</p></aside></div>`;
    } else if (view === "donors") {
        detail.innerHTML = `${detailHeading("COMMUNITY CARE", "Donor connections", "A demo directory to explore how donor matching can work.", '<button class="button button-primary" data-action="register-donor">＋ Register interest</button>')}
            <div class="detail-grid"><div class="detail-card"><div class="filter-row"><button class="filter-chip active">All donors</button><button class="filter-chip">Blood</button><button class="filter-chip">Organ</button></div>
            <div class="donor-profile"><div class="donor-avatar">♥</div><div class="donor-data"><strong>Blood donors near you</strong><p>Connect with verified local blood donation centers and learn about current community needs.</p><span class="match-label">COMMUNITY DIRECTORY</span></div></div>
            <div class="donor-profile"><div class="donor-avatar">✚</div><div class="donor-data"><strong>Organ donation information</strong><p>Learn about donor registration through official health authorities in your region.</p><span class="match-label">OFFICIAL RESOURCES</span></div></div>
            <div class="donor-profile"><div class="donor-avatar">♡</div><div class="donor-data"><strong>Become a registered donor</strong><p>Share your interest and our demo team will show you next steps for registration.</p><span class="match-label">YOUR CHOICE MATTERS</span></div></div></div>
            <aside class="detail-card detail-side-note"><h3>Safe, respectful connections</h3><p>Donor matching is sensitive and should always follow local laws and medical guidance.</p><ul><li>Never share personal health or contact information publicly</li><li>Use official registries and licensed medical teams</li><li>Matching and eligibility are decided by professionals</li></ul><p>This demo does not connect people or verify donor eligibility.</p></aside></div>`;
    } else if (view === "reminders") {
        detail.innerHTML = `${detailHeading("DAILY ROUTINE", "Your reminders", "Manage your personal medicine schedule.", '<button class="button button-primary" data-action="add-reminder">＋ Add reminder</button>')}
            <div class="detail-card"><h3>Today</h3><p>Keep your schedule up to date. Always follow your clinician’s instructions.</p>${appData.reminders.map(reminder => `<div class="reminder-detail-row"><div class="medicine-dot ${escapeHtml(reminder.tone)}">${escapeHtml(reminder.icon)}</div><div class="reminder-copy"><strong>${escapeHtml(reminder.medicine)}</strong><span>${escapeHtml(reminder.detail)} · ${escapeHtml(reminder.time)}</span></div><button data-taken="${escapeHtml(reminder.id)}" ${reminder.takenOn === dateOffset(0).date ? "disabled" : ""}>${reminder.takenOn === dateOffset(0).date ? "Taken ✓" : "Mark taken"}</button></div>`).join("") || '<p class="empty-note">No reminders yet. Add a medicine to start your schedule.</p>'}</div>`;
    } else if (view === "records") {
        detail.innerHTML = `${detailHeading("YOUR PERSONAL HEALTH LIBRARY", "Health records", "View the health information you’ve saved in this demo.", '<button class="button button-primary" data-action="upload-record">＋ Add a record</button>')}
            <div class="detail-card"><div class="filter-row"><button class="filter-chip active">All records</button><button class="filter-chip">Lab reports</button><button class="filter-chip">Prescriptions</button><button class="filter-chip">Visit summaries</button></div><div class="record-list">${appData.records.map(record => `<div class="record-row"><div class="record-type">${escapeHtml(record.icon)}</div><div class="record-copy"><strong>${escapeHtml(record.name)}</strong><span>${escapeHtml(record.kind)} · ${escapeHtml(record.date)}</span></div><button data-record="${escapeHtml(record.name)}">View details</button></div>`).join("")}</div><div class="modal-note">Your real medical records are not stored here. Use a secure, provider-approved service for sensitive health documents.</div></div>`;
    }
}

function showModal(content) {
    document.getElementById("modalContent").innerHTML = content;
    modalBackdrop.classList.remove("hidden");
    const firstField = modalBackdrop.querySelector("input, select, textarea");
    if (firstField) firstField.focus();
}

function closeModal() {
    modalBackdrop.classList.add("hidden");
}

function showSuccess(title, message) {
    showModal(`<div class="success-state"><div class="success-icon">✓</div><h2 id="modalTitle">${title}</h2><p>${message}</p><button class="button button-primary" data-close-modal>Done</button></div>`);
}

function openBookingModal(selectedDoctor = "") {
    const today = new Date();
    const minimum = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    showModal(`<p class="eyebrow">LET’S GET YOU THE RIGHT CARE</p><h2 id="modalTitle">Book an appointment</h2><p class="modal-intro">Choose a provider and a time that works for you.</p>
        <form id="bookingForm"><div class="form-grid">
        <div class="form-field full"><label for="doctorSelect">Choose a doctor</label><select id="doctorSelect" required>${doctors.map(doctor => `<option value="${escapeHtml(doctor.name)}" ${doctor.name === selectedDoctor ? "selected" : ""}>${doctor.name} — ${doctor.specialty.split(" · ")[0]}</option>`).join("")}</select></div>
        <div class="form-field"><label for="appointmentDate">Date</label><input id="appointmentDate" type="date" min="${minimum}" value="${minimum}" required></div>
        <div class="form-field"><label for="appointmentTime">Available time</label><select id="appointmentTime" required><option>09:00 AM</option><option>10:30 AM</option><option>01:00 PM</option><option>02:00 PM</option><option>04:30 PM</option></select></div>
        <div class="form-field full"><label for="appointmentType">Appointment type</label><select id="appointmentType"><option>Video consultation</option><option>In-person visit</option></select></div></div><button class="button button-primary form-submit" type="submit">Confirm appointment</button></form>
        <div class="modal-note">Demo only: this prototype does not contact a clinic or reserve a real appointment.</div>`);
}

function openReminderModal() {
    showModal(`<p class="eyebrow">A GENTLE NUDGE</p><h2 id="modalTitle">Add a medicine reminder</h2><p class="modal-intro">Create a personal reminder for your daily routine.</p>
        <form id="reminderForm"><div class="form-grid"><div class="form-field full"><label for="medicineName">Medicine name</label><input id="medicineName" maxlength="60" placeholder="e.g. Vitamin D3" required></div>
        <div class="form-field"><label for="medicineDose">Dose and instructions</label><input id="medicineDose" maxlength="80" placeholder="e.g. 1 tablet · With food" required></div>
        <div class="form-field"><label for="medicineTime">Reminder time</label><input id="medicineTime" type="time" value="08:00" required></div></div><button class="button button-primary form-submit" type="submit">Save reminder</button></form><div class="modal-note">Follow the medicine instructions provided by your healthcare professional.</div>`);
}

function handleAction(action) {
    if (action === "book") openBookingModal();
    if (action === "add-reminder") openReminderModal();
    if (action === "register-donor") {
        showModal(`<p class="eyebrow">MAKE A DIFFERENCE</p><h2 id="modalTitle">Register your interest</h2><p class="modal-intro">Tell us how you’d like to learn about becoming a donor. Your information stays in this browser demo only.</p>
        <form id="donorForm"><div class="form-grid"><div class="form-field full"><label for="donorType">I’m interested in</label><select id="donorType"><option>Blood donation</option><option>Organ donation</option><option>Both</option></select></div><div class="form-field full"><label for="donorEmail">Email address</label><input id="donorEmail" type="email" placeholder="you@example.com" required></div></div><button class="button button-primary form-submit" type="submit">Save my interest</button></form><div class="modal-note">This is not an official registration. Please contact your local health authority or donation center to register.</div>`);
    }
    if (action === "upload-record") {
        showModal(`<p class="eyebrow">PERSONAL HEALTH LIBRARY</p><h2 id="modalTitle">Add a record</h2><p class="modal-intro">Add a label to your demo health-record list.</p><form id="recordForm"><div class="form-grid"><div class="form-field full"><label for="recordName">Record name</label><input id="recordName" maxlength="60" placeholder="e.g. Blood test results" required></div><div class="form-field full"><label for="recordKind">Record type</label><select id="recordKind"><option>Lab report</option><option>Prescription</option><option>Visit summary</option><option>Other</option></select></div></div><button class="button button-primary form-submit" type="submit">Add record</button></form><div class="modal-note">This demo stores no uploaded medical files. Do not enter sensitive personal health information.</div>`);
    }
}

document.addEventListener("click", event => {
    const target = event.target.closest("button");
    if (!target) return;
    if (target.dataset.view) openView(target.dataset.view);
    if (target.dataset.viewLink) openView(target.dataset.viewLink);
    if (target.dataset.action) handleAction(target.dataset.action);
    if (target.dataset.doctor) openBookingModal(target.dataset.doctor);
    if (target.dataset.closeModal !== undefined) closeModal();
    if (target.dataset.taken) {
        const medicine = appData.reminders.find(item => item.id === target.dataset.taken);
        if (medicine && medicine.takenOn !== dateOffset(0).date) {
            medicine.takenOn = dateOffset(0).date;
            saveData();
            renderOverview();
            const activeView = document.querySelector(".nav-item.active")?.dataset.view;
            if (activeView === "reminders") renderDetail(activeView);
            showToast(`${medicine.medicine} marked as taken.`);
        }
    }
    if (target.dataset.record) showToast(`${target.dataset.record} is a sample record in this demo.`);
    if (target.id === "modalClose") closeModal();
    if (target.id === "menuButton") document.getElementById("sidebar").classList.toggle("open");
    if (target.id === "notificationButton") showToast("You’re all caught up.");
    if (target.id === "helpButton") showToast("Care team support: hello@carely.example");
    if (target.id === "profileButton") showToast("You’re viewing Alex Morgan’s demo account.");
    if (target.classList.contains("filter-chip")) {
        target.parentElement.querySelectorAll(".filter-chip").forEach(chip => chip.classList.remove("active"));
        target.classList.add("active");
        showToast("Filters are for preview only in this demo.");
    }
});

document.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target.id === "bookingForm") {
        const doctorName = document.getElementById("doctorSelect").value;
        const doctor = doctors.find(item => item.name === doctorName);
        const dateValue = document.getElementById("appointmentDate").value;
        if (!dateValue || dateValue < dateOffset(0).date) {
            showToast("Choose a valid appointment date.");
            return;
        }
        const date = shortDate(dateValue);
        appData.appointments.push({
            id: `apt-${Date.now()}`, day: date.day, month: date.month, date: dateValue,
            time: document.getElementById("appointmentTime").value, name: doctorName,
            specialty: doctor.specialty.split(" · ")[0], kind: document.getElementById("appointmentType").value,
            initials: doctor.initials, tone: doctor.tone, status: "Confirmed"
        });
        saveData();
        renderOverview();
        showSuccess("Appointment added", `Your demo appointment with ${escapeHtml(doctorName)} has been added to your schedule.`);
    } else if (event.target.id === "reminderForm") {
        const timeValue = document.getElementById("medicineTime").value;
        const [hours, minutes] = timeValue.split(":").map(Number);
        const time = new Date(2000, 0, 1, hours, minutes).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
        appData.reminders.push({
            id: `med-${Date.now()}`, medicine: document.getElementById("medicineName").value.trim(),
            detail: document.getElementById("medicineDose").value.trim(), time, icon: "✳", tone: ""
        });
        saveData();
        renderOverview();
        if (!document.getElementById("detailView").classList.contains("hidden")) renderDetail("reminders");
        showSuccess("Reminder saved", "Your new medicine reminder has been added to your schedule.");
    } else if (event.target.id === "donorForm") {
        showSuccess("Thanks for sharing", "This demo does not save or submit your information. Contact your local official donor registry to register.");
    } else if (event.target.id === "recordForm") {
        appData.records.unshift({
            name: document.getElementById("recordName").value.trim(),
            kind: document.getElementById("recordKind").value,
            date: new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date()),
            icon: "▤"
        });
        saveData();
        if (!document.getElementById("detailView").classList.contains("hidden")) renderDetail("records");
        showSuccess("Record added", "The record label has been added to your demo library. No file was uploaded.");
    }
});

modalBackdrop.addEventListener("click", event => {
    if (event.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
});
renderOverview();