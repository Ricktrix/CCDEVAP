/* Search Page Functionality */
$(document).ready(function() {
    /* Flight Data */
    const flights = [
        { id: 'SJ001', airline: 'SkyJet', airlineLogo: '', flightNumber: 'SJ 101', origin: 'MNL', destination: 'NRT', departureTime: '06:00', arrivalTime: '14:30', duration: '4h 30m', stops: 0, price: 320, remainingSeats: 12, aircraft: 'Airbus A320', gate: 'G14', baggageAllowance: '23kg', cabinClass: 'Economy' },
        { id: 'SJ002', airline: 'SkyJet', airlineLogo: '', flightNumber: 'SJ 205', origin: 'MNL', destination: 'SIN', departureTime: '08:15', arrivalTime: '11:45', duration: '3h 30m', stops: 0, price: 210, remainingSeats: 5, aircraft: 'Boeing 737', gate: 'B3', baggageAllowance: '20kg', cabinClass: 'Economy' },
        { id: 'PR001', airline: 'Philippine Airlines', airlineLogo: '', flightNumber: 'PR 502', origin: 'MNL', destination: 'DXB', departureTime: '22:00', arrivalTime: '04:30', duration: '9h 30m', stops: 1, price: 550, remainingSeats: 20, aircraft: 'Boeing 777', gate: 'A1', baggageAllowance: '30kg', cabinClass: "Business" },
        { id: 'PR002', airline: 'Philippine Airlines', airlineLogo: '', flightNumber: 'PR 310', origin: 'MNL', destination: 'NRT', departureTime: '09:00', arrivalTime: '14:00', duration: '5h 00m', stops: 0, price: 390, remainingSeats: 8, aircraft: 'Airbus A330', gate: 'C7', baggageAllowance: '25kg', cabinClass: 'Economy' }, 
        { id: 'SQ001', airline: 'Singapore Airlines', airlineLogo: '', flightNumber: 'SQ 921', origin: 'MNL', destination: 'SIN', departureTime: '11:00', arrivalTime: '14:10', duration: '3h 10m', stops: 0, price: 280, remainingSeats: 15, aircraft: 'Boeing 787', gate: 'D2', baggageAllowance: '30kg', cabinClass: 'Economy' },
        { id: 'SQ002', airline: 'Singapore Airlines', airlineLogo: '', flightNumber: 'SQ 318', origin: 'MNL', destination: 'LHR', departureTime: '23:55', arrivalTime: '07:20', duration: '14h 25m', stops: 1, price: 980, remainingSeats: 3, aircraft: 'Airbus A380', gate: 'F9', baggageAllowance: '35kg', cabinClass: 'Business' },
        { id: 'EK001', airline: 'Emirates', airlineLogo: '', flightNumber: 'EK 335', origin: 'MNL', destination: 'DXB', departureTime: '14:30', arrivalTime: '20:00', duration: '8h 30m', stops: 0, price: 620, remainingSeats: 10, aircraft: 'Airbus A380', gate: 'E11', baggageAllowance: '35kg', cabinClass: 'Business' },
        { id: 'EK002', airline: 'Emirates', airlineLogo: '', flightNumber: 'EK 339', origin: 'MNL', destination: 'CDG', departureTime: '03:00', arrivalTime: '13:45', duration: '13h 45m', stops: 1, price: 850, remainingSeats: 7, aircraft: 'Boeing 777', gate: 'E5', baggageAllowance: '30kg', cabinClass: 'Economy' },
        { id: 'QR001', airline: 'Qatar Airways', airlineLogo: '', flightNumber: 'QR 931', origin: 'MNL', destination: 'DOH', departureTime: '01:00', arrivalTime: '06:30', duration: '10h 30m', stops: 0, price: 470, remainingSeats: 18, aircraft: 'Airbus A350', gate: 'H4', baggageAllowance: '30kg', cabinClass: 'Economy' },
        { id: 'QR002', airline: 'Qatar Airways', airlineLogo: '', flightNumber: 'QR 145', origin: 'MNL', destination: 'LHR', departureTime: '16:20', arrivalTime: '23:55', duration: '15h 35m', stops: 1, price: 1050, remainingSeats: 2, aircraft: 'Boeing 787', gate: 'H6', baggageAllowance: '35kg', cabinClass: 'First Class' } 
    ];

    // Internal State
    let filteredFlights = [...flights];
    let selectedForComparison = [];

    // Recent searches dummy data
    const recentSearches = [
        { origin: 'MNL', destination: 'NRT', date: '2026-05-01' },
        { origin: 'MNL', destination: 'DXB', date: '2026-05-15' },
        { origin: 'MNL', destination: 'SIN', date: '2026-06-05' }
    ];

    // Popular destination dummy data
    const popularDestinations = [
        { city: 'Tokyo', code: 'NRT', image: '' },
        { city: 'Dubai', code: 'DXB', image: '' },
        { city: 'Singapore', code: 'SIN', image: '' },
        { city: 'London', code: 'LHR', image: '' },
        { city: 'Paris', code: 'CDG', image: '' }
    ];

    /* Page Initialization */
    function initializeSearchPage() {
        // Initialize all
        initializeToolTips();
        loadFlightData();
        initializeSearchForm();
        initializeAdvancedFilters();
        initializeSorting();
        initializeSidebarFilters();
        initializeFlightSearch();
        initializeViewDetails();
        initializeResponsiveUI();
        showWelcomeToast();

        // Console log for debugging
        console.log('Searchpage initialized successfully');
    }

    /* ToolTips */
    // Initialize all Bootstrap 5 tooltips on the page.
    function initializeToolTips() {
        const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipEls.forEach(function(el) {
            new bootstrap.ToolTip(el);
        });
    }

    /* Load Flight Data */
    // Loads initial flights data and renders popular destinations and recent searches on page load.
    function loadFlightData() {
        filteredFlights = [...flights];
        renderFlights(filteredFlights);
        updateResultsCount(filteredFlights.length);
        initializePopularDestinations();
        initializeRecentSearches();
        initializeComparison();
    }

    /* Spinner */
    // Show the loading spinner overlay
    function showSpinner() {
        if ($('#loadingSpinner').length) {
            $('#loadingSpinner').removeClass('d-none').fadeIn(200);
        }
    }
    // Hides the loading spinner overlay
    function hideSpinner() {
        if ($('#loadinSpinner').length) {
            $('#loadingSpinner').fadeOut(200, function() {
                $(this).addclass('d-none');
            });
        }
    }

    /* Toast Notification */
    /**
     * Displays a Bootstrap toast notification
     * @param {string} title - Toast header title
     * @param {string} message - body message
     * @param {string} type - bootstrap contextual type: success | warning | info | danger
     */
    function showToast(title, message, type) {
        if (!$('#toastContainer').length) return;

        const icons = {
            success: 'bi-check-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill',
            danger: 'bi-x-circle-fill'
        };
        const bgColors = {
            success: 'text-bg-success',
            warning: 'text-bg-warning',
            info: 'text-bg-info',
            danger: 'text-bg-danger'
        };
        const iconClass = icons[type] || icons.info;
        const colorClass = bgColors[type] || bgColors.info;
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
        <div id="${toastId}" class="toast align-items-center border-0 ${colorClass}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass}"></i>
                    <div>
                        <strong> ${title} </strong><br>
                        <span> ${message} </span>
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

        $('#toastContainer').append(toastHTML);
        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
        // Remove from DOM after hiding
        toastEl.addEventListener('hidden.bs.toast', function() {
            $(this).remove();
        });
    }

    /* Search Form */
    /**
     * Initializes the main search form:
     * - Round trip / one-way toggle
     * - Passenger count controls
     * - Search button handler with validation
     */
    function initializeSearchForm() {
        // Round Trip toggle - show/hide return date
        if ($('#tripType').length) {
            $('#tripType').on('change', function() {
                if ($(this).val() === 'round-trip') {
                    $('#returnDateContainer').slideDown(300);
                } else {
                    $('#returnDateContainer').slideUp(300);
                }
            });
            // Set initial state
            $('#returnDateContainer').hide();
        }
        // Seach button handler
        if ($('#searchFlightsBtn').length) {
            $('#searchFlightsBtn').on('click', function() {
                handleFlightSearch();
            });
        }
    }

    // Validate the search form fields and triggers flight search
    function handleFlightSearch() {
        const origin = $('#originSelect').val();
        const destination = $('#destinationSelect').val();
        const departure = $('#departureDate').val();
        // Validation
        if (!origin) {
            showToast('Validation Error', 'Please select an origin city.', 'warning');
            return;
        }
        if (!destination) {
            showToast('Validation Error', 'Please select a destination city.', 'warning');
            return;
        }
        if (origin === destination) {
            showToast('Validation Error', 'Origin and destination cannot be the same.', 'warning');
            return;
        }
        if (!departure) {
            showToast('Validation Error', 'Please select a departure date.', 'warning');
            return;
        }
        // Simulate search with spinner
        showSpinner();
        setTimeout(function() {
            const cabinClass = $('#cabinClass').val() || '';
            const directOnly = $('#directFlightOnly').is(':checked');
            const preferredAirline = $('#preferredAirline').val() || '';
            const maxPrice = parseInt($('#priceRange').val()) || 9999;
            filteredFlights = flights.filter(function(f) {
                const matchOrigin = f.origin === origin;
                const matchDest = f.destination == destination;
                const matchCabin = !cabinClass || f.cabinClass === cabinClass;
                const matchDirect = !directOnly || f.stops == 0;
                const matchAirline = !preferredAirline || f.airline === preferredAirline;
                const matchPrice = f.price <= maxPrice;
                return matchOrigin && matchDest && matchCabin && matchDirect && matchAirline && matchPrice;
            });
            hideSpinner();
            renderFlights(filteredFligts);
            updateResultsCount(filteredFlights.length);

            if (filteredFlights.length === 0) {
                showToast('No Flights Found', 'No flights match your search. Try adjusting your filters.', 'info');
            } else {
                showToast('Flights Found', `${filteredFlights.length} flights(s) match your search.`, 'success');
            }
            // Scroll to results
            if ($('#flightResultsContainer').length) {
                $('html, body').animate({
                    scrollTop: $('#flightResultsContainer').offset().top - 80
                }, 500);
            }
        }, 1200);
    }

    /* Advanced Filters */
    /**
     * Initializes the advanced search section:
     * - Price Range slider live update
     * - Preferred airline / direct flights toggle
     */
    function initializeAdvancedFilters() {
        if ($('priceRange').length) {
            // Initialize display value
            $('#priceRangeValue').text("$" + $('#priceRange').val());
            // Update display on slider change
            $('#priceRange').on('input', function() {
                const val = $(this).val();
                $('#priceRangeValue').text("$" + val);
                applyAllFilters();
            });
        }
        // Preferred Airline Change
        if ($('#preferredAirline').length) {
            $('#preferredAirline').on('change', function() {
                applyFilters();
            });
        }
        // Direct flights only toggle
        if ($('#directFlightsOnly').length) {
            $('#directFlightsOnly').on('change', function() {
                applyAllFilters();
            });
        }
        // Flexible dates (informational only for fronent milestone)
        if ($('#flexibleDates').length) {
            $('#flexibleDates').on('change', function() {
                showToast('Flexible Dates', 'Flexible date search enabled.', 'info');
            });
        }
    }

    /* Sorting */
    // Binds the sort dropdown to dynamically re-sort displayed flights
    function initializeSorting() {
        if (!$('#sortFlights').length) return;
        $('#sortFlights').on('change', function() {
            const criterion = $(this).val();
            sortAndRender(criterion);
        });
    }
    /**
     * Sorts the filteredFlights by given criterion and re-renders
     * @param {string} criterion - "price" | "departure" | "duration"
     */
    function sortAndRender(criterion) {
        showSpinner();
        setTimeout(function() {
            if (criterion === 'price') {
                filteredFlights.sort((a, b) => a.price - b.price);
                showToast('Sorted', 'Flights sorted by price (low to high).', 'info');
            } else if (criterion === 'departure') {
                filteredFlights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
                showToast('Sorted', 'Flights sorted by departure time.', 'info');
            } else if (criterion === 'duration') {
                filteredFlights.sort(function(a, b) {
                    return parseDuration(a.duration) - parseDuration(b.duration);
                });
                showToast('Sorted', 'Flights sorted by duration (shortest first).', 'info');
            }
            hideSpinner();
            renderFlights(filteredFlights);
            updateResultCount(filteredFlights.length);
        }, 600);
    }
    /**
     * Converts the duration string "Xh Ym" into total minutes for comparison.
     * @oaram {string} durationStr
     * @returns {number} total minutes
     */
    function parseDuration(durationStr) {
        const match = durationStr.match(/(\d+)h\s*(\d+)m/);
        if (!match) return 0;
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }

    /* SideBar Filters */
    /**
     * Binds all sidebar checkbox filters:
     * - airline
     * - price range bracket
     * - stops
     * - departure schedule
     */
    function initializeSideBarFilters() {
        $(document).on('change', '.checkbox-airline', '.checkbox-price', '.checkbox-stops', 'checkbox-schedule', function() {
            applyAllFilters();
        });
    }

    // Reads all active sidebar filters and the price range slider, then updates the filteredFlights and re-renders.
    function applyAllFilters() {
        showSpinner();
        setTimeout(function () {
            // Airline filter
            const selectedAirlines = [];
            $('.checkbox-airline:checked').each(function() {
                selectedAirlines.push($(this).val());
            });
            // Price bracket Filter
            const selectedPriceBrackets = [];
            $('.checkbox-price:checked').each(function() {
                selectedPriceBrackets.push($(this).val());
            });
            // Stops filter
            const selectedStops = [];
            $('.checkbox-stops:checked').each(function() {
                selectedStops.push(parseInt($(this).val()));
            });
            // Schedule filter (morning / afternoon / evening / night)
            const selectedSchedule = [];
            $('.checkbox-schedule:checked').each(function() {
                selectedSchedule.push($(this).val());
            });

            // Price slider max
            const maxPrice = parseInt($('#priceRange').val()) || 9999;
            filteredFlights = flights.filter(function(f) {
                // Airline
                if (selectedAirlines.length && !selectedAirlines.includes(f.airline)) return false;
                // Price Bracket
                if (selectedPriceBrackets.length) {
                    const inBracket = selectedPriceBrackets.some(function(bracket) {
                        const [min, max] = bracket.split('-').map(Number);
                        return f.price >= min && f.price <= max;
                    });
                    if (!inBracket) return false;
                }
                // Stops
                if (selectedStops.length && !selectedStops.includes(f.stops)) return false;
                // Schedule
                if (selectedSchedule.length) {
                    const hour = parseInt(f.departureTime.split(':')[0]);
                    const schedule = getScheduleLabel(hour);
                    if (!selectedSchedule.includes(schedule)) return false;
                }
                // Slider price
                if (f.price > maxPrice) return false;
                return true;
            });
            hideSpinner();
            renderFlights(filteredFlights);
            updateResultsCount(filteredFlights.length);
            showToast('Filters Applied', `Showing ${filteredFlights.length} flight(s).`, 'info');
        }, 500);
    }
    /**
     * Returns a schedule label based on departure hour
     * @param {number} hour - 0-23
     * @returns {string}
     */
    function getScheduleLabel(hour) {
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 17) return "afternoon";
        if (hour >=17 && hour < 21) return "evening";
        return "night";
    }

    /* Initialize Flight Search */
    // Allows pressing enter on form fields to trigger search
    function initializeFlightSearch() {
        $(document).on('keydown', '#originSelect', '#destinationSelect', '#departureDate', '#returnDate', function(e) {
            if (e.key === 'Enter') {
                handleFlightSearch();
            }
        });
    }

    /* Render Flights */
    /**
     * Renders Flight cards into #flightResultsContainer
     * @param {Array} flightsToRender - Array of flight objects
     */
    function renderFlights(flightsToRender) {
        if (!$('#flightResultsContainer').length) return;
        $('#flightResultsContainer').empty();
        if (flightsToRender.length === 0) {
            $('#flightResultsContainer').html(`
                <div class="col-12 text-center py-5">
                    <i class="bi bi-airplane fs-1 text-muted"></i>
                    <p class="mt-3 text-muted fs-5"> No flights found. Try adjusting you search or fitlers. </p>
                </div>`);
            return;
        }
        flightsToRender.forEach(function(flight) {
            const stopsLabel = flight.stops === 0 ? '<span class="badge bg-success"> Direct </span>'
                            : `<span class="badge bg-warning text-dark"> ${flight.stops} Stop${flight.stops > 1 ? "s" : ""} </span>`;
            const seatsWarning = flight.remainingSeats <= 5 ? `<span class="text-danger fw-semibold"><i class="bi bi-exclamation-circle me-1"></i> ${flight.remainingSeats} seats left! </span>`
                            : `<span class="text-muted"> ${flight.remainingSeats} seats available </span>`;
            const cardHTML = `
            <div class="col-12 mb-3" id="flight-card-${flight.id}">
                <div class="card flight-card shadow-sm border-0 rounded-3">
                    <div class="card-body p-3">
                        <div class="row align-items-center">
 
                            <!-- Airline Info -->
                            <div class="col-md-2 col-4 d-flex align-items-center gap-2 mb-2 mb-md-0">
                            <img src="${flight.airlineLogo}" alt="${flight.airline} logo" class="rounded" width="40" height="40" onerror="this.src='assets/logos/default.png'">
                            <div>
                                <div class="fw-bold small">${flight.airline}</div>
                                <div class="text-muted small">${flight.flightNumber}</div>
                            </div>
                            </div>
 
                            <!-- Route & Times -->
                            <div class="col-md-4 col-8 mb-2 mb-md-0">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="text-center">
                                        <div class="fs-5 fw-bold">${flight.departureTime}</div>
                                        <div class="text-muted small">${flight.origin}</div>
                                    </div>
                                    <div class="flex-grow-1 text-center">
                                        <div class="text-muted small">${flight.duration}</div>
                                        <div class="border-top border-secondary my-1"></div>
                                        ${stopsLabel}
                                    </div>
                                    <div class="text-center">
                                        <div class="fs-5 fw-bold">${flight.arrivalTime}</div>
                                        <div class="text-muted small">${flight.destination}</div>
                                    </div>
                                </div>
                            </div>
 
                            <!-- Cabin & Seats -->
                            <div class="col-md-2 col-6 text-center mb-2 mb-md-0">
                                <div class="badge bg-light text-dark border mb-1">${flight.cabinClass}</div>
                                <div class="small">${seatsWarning}</div>
                            </div>
 
                            <!-- Price & Actions -->
                            <div class="col-md-4 col-6 text-end d-flex flex-column align-items-end gap-2">
                                <div class="fs-4 fw-bold text-primary">$${flight.price}</div>
                                <div class="d-flex flex-wrap gap-2 justify-content-end">
                                <button class="btn btn-primary btn-sm book-flight-btn" data-flight-id="${flight.id}" data-bs-toggle="tooltip" title="Book this flight now">
                                    <i class="bi bi-ticket-perforated me-1"></i>Book
                                </button>
                                <button class="btn btn-outline-secondary btn-sm view-details-btn" data-flight-id="${flight.id}" data-bs-toggle="tooltip" title="View full flight details">
                                    <i class="bi bi-info-circle me-1"></i>Details
                                </button>
                                <button class="btn btn-outline-info btn-sm compare-flight-btn" data-flight-id="${flight.id}" data-bs-toggle="tooltip" title="Add to comparison (max 2)">
                                    <i class="bi bi-bar-chart-line me-1"></i>Compare
                                </button>
                                </div>
                            </div>
 
                        </div>
                    </div>
                </div>
            </div>`;
            $('#flightResultsContainer').append(cardHTML);
        });
        // Re-initialize tooltips for newly rendered elements
        initializeToolTips();
        // Bind hover effects
        bindFlightCardHover(); 
    }

    /* Results Count */
    /**
     * Updates the #resultsCount display element.
     * @oaram {number} count - Number of results to display
     */
    function updateResultsCount(count) {
        if ($('#resultsCount').length) {
            $('#resultsCount').text(`Showing ${count} Flight${count !== 1 ? "s" : ""}`);
        }
    }

    /* Hover Effects */
    // Adds hover scale/shadow effects to .flights-card elements
    function bindFlightCardHover() {
        $(document).off('mouseenter', 'mouseleave', '.flight-card');
        $(document).on('mouseenter', '.flight-card', function() {
            $(this).addClass('flight-card-hover').css({
                'transform': 'translateY(-2px) scale(1.01)',
                'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.12)',
                'transition': 'all 0.2s ease'
            });
        });
        $(document).on('mouseleave', '.flight-card', function() {
            $(this).removeClass('flight-card-hover').css({
                'transform': '',
                'box-shadow': ''
            });
        });
    }

    /* View Details (Modals) */
    // Handles clicking the .view-details-btn - populates and opens the #flightDetailsModal
    function initializeViewDetails() {
        $(document).on('click', '.view-details-btn', function() {
            const flightId = $(this).data('flight-id');
            const flight = flights.find(f => f.id === flightId);
            if (!flight) {
                showToast('Error', 'Flights details not found.', 'danger');
                return;
            }
            if (!$('#flightDetailsModal').length) return;

            const stopsText = flight.stops === 0 ? 'Non-stop (Direct)' : `${flight.stops} Stop${flight.stops > 1 ? "s" : ""}`;
            $('#flightDetailsModal', '.modal-title').text(`${flight.airline} - ${flight.flightNumber}`);

            $('#modalFlightNumber').text(flight.flightNumber);
            $('#modalAirline').text(flight.airline);
            $('#modalAircraft').text(flight.aircraft);
            $('#modalDeparture').text(flight.departureTime);
            $('#modalArrival').text(flight.arrivalTime);
            $('#modalGate').text(flight.gate);
            $('#modalStops').text(stopsText);
            $('#modalBaggage').text(flight.baggageAllowance);
            $('#modalCabinClass').text(flight.cabinClass);
            $('#modalDuration').text(flight.duration);
            $('#modalPrice').text("$" + flight.price);

            const detailsModal = new bootstrap.Modal(document.getElementById('flightDetailsModal'));
            detailsModal.show();
        });
    }

    /* Book Flight */
    // Handles .book-flight-btn click: Shows success toast, then redirects to booking.html after 1 second
    $(document).on('click', '.book-flight-btn', function() {
        const flightId = $(this).data('flight-id');
        const flight = flights.find(f => f.id === flightId);

        showToast('Flight Booked!', `${flight ? flight.flightNumber + " - " + flight.airline : "Your Flight"} has been booked. Redirecting...`, 'success');
        setTimeout(function() {
            window.location.href = "booking.html";
        }, 1000);
    });

    /* Flight Comparison */
    // Initializes the flight comparison feature. Allows selecting up to 2 flights and renders a comparison panel
    function initializeComparison() {
        selectedForComparison = [];
        $(document).on('click', '.compare-flight-btn', function() {
            const flightId = $(this).data('flight-id');
            const flight = flights.find(f => f.id === flightId);
            if (!flight) return;
            const alreadySelected = selectedForComparison.findIndex(f => f.id === flightId);

            if (alreadySelected > -1) {
                // Deselect
                selectedForComparison.splice(alreadySelected, 1);
                $(this).removeClass("active btn-info").addClass("btn-outline-info");
                showToast("Comparison", `${flight.flightNumber} removed from comparison.`, "info");
            } else {
                if (selectedForComparison.length >= 2) {
                    showToast("Comparison Limit", "You can compare up to 2 flights only.", "warning");
                    return;
                }
                selectedForComparison.push(flight);
                $(this).removeClass("btn-outline-info").addClass("active btn-info");
                showToast("Comparison", `${flight.flightNumber} added to comparison.`, "info");
            }
 
            renderComparison();
        });
    }

    // Renders the comparison panel inside #comparisonContainer
    function renderComparison() {
        if (!$('#comparisonContainer').length) return;
        if (selectedForComparison.length === 0) {
            $('#comparisonContainer').hide().empty();
            return;
        }

        let html = `
        <div class="card border-primary mt-4">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <span><i class="bi bi-bar-chart-line me-2"></i>Flight Comparison</span>
                <button class="btn btn-sm btn-light" id="clearComparisonBtn">Clear</button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered text-center align-middle mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Detail</th>
                                ${selectedForComparison.map(f => `<th>${f.flightNumber}<br><small class="text-muted">${f.airline}</small></th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="fw-semibold">Price</td>
                                ${selectedForComparison.map(f => `<td class="text-primary fw-bold">$${f.price}</td>`).join("")}
                            </tr>
                            <tr>
                                <td class="fw-semibold">Duration</td>
                                ${selectedForComparison.map(f => `<td>${f.duration}</td>`).join("")}
                            </tr>
                            <tr>
                                <td class="fw-semibold">Stops</td>
                                ${selectedForComparison.map(f => `<td>${f.stops === 0 ? '<span class="badge bg-success">Direct</span>' : f.stops + " stop(s)"}</td>`).join("")}
                            </tr>
                            <tr>
                                <td class="fw-semibold">Seats Left</td>
                                ${selectedForComparison.map(f => `<td>${f.remainingSeats}</td>`).join("")}
                            </tr>
                            <tr>
                                <td class="fw-semibold">Cabin</td>
                                ${selectedForComparison.map(f => `<td>${f.cabinClass}</td>`).join("")}
                            </tr>
                            <tr>
                                <td class="fw-semibold">Baggage</td>
                                ${selectedForComparison.map(f => `<td>${f.baggageAllowance}</td>`).join("")}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;

        $('#comparisonContainer').html(html).slideDown(300);

        // Clear Button
        $('#clearComparisonBtn').on('click', function() {
            selectedForComparison = [];
            $('.compare-flight-btn').removeClass('active btn-info').addClass('btn-outline-info');
            $('#comparisonContainer').slideUp(200, function() { $(this).empty(); });
            showToast('Comparison Cleared', 'Comparison has been reset.', 'info');
        });
    }

    /* Popular Destinations */
    // Renders popular destination cards and handles auto-fill on click
    function initializePopularDestinations() {
        if (!$('#popularDestinationsContainer').length) return;
        $('#popularDestinationsContainer').empty();
        popularDestinations.forEach(function(dest) {
            const cardHTML = `
            <div class="col-6 col-md-4 col-lg-2 mb-3">
                <div class="card h-100 border-0 shadow-sm popular-dest-card text-center" role="button" tabindex="0" data-code="${dest.code}" data-city="${dest.city}" style="cursor:pointer;">
                    <img src="${dest.image}" class="card-img-top rounded-top" alt="${dest.city}" style="height:90px; object-fit:cover;" onerror="this.style.display='none'">
                    <div class="card-body p-2">
                        <div class="fw-semibold small">${dest.city}</div>
                        <div class="text-muted small">${dest.code}</div>
                    </div>
                </div>
            </div>`;
            $('#popularDestinationsContainer').append(cardHTML);
        });

        // Auto-fill destination on click
        $(document).on('click keydown', '.popular-dest-card', function(e) {
            if (e.type === 'keydown' && e.key !== 'Enter') return;
            const code = $(this).data('code');
            const city = $(this).data('city');

            if ($('#destinationSelect').length) {
                $('#destinationSelect').val(code).trigger('change');
            }
            showToast('Destination Selected', `${city} (${code}) set as destination.`, 'info');
        });
    }

    /* Recent Searches */
    function initializeRecentSearches() {
        if (!$('#recentSearchesContainer').length) return;
        $('#recentSearchesContainer').empty();
        if (recentSearches.length === 0) {
            $('#recentSearchesContainer').html('<p class="text-muted small"> No recent searches. </p>');
            return;
        }

        recentSearches.forEach(function(search) {
            const itemHTML = `
            <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-clock-history text-muted"></i>
                    <button class="btn btn-link btn-sm p-0 text-decoration-none recent-search-btn" data-origin="${search.origin}" data-destination="${search.destination}" data-date="${search.date}">
                        ${search.origin} → ${search.destination}
                    </button>
                </div>
                <span class="text-muted small">${search.date}</span>
            </div>`;
            $('#recentSearchesContainer').append(itemHTML);
        });

        // Auto-fill form on recent search click
        $(document).on('click', '.recent-search-btn', function() {
            const origin = $(this).data('origin');
            const dest = $(this).data('destination');
            const date = $(this).data('date');

            if ($('#originSelect').length) $('#originSelect').val(origin).trigger('change');
            if ($('#destinationSelect').length) $('#destinationSelect').val(dest).trigger('change');
            if ($('#departureDate').length) $('#departureDate').val(date);

            showToast('Recent Search', `${origin} -> ${dest} loaded into search form.`, 'info');
        });
    }

    /* Responsive UI */
    // Handles the responsive sidebar visibility for mobile screens
    function initializeResponsiveUI() {
        function checkScreenWidth() {
            if ($(window).width() < 768) {
                // Collapse the filter sidebar if it exists
                if ($("#filterSidebar").length) {
                    $("#filterSidebar").collapse("hide");
                }
                // Show mobile notice
                if ($("#mobileFilterNotice").length) {
                    $("#mobileFilterNotice").slideDown(300);
                    $("#mobileFilterNotice").text("Filters moved to mobile mode.");
                }
            } else {
                if ($("#mobileFilterNotice").length) {
                    $("#mobileFilterNotice").slideUp(300);
                }
                if ($("#filterSidebar").length) {
                    $("#filterSidebar").collapse("show");
                }
            }
        }

        checkScreenWidth();
        $(window).on('resize', checkScreenWidth);
    }

    /* Welcome Toast */
    // Shows a welcome notification when the page loads
    function showWelcomeToast() {
        setTimeout(function() {
            showToast('Welcome to Lorem Ipsum', 'Search and book flights at the best prices.', 'info');
        }, 600);
    }

    // Execute it
    initializeSearchPage();
});