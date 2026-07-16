/* Root search page behavior for CCDEVAP-main/search.html */

const AIRPORTS = [
    { code: 'MNL', city: 'Manila, Philippines', name: 'Ninoy Aquino International Airport' },
    { code: 'NRT', city: 'Tokyo, Japan', name: 'Narita International Airport' },
    { code: 'SIN', city: 'Singapore', name: 'Changi Airport' },
    { code: 'DXB', city: 'Dubai, UAE', name: 'Dubai International Airport' },
    { code: 'LHR', city: 'London, UK', name: 'Heathrow Airport' },
    { code: 'JFK', city: 'New York, USA', name: 'John F. Kennedy International Airport' },
    { code: 'CDG', city: 'Paris, France', name: 'Charles de Gaulle Airport' }
];

const AIRLINES = [
    { code: 'SJ', name: 'SkyJet', color: '#0d6efd' },
    { code: 'PR', name: 'Philippine Airlines', color: '#d63384' },
    { code: 'SQ', name: 'Singapore Airlines', color: '#ffc107' },
    { code: 'EK', name: 'Emirates', color: '#198754' },
    { code: 'QR', name: 'Qatar Airways', color: '#0dcaf0' }
];

const FLIGHTS = [
    { id: 'SJ101', airline: 'SkyJet', from: 'MNL', to: 'NRT', dep: '08:35', arr: '14:20', dur: '5h 45m', price: 450, stops: 0, cabin: 'Economy', seats: 8, gate: 'A4', aircraft: 'A321neo' },
    { id: 'PR205', airline: 'Philippine Airlines', from: 'MNL', to: 'SIN', dep: '09:15', arr: '12:00', dur: '3h 45m', price: 300, stops: 0, cabin: 'Economy', seats: 12, gate: 'B2', aircraft: 'A330' },
    { id: 'SQ312', airline: 'Singapore Airlines', from: 'SIN', to: 'JFK', dep: '23:55', arr: '07:10', dur: '14h 15m', price: 1800, stops: 1, cabin: 'Premium Economy', seats: 5, gate: 'C6', aircraft: 'A380' },
    { id: 'EK402', airline: 'Emirates', from: 'DXB', to: 'LHR', dep: '02:20', arr: '06:15', dur: '7h 55m', price: 1200, stops: 0, cabin: 'Business', seats: 3, gate: 'D8', aircraft: 'B777' },
    { id: 'QR709', airline: 'Qatar Airways', from: 'LHR', to: 'CDG', dep: '14:30', arr: '17:10', dur: '1h 40m', price: 220, stops: 0, cabin: 'Economy', seats: 20, gate: 'E1', aircraft: 'A320' },
    { id: 'SJ305', airline: 'SkyJet', from: 'MNL', to: 'JFK', dep: '01:10', arr: '08:25', dur: '16h 15m', price: 1600, stops: 1, cabin: 'Business', seats: 4, gate: 'F3', aircraft: 'B787' },
    { id: 'PR408', airline: 'Philippine Airlines', from: 'DXB', to: 'NRT', dep: '19:50', arr: '11:00', dur: '11h 10m', price: 1350, stops: 0, cabin: 'Economy', seats: 6, gate: 'B9', aircraft: 'A350' }
];

