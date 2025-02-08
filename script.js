let map;
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 53.4084, lng: -2.9916 }, // Default center: Liverpool
        zoom: 12,
    });
}

// Load GP practices data
let gpPractices = [];
fetch("gp_practices.json")
    .then((response) => response.json())
    .then((data) => (gpPractices = data))
    .catch((error) => console.error("Error loading GP data:", error));

// Function to check if GP is open
function isGPPracticeOpen(hours) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    return hours[currentDay]?.open <= currentHour && hours[currentDay]?.close > currentHour;
}

// Fetch coordinates from postcode
function usePostcode() {
    const postcode = document.getElementById("postcode").value;
    if (!postcode) return alert("Please enter a postcode");

    const apiKey = "AIzaSyClMFnsj6O3PYNJk2UXz9iR5cynboX_7sc";
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)}&key=${apiKey}`;

    fetch(geocodeUrl)
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "OK") {
                const { lat, lng } = data.results[0].geometry.location;
                showNearestPractices({ coords: { latitude: lat, longitude: lng } });
            } else {
                alert("Postcode not found. Please enter a valid postcode.");
            }
        })
        .catch((error) => console.error("Geocode API error:", error));
}

// Display nearest GP practices
function showNearestPractices(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    let sortedGPs = gpPractices.map((gp) => {
        gp.distance = calculateDistance(userLat, userLng, gp.lat, gp.lng);
        return gp;
    }).sort((a, b) => a.distance - b.distance);

    let resultsHTML = "<ul class='gp-list'>";
    sortedGPs.forEach((gp) => {
        const isOpen = isGPPracticeOpen(gp.hours);
        const markerColor = isOpen ? "green-dot.png" : "red-dot.png";

        // Add markers to the map
        new google.maps.Marker({
            position: { lat: gp.lat, lng: gp.lng },
            map: map,
            title: gp.name,
            icon: `http://maps.google.com/mapfiles/ms/icons/${markerColor}`,
        });

        resultsHTML += `
            <li class="gp-card">
                <strong>${gp.name}</strong> - ${gp.address} <br>
                📍 <b>Distance:</b> ${gp.distance.toFixed(2)} miles <br>
                🏥 <b>Status:</b> <span class="${isOpen ? 'open' : 'closed'}">${isOpen ? 'Open Now' : 'Closed'}</span> <br>
                <a class="btn btn-primary" href="https://www.google.com/maps/dir/?api=1&destination=${gp.lat},${gp.lng}" target="_blank">Get Directions</a>
            </li>
        `;
    });
    resultsHTML += "</ul>";
    document.getElementById("results").innerHTML = resultsHTML;
}

// Function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
