/* Home Page Functionality */
$(document).ready(function () {
    /* Configurations and Data */
    // Dashboard Statistics Data
    var dashboardStats = {
        availableFlights: 152,
        activeBookings: 12487,
        popularDestinations: 45
    };

    // Suggested Flights Data
    var suggestedFlights = [
        { destination: 'Tokyo', airportCode: 'NRT', price: 890, category: 'New Route', image: 'https://via.placeholder.com/300x200?text=Tokyo' },
        { destination: 'New York', airportCode: 'JFK', price: 450, category: 'Best Seller', image: 'https://via.placeholder.com/300x200?text=New+York' },
        { destination: 'London', airprortCode: 'LHR', price: 620, category: 'Limited Seats', image: 'https://via.placeholder.com/300x200?text=London' },
        { destination: 'Dubai', airportCode: 'DXB', price: 750, category: 'Popular', image: 'https://via.placeholder.com/300x200?text=Dubai' },
        { destination: 'Paris', airportCode: 'CDG', price: 550, category: 'Best Seller', image: 'https://via.placeholder.com/300x200?text=Paris' },
        { destination: 'Singapore', airportCode: 'SIN', price: 920, category: 'New Route', image: 'https://via.placeholder.com/300x200?text=Singapore' },
        { destination: 'Sydney', airportCode: 'SYD', price: 1100, category: 'Popular', image: 'https://via.placeholder.com/300x200?text=Sydney' },
        { destination: 'Seoul', airportCode: 'ICN', price: 780, category: 'New Route', image: 'https://via.placeholder.com/300x200?text=Seoul' }
    ];

    // Recently Viewed Flights Data
    var recentlyViewedFlights = [
        { destination: 'Tokyo', airportCode: 'NRT', price: 890, lastViewed: '2 hours ago' },
        { destination: 'London', airportCode: 'LHR', price: 620, lastViewed: '5 hours ago' },
        { destination: 'Dubai', airportCode: 'DXB', price: 750, lastViewed: '1 day ago' }
    ];

    // Search Suggestions
    var searchSuggestions = [
        'Tokyo', 'New York', 'London', 'Dubai', 'Paris',
        'Singapore', 'Syndey', 'Seoul', 'Rome', 'Barcelona'
    ];

    // Travel Alerts
    var travelAlerts = [
        '20% Off Flights to Tokyo',
        'Free Baggage Upgrade This Month',
        'Double Miles Promotion Active',
        'New Route to Seoul Now Available'
    ];

    // State Variables
    var favoriteCount = 0;
    var currentAlertIndex = 0;
    var currentSlide = 1;
    var totalSlides = 3;

    /* Toast Notifications */
    // Reusable function: showToast(title, message, type)
    function showToast(title, message, type) {
        var toastId = 'toast-' + Date.now();
        var iconClass = '';

        switch(type) {
            case 'success' : iconClass = 'bi-check-circle-fill text-success'; break;
            case 'warning' : iconClass = 'bi-exclamation-triangle-fill text-warning'; break;
            case 'info' : iconClass = 'bi-info-circle-fill text-info'; break;
            case 'danger' : iconClass = 'bi-x-circle-fill text-danger'; break;
            default: iconClass = 'bi-info-circle-fill text-info';
        }

        var toastHTML = `
            <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi ${iconClass} me-2"></i>
                    <strong class="me-auto"> ${title} </strong>
                    <button type="button" class="btn-close" data-bs-dismissed="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body"> ${message} </div>
            </div>
        `;

        // Create container if not exists
        if ($('#toastContainer').length === 0) {
            $('body').append('<div id="toastContainer" class="position-fixed top-0 end-0 p-3" style="z-index: 1100;"></div>');
        }

        $('#toastContainer').append(toastHTML);

        // Initialize and show toast
        var toastElement = document.getElementById(toastId);
        var bsToast = new bootstrap.Toast(toastElement);
        bsToast.show();

        // Remove after hidden
        $(toastElement).on('hidden.bs.toast', function() {
            $(this).remove();
        });
    }

    /* Loading Spinner */
    // Create reusable function: showSpinner()
    function showSpinner() {
        if ($('#loadingSpinner').length === 0) {
            var spinnerHTML = `
                <div id="loadingSpinner" class="position-fixed top-50 start-50 translate-middle" style="z-index: 9999; display: none;">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden"> Loading... </span>
                    </div>
                </div>
            `;
            $('body').append(spinnerHTML);
        }
        $('#loadingSpinner').fadeIn();
    }

    // Create reusable function: hideSpinner()
    function hideSpinner() {
        if ($('#loadingSpinner').length > 0) {
            $('#loadingSpinner').fadeOut();
        }
    }

    /* Animation Counters */
    // Animate Statistics cards from 0 to their final values
    function animateCounter(elementId, targetValue, prefix, suffix) {
        var element = $(elementId);
        if (element.length === 0) return;

        var start = 0;
        var duration = 1500;
        var startTime = performance.now();

        function update(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(start + (targetValue - start) * eased);

            element.text(prefix + current.toLocaleString() + suffix);

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /* Bootstrap Tooltips */
    // Initialize all Bootstrap tooltips automatically
    function initializeToolTips() {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function(tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    /* Promotional Carousel Control */
    // Initialize carousel with auto-slide functionality
    function initializeCarousel() {
        var carousel = document.getElementById('promoCarousel');
        if (!carousel) return;

        // Updates slide indicator
        function updateIndicator() {
            if ($('#carouselIndicator').length > 0) {
                $('#carouselIndicator').text('Promotion ' + currentSlide + ' of ' + totalSlides);
            }
        }

        // Handles slide change
        carousel.addEventListener('slid.bs.carousel', function() {
            var activeIndex = $('.carousel-item.active').index();
            currentSlide = activeIndex + 1;
            updateIndicator();
        });

        // Pause on hover
        $(carousel).hover(
            function() {
                $(this).carousel('pause');
            },
            function() {
                $(this).carousel('cycle');
            }
        );

        // Auto-slide every 5 seconds
        setInterval(function () {
            $('#promoCarousel').carousel('next');
        }, 5000);

        updateIndicator();
    }

    /* Dashboard Statistics */
    // Populate Statistics dynamically
    function loadStatistics() {
        animateCounter('#availableFlights', dashboardStats.availableFlights, '', '');
        animateCounter('#activeBookings', dashboardStats.activeBookings, '', '');
        animateCounter('#popularDestinations', dashboardStats.popularDestinations, '', '');
    }

    /* Suggested Flights Section */
    // Generates flight cards dynamically
    function loadSuggestedFlights() {
        var container = $('#suggestedFlightsContainer');
        if (container.length === 0) return;

        var html = '<div class="row g-4">';

        for (var i = 0; i < suggestedFlights.length; i++) {
            var flight = suggestedFlights[i];
            var badgeClass = flight.category === 'Best Seller' ? 'bg-success' :
                        flight.category === 'Limited Seats' ? 'bg-warning text-dark' :
                        flight.category === 'New Route' ? 'bg-info' : 'bg-primary';

            html += '<div class="col-md-6 col-lg-3 flight-card" data-destination="' + flight.destination + '">';
            html += '<div class="card h-100 shadow-sm border-0">';
            html += '<img src="' + flight.image + '" class="card-img-top" alt="' + flight.destination + '">';
            html += '<div class="card-body">';
            html += '<div class="d-flex justify-content-between align-items-start mb-2">';
            html += '<div><h5 class="card-title mb-0">' + flight.destination + '</h5>';
            html += '<small class="text-muted">' + flight.airportCode + '</small></div>';
            html += '<span class="badge ' + badgeClass + '">' + flight.category + '</span>';
            html += '</div>';
            html += '<div class="d-flex align-items-center justify-content-between mt-3">';
            html += '<div><small class="text-muted d-block"> From </small>';
            html += '<span class="fw-bold text-primary">$' + flight.price + '<span></div>';
            html += '<div class="d-flex gap-2">';
            html += '<button class="btn btn-outline-danger btn-sm favorite-btn" data-destination="' + flight.destination + '">';
            html += '<i class="bi bi-heart"></i></button>';
            html += '<button class="btn btn-outline-primary btn-sm book-btn" data-destination="' + flight.destination + '"> Book </button>';
            html += '</div></div></div></div></div>';
        }

        html += '</div>';
        container.html(html);

        // Initialize card interactions after loading cards
        initializeFlightCardInteractions();
        initializeHoverInteractions();
    }

    /* Flight Card interactions */
    // Initialize it
    function initializeFlightCardInteractions() {
        // Book Button Click
        $('.book-btn').on('click', function() {
            var destination = $(this).data('destination');
            showToast('Success', 'Redirecting to book flight to ' + destination, 'success');
            setTimeout(function() {
                window.location.href = 'booking.html';
            }, 1500);
        });

        // Favorite Button Click
        $('.favorite-btn').on('click', function() {
            var btn = $(this);
            var icon = btn.find('i');

            if (icon.hasClass('bi-heart-fill')) {
                icon.removeClass('bi-hear-fill').addClass('bi-heart');
                favoriteCount--;
                showToast('Info', 'Remove from favorites', 'info');
            } else {
                icon.removeClass('bi-heart').addClass('bi-heart-fill');
                favoriteCount++;
                showToast('Success', 'Added to favorites', 'success');
            }

            if ($('#favoriteCounter').length > 0) {
                $('#favoriteCounter').text('Favorites: ' + favoriteCount);
            }
        });
    }

    /* Hover Interactions */
    // Initialize hover effects on flight cards
    function initializeHoverInteractions() {
        $('.flight-card').on('mouseenter', function() {
            $(this).find('.card').addClass('shadow-lg');
            $(this).find('.card').css('transform', 'scale(1.02)');
            $(this).find('.card').css('transition', 'all 0.3s ease');
        });

        $('.flight-card').on('mouseleave', function() {
            $(this).find('.card').removeClass('shadow-lg');
            $(this).find('.card').css('transform', 'scale(1)');
        });
    }

    /* Recently Viewed Flights */
    // Load recently viewed flights
    function loadRecentlyViewedFlights() {
        var container = $('#recentlyFlightContainer');
        if (container.length === 0) return; 

        var html = '<div class="row g-3">';

        for (var i = 0; i < recentlyViewedFlights.length; i++) {
            var flight = recentlyViewedFlights[i];

            html += '<div class="col-12">';
            html += '<div class="card border">';
            html += '<div class="card-body d-flex justify-content-betweeen align-items-center py-2">';
            html += '<div><h6 class="mb-0">' + flight.destination + '</h6';
            html += '<small class="text-muted">' + flight.airportCode + ' • ' + flight.lastViewed + '</small></div>';
            html += '<div class="text-end"><span class="fw-bold text-primary"> $' + flight.price + '</span></div>';
            html += '</div></div></div>';
        }

        html += '</div>';
        container.html(html);
    }
    
    /* Destination Filter */
    // Initialize Destination Filter 
    function initializeDestinationFilter() {
        var filter = $('#destinationFilter');
        if (filter.length === 0) return;
        
        filter.on('change', function() {
            var selectedDestination = $(this).val();
            var cards = $('.flight-card');
            var visibleCount = 0;

            cards.each(function () {
                var cardDestination = $(this).data('destination');

                // Case insensitive comparison
                if (selectedDestination === 'all' ||
                    cardDestination.toLowerCase() === selectedDestination.toLowerCase()) {
                    $(this).fadeIn(300);
                    visibleCount++;
                } else {
                    $(this).fadeOut(300);
                }
            });

            if ($('#flightCount').length > 0) {
                $('#flightCount').text('Showing ' + visibleCount + ' Flights');
            }
            
            showToast('Info', 'Filtering destinations', 'info');
        });
    }

    /* Search Auto-Suggestion */
    // Initialize search auto-suggestions
    function initializeSearchSuggestions() {
        var input = $('#flightSearchInput');
        var container = $('#suggestionsContainer');

        if (input.length === 0 || container.length === 0) return;

        input.on('input', function() {
            var query = $(this).val().toLowerCase();

            if (query.length === 0) {
                container.hide();
                return;
            }

            var filtered = searchSuggestions.filter(function(s) {
                return s.toLowerCase().indexOf(query) !== -1;
            });

            if (filtered.length === 0) {
                container.hide();
                return;
            }

            var html = '';
            for (var i = 0; i < filtered.length; i++) {
                html += '<div class="suggestion-item p-2 border-bottom"> ' + filtered[i] + '</div>';
            }

            container.html(html).show();

            // Suggestion click handler
            container.find('.suggestion-item').on('click', function() {
                input.val($(this).text());
                container.hide();
            });
        });

        // Hide Suggestion when clicking outside
        $(document).on('click', function(e) {
            if (!input.is(e.target) && !container.is(e.target)) {
                container.hide();
            }
        });
    }

    /* Quick Flight Search widget */
    // Initialize quick search functionality
    function initializeQuickSearch() {
        var searchBtn = $('#quickSearchBtn');

        if (searchBtn.length === 0) return;

        searchBtn.on('click', function() {
            var origin = $('#origin').val();
            var destination = $('#destination').val();
            var departure = $('#departure').val();

            // Validation
            if (!origin || origin === '') {
                showToast('Warning', 'Please select origin', 'warning');
                return;
            }

            if (!destination || destination === '') {
                showToast('Warning', 'Please select destination', 'warning');
                return;
            }

            if (!departure || departure === '') {
                showToast('Warning', 'Please select departure date', 'warning');
                return;
            }

            if (origin === destination) {
                showToast('Warning', 'Origin and destination cannot be the same', 'warning');
                return;
            }

            // Show loading Spinner
            showSpinner();

            // Wait 1.5s then redirect
            setTimeout(function() {
                hideSpinner();
                showToast('Success', 'Redirecting to Search Flights', 'success');

                setTimeout(function() {
                    window.location.href = 'search.html';
                }, 1000);
            }, 1500);
        });
    }

    /* Scroll Animations */
    // Scroll animations for sections
    function initializeAnimations() {
        var sections = ['.hero-banner', '.flight-stats', '.suggested-flights', '.recent-flights'];
        
        // Adds fade-in class initially
        $(sections.join(', ')).addClass('opacity-0');

        // Animate on scroll
        $(window).on('scroll', function() {
            $(sections.join(', ')).each(function() {
                var element = $(this);
                var position = element.offset().top;
                var scrollPosition = $(window).scrollTop() + $(window).height;

                if (position < scrollPosition - 100 && !element.hasClass('animated')) {
                    element.animate({ opacity: 1 }, 500);
                    element.css('transform', 'translateY(0)');
                    element.addClass('animated');
                }
            });
        });

        // Trigger initial check
        $(window).trigger('scroll');
    }

    /* Responsive UI Features */ 
    // Initialize responsive UI features
    function initializeResponsiveUI() {
        function checkScreenSize() {
            var screenWidth = $(window).width();

            if (screenWidth < 768) {
                // Show mobile notice
                if ($('#mobileNotice').length === 0) {
                    $('.container').first().prepend('<div id="mobileNotice" class="alert alert-info mb-3"><i class="bi bi-phone me-2"></i> Mobile View Active </div>');
                }
            } else {
                // Hide mobile Notice
                $('#mobileNotice').remove();
            }
        }

        // Initial Check
        checkScreenSize();
        // Check on resize
        $(window).on('resize', checkScreenSize);
    }

    /* Dark/Light Mode toggle */
    // Initialize theme toggle
    function initializeThemeToggle() {
        var toggleBtn = $('#themeToggle');

        if (toggleBtn.length === 0) return;

        toggleBtn.on('click', function () {
            var body = $('body');
            var icon = $(this).find(i);

            if (body.hasClass('dark-mode')) {
                body.removeClass('dark-mode');
                icon.removeClass('bi-sun').addClass('bi-moon');
                showToast('Info', 'Light mode enabled', 'info');
            } else {
                body.addClass('dark-mode');
                icon.removeClass('bi-moon').addClass('bi-sun');
                showToast('Info', 'Dark mode enabled', 'info');
            }
        });
    }

    /* News Ticker / travel alerts */
    // Initialize rotating travel alerts
    function initializeTravelAlerts() {
        var alertsContainer = $('#travelAlerts');
        if (alertsContainer.length === 0) return;
        // Show first alert
        alertsContainer.text(travelAlerts[0]);
        // Rotate every 4seconds
        setInterval(function() {
            currentAlertIndex = (currentAlertIndex + 1) % travelAlerts.length;
            alertsContainer.fadeOut(300, function() {
                $(this).text(travelAlerts[currentAlertIndex]).fadeIn(300);
            });
        }, 4000);
    }

    /* Welcome Toast */
    // Shows welcome toast on page load
    function showWelcomeToast() {
        setTimeout(function() {
            showToast('Welcome', 'Welcome to Lorem Ipsum!', 'success');
        }, 1000);
    }

    /* Error handling utility */
    // Checks if element exists before manipulation
    function validateElement(elementId) {
        return $(elementId).length > 0;
    }

    /* Page Initialization */
    // Master initialization function
    function initializeHomePage() {
        // Initialize All
        initializeToolTips();
        initializeCarousel();
        loadStatistics();
        loadSuggestedFlights();
        loadRecentlyViewedFlights();
        initializeDestinationFilter();
        initializeSearchSuggestions();
        initializeQuickSearch();
        initializeAnimations();
        initializeResponsiveUI();
        initializeThemeToggle();
        initializeTravelAlerts();
        showWelcomeToast();

        // Console log for debugging
        console.log('Homepage initialized successfully');
    }

    // Execute it
    initializeHomePage();
});