const POPULAR_DESTINATIONS = [
    { city: 'Tokyo', code: 'NRT', description: 'Explore neon streets and historic shrines.', image: 'https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=800&q=80' },
    { city: 'Singapore', code: 'SIN', description: 'Experience world-class dining and gardens.', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80' },
    { city: 'Dubai', code: 'DXB', description: 'Luxury shopping and desert adventure.', image: 'https://images.unsplash.com/photo-1512453979798-5ea2669e2f0c?auto=format&fit=crop&w=800&q=80' }
];

const MAX_COMPARE = 2;
let compareList = [];
let lastSearches = [];

function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function getAirportName(code) {
    const airport = AIRPORTS.find(a => a.code === code);
    return airport ? airport.name : code;
}

function formatPrice(amount) {
    return `$${amount.toLocaleString()}`;
}

function showToast(message, variant = 'primary') {
    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${variant} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

    const $toast = $(toastHtml);
    $('#toastContainer').append($toast);
    const bsToast = new bootstrap.Toast($toast[0], { delay: 3500 });
    bsToast.show();
    $toast.on('hidden.bs.toast', function () { $(this).remove(); });
}

function saveRecentSearch(search) {
    lastSearches.unshift(search);
    lastSearches = lastSearches.slice(0, 5);
    localStorage.setItem('ccdevap_recent_searches', JSON.stringify(lastSearches));
    renderRecentSearches();
}

function loadRecentSearches() {
    const saved = localStorage.getItem('ccdevap_recent_searches');
    if (saved) {
        lastSearches = JSON.parse(saved);
    }
    renderRecentSearches();
}

function renderRecentSearches() {
    if (!lastSearches.length) {
        $('#recentSearchesContainer').html('<p class="text-muted small mb-0">No recent searches yet.</p>');
        return;
    }

    const items = lastSearches.map(search => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded-3 bg-light">
            <div>
                <div class="fw-semibold">${search.origin} → ${search.destination}</div>
                <div class="small text-muted">${search.departure}${search.roundTrip ? ' • Return ' + search.returnDate : ''}</div>
                <div class="small text-muted">${search.adults} adults, ${search.children} children</div>
            </div>
            <button type="button" class="btn btn-sm btn-outline-primary load-search-btn" data-search-id="${search.id}">Repeat</button>
        </div>
    `).join('');

    $('#recentSearchesContainer').html(items);
}

function renderPopularDestinations() {
    const html = POPULAR_DESTINATIONS.map(dest => `
        <div class="col-12 col-md-4">
            <div class="card border-0 shadow-sm h-100">
                <img src="${dest.image}" class="card-img-top rounded-top-3" alt="${dest.city}">
                <div class="card-body">
                    <h3 class="h6 fw-bold mb-2">${dest.city}</h3>
                    <p class="small text-muted mb-2">${dest.description}</p>
                    <div class="badge bg-primary">${dest.code}</div>
                </div>
            </div>
        </div>
    `).join('');
    $('#popularDestinationsContainer').html(html);
}

function renderCompareSection() {
    if (!compareList.length) {
        $('#comparisonContainer').html('<p class="text-muted fst-italic">No flights selected for comparison.</p>');
        return;
    }

    const selectedFlights = FLIGHTS.filter(f => compareList.includes(f.id));
    const htmlCards = selectedFlights.map(f => `
        <div class="card border-0 shadow-sm mb-3">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-semibold">${f.id} • ${f.airline}</div>
                        <div class="small text-muted">${f.from} → ${f.to}</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary">${formatPrice(f.price)}</div>
                        <button type="button" class="btn btn-sm btn-outline-secondary remove-compare-btn" data-id="${f.id}">Remove</button>
                    </div>
                </div>
            </div>
        </div>`);

    $('#comparisonContainer').html(`
        <div class="row g-3">
            <div class="col-12">
                <div class="alert alert-info mb-3">
                    <strong>${selectedFlights.length}</strong> flight(s) selected for comparison.
                </div>
            </div>
            ${htmlCards.join('')}
        </div>
    `);
}

function renderFlightResults(results) {
    $('#resultsCount').text(`Showing ${results.length} ${results.length === 1 ? 'Flight' : 'Flights'}`);
    if (!results.length) {
        $('#flightResultsContainer').html('<div class="col-12"><div class="alert alert-warning">No flights match your search criteria. Try adjusting your filters.</div></div>');
        return;
    }

    const cards = results.map(f => `
        <div class="col-12">
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="row align-items-center gy-3">
                        <div class="col-auto text-center">
                            <div class="rounded-3 text-white p-3 mb-2" style="background:${AIRLINES.find(a => a.name === f.airline).color}; min-width:72px;">
                                <div class="fw-bold">${AIRLINES.find(a => a.name === f.airline).code}</div>
                            </div>
                            <div class="small text-muted">${f.airline}</div>
                        </div>
                        <div class="col-lg-6">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold fs-5">${f.dep}</div>
                                    <div class="small text-muted">${f.from} • ${getAirportName(f.from)}</div>
                                </div>
                                <div class="text-center">
                                    <div class="small text-muted">${f.dur}</div>
                                    <i class="bi bi-airplane-fill fs-4 text-primary my-1"></i>
                                    <div class="small ${f.stops === 0 ? 'text-success' : 'text-warning'}">${f.stops === 0 ? 'Direct' : f.stops + ' stop(s)'}</div>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold fs-5">${f.arr}</div>
                                    <div class="small text-muted">${f.to} • ${getAirportName(f.to)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-3 text-lg-end">
                            <div class="fw-bold fs-5 text-primary">${formatPrice(f.price)}</div>
                            <div class="small text-muted mb-2">${f.cabin}</div>
                            <button type="button" class="btn btn-outline-secondary btn-sm me-2 details-btn" data-id="${f.id}">Details</button>
                            <a href="booking.html" class="btn btn-primary btn-sm">Book</a>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span class="small text-muted">Gate ${f.gate} • ${f.aircraft}</span>
                    <button type="button" class="btn btn-sm ${compareList.includes(f.id) ? 'btn-success' : 'btn-outline-secondary'} compare-action-btn" data-id="${f.id}">
                        ${compareList.includes(f.id) ? 'Remove from Compare' : 'Compare'}
                    </button>
                </div>
            </div>
        </div>`);

    $('#flightResultsContainer').html(cards.join(''));
}

function getSearchCriteria() {
    return {
        origin: $('#originSelect').val(),
        destination: $('#destinationSelect').val(),
        tripType: $('#tripType').val(),
        departureDate: $('#departureDate').val(),
        returnDate: $('#returnDate').val(),
        cabinClass: $('#cabinClass').val(),
        adults: parseInt($('#adultCount').val(), 10) || 1,
        children: parseInt($('#childCount').val(), 10) || 0,
        infants: parseInt($('#infantCount').val(), 10) || 0,
        preferredAirline: $('#preferredAirline').val(),
        directFlightOnly: $('#directFlightOnly').is(':checked'),
        flexibleDates: $('#flexibleDates').is(':checked'),
        maxPrice: parseInt($('#priceRange').val(), 10) || 5000,
        sortBy: $('#sortFlights').val()
    };
}

function filterFlights(criteria) {
    return FLIGHTS.filter(f => {
        if (criteria.origin && f.from !== criteria.origin) return false;
        if (criteria.destination && f.to !== criteria.destination) return false;
        if (criteria.origin === criteria.destination) return false;
        if (criteria.directFlightOnly && f.stops !== 0) return false;
        if (criteria.preferredAirline && criteria.preferredAirline !== '' && f.airline !== criteria.preferredAirline) return false;
        if (f.price > criteria.maxPrice) return false;
        return true;
    });
}

function sortFlights(results, sortBy) {
    return results.slice().sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'departure') return a.dep.localeCompare(b.dep);
        if (sortBy === 'duration') {
            const getMinutes = d => {
                const parts = d.match(/(\d+)h\s*(\d+)m/);
                return parts ? parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10) : 0;
            };
            return getMinutes(a.dur) - getMinutes(b.dur);
        }
        return 0;
    });
}

function runSearch() {
    const criteria = getSearchCriteria();

    if (!criteria.origin || !criteria.destination) {
        showToast('Please choose both origin and destination airports.', 'warning');
        return;
    }

    if (criteria.origin === criteria.destination) {
        showToast('Origin and destination cannot be the same.', 'warning');
        return;
    }

    if (!criteria.departureDate) {
        showToast('Please select a departure date.', 'warning');
        return;
    }

    if (criteria.tripType === 'round-trip' && !criteria.returnDate) {
        showToast('Please select a return date for round-trip searches.', 'warning');
        return;
    }

    $('#loadingSpinner').removeClass('d-none');
    setTimeout(() => {
        const results = sortFlights(filterFlights(criteria), criteria.sortBy);
        renderFlightResults(results);
        $('#loadingSpinner').addClass('d-none');

        saveRecentSearch({
            id: Date.now(),
            origin: criteria.origin,
            destination: criteria.destination,
            departure: criteria.departureDate,
            returnDate: criteria.returnDate,
            roundTrip: criteria.tripType === 'round-trip',
            adults: criteria.adults,
            children: criteria.children,
            infants: criteria.infants
        });
    }, 600);
}

function bindEvents() {
    $('#tripType').on('change', function () {
        if ($(this).val() === 'round-trip') {
            $('#returnDateContainer').show();
        } else {
            $('#returnDateContainer').hide();
            $('#returnDate').val('');
        }
    });

    $('#priceRange').on('input', function () {
        $('#priceRangeValue').text(`$${$(this).val()}`);
    });

    $('#searchFlightBtn').on('click', runSearch);
    $('#sortFlights').on('change', runSearch);
    $('#preferredAirline, #directFlightOnly, #flexibleDates').on('change', () => {
        if ($('#flightResultsContainer').children().length) {
            runSearch();
        }
    });

    $('#flightResultsContainer').on('click', '.details-btn', function () {
        openFlightDetail($(this).data('id'));
    });

    $('#flightResultsContainer').on('click', '.compare-action-btn', function () {
        const flightId = $(this).data('id');
        toggleCompare(flightId);
    });

    $('#comparisonContainer').on('click', '.remove-compare-btn', function () {
        const flightId = $(this).data('id');
        toggleCompare(flightId);
    });

    $('#recentSearchesContainer').on('click', '.load-search-btn', function () {
        const searchId = $(this).data('search-id');
        const search = lastSearches.find(item => item.id === searchId);
        if (!search) return;
        $('#originSelect').val(search.origin);
        $('#destinationSelect').val(search.destination);
        $('#departureDate').val(search.departure);
        if (search.roundTrip) {
            $('#tripType').val('round-trip').trigger('change');
            $('#returnDate').val(search.returnDate);
        } else {
            $('#tripType').val('one-way').trigger('change');
        }
        $('#adultCount').val(search.adults);
        $('#childCount').val(search.children);
        $('#infantCount').val(search.infants);
        runSearch();
    });

    $('#themeToggle').on('click', function () {
        $('body').toggleClass('theme-dark');
        const icon = $(this).find('i');
        icon.toggleClass('bi-moon-fill bi-sun-fill');
    });
}

function openFlightDetail(id) {
    const flight = FLIGHTS.find(f => f.id === id);
    if (!flight) return;

    const airline = AIRLINES.find(a => a.name === flight.airline);
    const fromAirport = getAirportName(flight.from);
    const toAirport = getAirportName(flight.to);

    $('#flightDetailsModal .modal-title').text(`Flight ${flight.id} Details`);

    $('#flightDetailsContent').html(`
        <div class="row g-3">
            <div class="col-md-6">
                <div class="card rounded-3 border-0 bg-light p-3 h-100">
                    <div class="d-flex align-items-center gap-3 mb-3">
                        <div class="rounded-3 text-white p-3" style="background:${airline.color}; min-width:52px; text-align:center;">
                            ${airline.code}
                        </div>
                        <div>
                            <div class="fw-bold fs-5">${airline.name}</div>
                            <div class="text-muted small">Flight ${flight.id}</div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <div class="fw-bold fs-4">${flight.dep}</div>
                            <div class="fw-semibold">${flight.from}</div>
                            <div class="small text-muted">${fromAirport}</div>
                        </div>
                        <div class="text-center">
                            <i class="bi bi-airplane-fill text-primary fs-3"></i>
                            <div class="small text-muted">${flight.dur}</div>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold fs-4">${flight.arr}</div>
                            <div class="fw-semibold">${flight.to}</div>
                            <div class="small text-muted">${toAirport}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <table class="table table-sm mb-0">
                    <tr><td class="text-muted small">Stops</td><td class="fw-semibold">${flight.stops === 0 ? 'Direct (Non-stop)' : flight.stops + ' stop(s)'}</td></tr>
                    <tr><td class="text-muted small">Cabin Class</td><td class="fw-semibold">${flight.cabin}</td></tr>
                    <tr><td class="text-muted small">Available Seats</td><td class="fw-semibold">${flight.seats} seats</td></tr>
                    <tr><td class="text-muted small">Gate</td><td class="fw-semibold">${flight.gate}</td></tr>
                    <tr><td class="text-muted small">Aircraft</td><td class="fw-semibold">${flight.aircraft}</td></tr>
                    <tr><td class="text-muted small fw-bold">Price</td><td class="fw-bold fs-5 text-primary">${formatPrice(flight.price)}</td></tr>
                </table>
                <div class="alert alert-info small mt-3 mb-0">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    Free cancellation up to 24 hours before departure.
                </div>
            </div>
        </div>
    `);

    const modalEl = document.getElementById('flightDetailsModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function toggleCompare(flightId) {
    if (compareList.includes(flightId)) {
        compareList = compareList.filter(id => id !== flightId);
        showToast('Removed from comparison.', 'secondary');
    } else {
        if (compareList.length >= MAX_COMPARE) {
            showToast('You can compare up to 2 flights.', 'warning');
            return;
        }
        compareList.push(flightId);
        showToast('Added to comparison.', 'success');
    }
    renderCompareSection();
    const currentResults = FLIGHTS.filter(f => {
        const applied = getSearchCriteria();
        return (!applied.origin || f.from === applied.origin)
            && (!applied.destination || f.to === applied.destination)
            && (!applied.directFlightOnly || f.stops === 0)
            && (applied.preferredAirline === '' || f.airline === applied.preferredAirline)
            && f.price <= applied.maxPrice;
    });
    renderFlightResults(sortFlights(currentResults, $('#sortFlights').val()));
}

function initForm() {
    const originOptions = AIRPORTS.map(airport => `<option value="${airport.code}">${airport.city} (${airport.code})</option>`).join('');
    $('#originSelect').append(originOptions);
    $('#destinationSelect').append(originOptions);
    $('#priceRangeValue').text(`$${$('#priceRange').val()}`);
    $('#tripType').trigger('change');
}

$(document).ready(function () {
    initTooltips();
    initForm();
    bindEvents();
    loadRecentSearches();
    renderPopularDestinations();
    renderCompareSection();
});
