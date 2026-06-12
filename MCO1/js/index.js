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
        if($('#toastContainer').length === 0) {
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
    
})