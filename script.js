let map;
let gpPractices = [];

// Load GP practices data from JSON file
fetch('gp_practices.json')
    .then(response => response.json())
    .then(data => gpPractices = data)
    .catch(error => console.error('Error loading GP data:', error));

// Haversine formula to calculate distance between two coordinates in miles
function calculateDistance(lat1, lng1, lat2, lng2) {
    const toRadians = degrees => degrees * Math.PI / 180;
    const R = 3958.8; // Earth's radius in miles
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
}

// Initialize Google Map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 53.4084, lng: -2.9916 }, // Default to Liverpool
        zoom: 12,
    });
}

// Get user's current location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showNearestPractices, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Fetch coordinates from postcode using Google Maps Geocoding API
function usePostcode() {
    const postcode = document.getElementById('postcode').value;
    if (!postcode) return alert("Please enter a postcode!");

    const apiKey = 'AIzaSyClMFnsj6O3PYNJk2UXz9iR5cynboX_7sc'; 
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postcode)}&key=${apiKey}`;

    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            console.log("API Response:", data); // Debugging output

            if (data.status === "OK") {
                const { lat, lng } = data.results[0].geometry.location;
                showNearestPractices({ coords: { latitude: lat, longitude: lng } });
            } else {
                alert('Postcode not found. Please enter a valid postcode.');
                console.error("Geocode API error:", data.status, data.error_message);
            }
        })
        .catch(error => console.error('Geocode API error:', error));
}

// Display nearest GP practices and update the map
function showNearestPractices(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    let sortedGPs = gpPractices.map(gp => {
        gp.distance = calculateDistance(userLat, userLng, gp.lat, gp.lng);
        return gp;
    }).sort((a, b) => a.distance - b.distance);

    let resultsHTML = `<h4 class="text-center">Nearest GP Practices</h4>`;
    resultsHTML += `<ul class="list-group">`;

    sortedGPs.forEach((gp, index) => {
        resultsHTML += `
            <li class="list-group-item">
                <strong>${gp.name}</strong> - ${gp.address} <br>
                📍 <b>Distance:</b> ${gp.distance.toFixed(2)} miles
                <a href="https://www.google.com/maps/dir/?api=1&destination=${gp.lat},${gp.lng}" target="_blank" class="btn btn-sm btn-outline-primary float-end">Get Directions</a>
            </li>`;

        // Add marker to map for GP location
        new google.maps.Marker({
            position: { lat: gp.lat, lng: gp.lng },
            map: map,
            title: gp.name,
        });
    });

    resultsHTML += `</ul>`;
    document.getElementById('results').innerHTML = resultsHTML;

    // Set user location on map
    new google.maps.Marker({
        position: { lat: userLat, lng: userLng },
        map: map,
        title: "You are here",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });

    map.setCenter({ lat: userLat, lng: userLng });
    map.setZoom(14);
}

// Handle errors
function showError(error) {
    alert(`Error: ${error.message}`);
}
