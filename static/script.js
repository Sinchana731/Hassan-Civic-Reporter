document.addEventListener('DOMContentLoaded', () => {
    // --- HASSAN BOUNDARY & MAP SETUP ---
    const hassanBounds = [
        [12.5, 75.5], // Southwest corner
        [13.5, 76.7]  // Northeast corner
    ];
    const hassanCoords = [13.0033, 76.1004];

    const map = L.map('map', {
        center: hassanCoords,
        zoom: 14,
        maxBounds: hassanBounds,
        minZoom: 10
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.fitBounds(hassanBounds);

    // --- CUSTOM ICONS SETUP (REMOVED) ---
    // The custom icon logic has been removed to fix the loading issue.

    // --- GAMIFICATION SETUP ---
    const badges = {
        firstReport: { emoji: '🎖️', name: "First Report!", description: "Submitted your first report." },
        potholePatrol: { emoji: '🚗', name: "Pothole Patrol", description: "Reported 5 potholes." }
    };

    // --- GLOBAL VARIABLES & ELEMENT REFERENCES ---
    let newReportCoords = null, newReportMarker = null;
    const markers = L.markerClusterGroup();
    const loader = document.getElementById('loader-overlay');
    const form = document.getElementById('report-form');
    const submitBtn = document.getElementById('submit-btn');
    const findMeBtn = document.getElementById('find-me-btn');
    const formInstruction = document.getElementById('form-instruction');
    const imageInput = document.getElementById('image');
    const fileNameSpan = document.getElementById('file-name');
    const issueTypeSelect = document.getElementById('issue-type');
    const descriptionTextarea = document.getElementById('description');
    const descriptionLabel = document.querySelector('label[for="description"]');
    const originalDescriptionLabel = descriptionLabel.textContent;

    // --- HELPER FUNCTIONS ---
    function showToast(text, type = "success") {
        const colors = {
            success: "linear-gradient(to right, #00b09b, #96c93d)",
            error: "linear-gradient(to right, #ff5f6d, #ffc371)",
            info: "linear-gradient(to right, #007bff, #00c6ff)"
        };
        Toastify({ text: text, duration: 3000, close: true, gravity: "top", position: "right", stopOnFocus: true, style: { background: colors[type] || colors.info } }).showToast();
    }

    function getUserStats() {
        const stats = localStorage.getItem('civicChampionStats');
        return stats ? JSON.parse(stats) : { score: 0, reports: {}, badges: [] };
    }

    function saveUserStats(stats) {
        localStorage.setItem('civicChampionStats', JSON.stringify(stats));
    }

    function renderStats() {
        const stats = getUserStats();
        document.getElementById('user-score').textContent = stats.score;
        const badgesContainer = document.getElementById('badges-container');
        badgesContainer.innerHTML = '';
        stats.badges.forEach(badgeId => {
            const badge = badges[badgeId];
            if (badge) {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'badge';
                badgeEl.textContent = badge.emoji;
                badgeEl.title = `${badge.name}: ${badge.description}`;
                badgesContainer.appendChild(badgeEl);
            }
        });
    }

    function updateScore(points) {
        let stats = getUserStats();
        stats.score += points;
        saveUserStats(stats);
        renderStats();
    }

    function checkForBadges(issueType) {
        let stats = getUserStats();
        let newBadgeEarned = null;
        if (Object.keys(stats.reports).length === 1 && !stats.badges.includes('firstReport')) {
            stats.badges.push('firstReport');
            newBadgeEarned = badges.firstReport;
        }
        if (issueType === 'Pothole' && stats.reports['Pothole'] >= 5 && !stats.badges.includes('potholePatrol')) {
            stats.badges.push('potholePatrol');
            newBadgeEarned = badges.potholePatrol;
        }
        saveUserStats(stats);
        if (newBadgeEarned) {
            setTimeout(() => showToast(`🎉 New Badge Unlocked: ${newBadgeEarned.name}!`, "info"), 500);
            renderStats();
        }
    }

    async function loadReports() {
        loader.classList.add('visible');
        markers.clearLayers();
        try {
            const response = await fetch('/api/reports');
            const reports = await response.json();
            for (const report of reports) {
                let popupContent = `<b>${report.issue_type}</b> (${report.upvotes} upvotes)<br>${report.description}`;
                if (report.image_filename) {
                    popupContent += `<br><img src="/static/uploads/${report.image_filename}" alt="Issue image" width="150">`;
                }
                popupContent += `<br><button class="upvote-btn" data-id="${report.id}">Upvote 👍</button>`;
                
                // Use default marker, not a custom icon
                const marker = L.marker([report.latitude, report.longitude]).bindPopup(popupContent);
                markers.addLayer(marker);
                await new Promise(res => setTimeout(res, 5));
            }
            map.addLayer(markers);
        } catch (error) {
            showToast("Could not load reports.", "error");
        } finally {
            loader.classList.remove('visible');
        }
    }

    function resetFormState() {
        form.reset();
        if (newReportMarker) { map.removeLayer(newReportMarker); newReportMarker = null; }
        newReportCoords = null;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Select a location to report';
        formInstruction.textContent = "Click the map to select a location, or use the button below.";
        fileNameSpan.textContent = 'No file chosen';
        descriptionTextarea.required = false;
        descriptionLabel.textContent = originalDescriptionLabel;
        descriptionTextarea.placeholder = '';
    }

    // --- GEOSEARCH & EVENT LISTENERS ---
    const searchControl = new GeoSearch.GeoSearchControl({
        provider: new GeoSearch.OpenStreetMapProvider({
            params: {
                viewbox: '75.5,12.5,76.7,13.5',
                bounded: 1,
            },
        }),
        style: 'bar',
        autoClose: true,
        keepResult: true
    });
    map.addControl(searchControl);

    issueTypeSelect.addEventListener('change', () => {
        if (issueTypeSelect.value === 'Others') {
            descriptionTextarea.required = true;
            descriptionTextarea.placeholder = 'Please provide details for the issue.';
            descriptionLabel.textContent = 'Description (Required for "Others")';
        } else {
            descriptionTextarea.required = false;
            descriptionTextarea.placeholder = '';
            descriptionLabel.textContent = originalDescriptionLabel;
        }
    });

    imageInput.addEventListener('change', () => { fileNameSpan.textContent = imageInput.files.length > 0 ? imageInput.files[0].name : 'No file chosen'; });

    map.on('click', (e) => {
        const bounds = L.latLngBounds(hassanBounds);
        if (bounds.contains(e.latlng)) {
            newReportCoords = e.latlng;
            if (newReportMarker) { newReportMarker.setLatLng(newReportCoords); } else { newReportMarker = L.marker(newReportCoords, { draggable: true }).addTo(map).on('dragend', (e) => { newReportCoords = e.target.getLatLng(); }); }
            formInstruction.textContent = "Location selected. Fill out the form below.";
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
        } else {
            showToast("Please select a location within Hassan district.", "error");
        }
    });

    findMeBtn.addEventListener('click', () => {
        navigator.geolocation.getCurrentPosition((position) => {
            newReportCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (newReportMarker) { newReportMarker.setLatLng(newReportCoords); } else { newReportMarker = L.marker(newReportCoords).addTo(map); }
            map.setView(newReportCoords, 16);
            formInstruction.textContent = "Current location selected. Fill out the form.";
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Report';
        }, () => showToast("Could not get your location. Please enable it.", "error"));
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!newReportCoords) { showToast("Please select a location on the map first.", "error"); return; }
        const formData = new FormData();
        const issueType = document.getElementById('issue-type').value;
        formData.append('issue_type', issueType);
        formData.append('description', document.getElementById('description').value);
        formData.append('latitude', newReportCoords.lat);
        formData.append('longitude', newReportCoords.lng);
        if (imageInput.files.length > 0) { formData.append('image', imageInput.files[0]); }
        await fetch('/api/reports', { method: 'POST', body: formData });
        
        let stats = getUserStats();
        stats.reports[issueType] = (stats.reports[issueType] || 0) + 1;
        saveUserStats(stats);
        updateScore(10);
        checkForBadges(issueType);
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        
        showToast("Report submitted successfully!");
        resetFormState();
        loadReports();
    });

    document.addEventListener('click', async (event) => {
        if (event.target && event.target.classList.contains('upvote-btn')) {
            const reportId = event.target.dataset.id;
            event.target.disabled = true;
            event.target.textContent = "Voted!";
            await fetch(`/api/reports/${reportId}/upvote`, { method: 'POST' });
            updateScore(2);
            showToast("Your vote has been counted!");
            loadReports();
        }
    });

    // --- INITIAL LOAD ---
    renderStats();
    loadReports();
});