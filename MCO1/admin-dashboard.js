/**
 *  Admin-dashboard.js
 *  Lorem Ipsum Airlines Online Ticketing System
 *  Admin Dashboard Functionality
 */

$(document).ready(function () {
    /**
     *  Global Variables and Configuration 
     */

    // Dashbaord Statistics Configuration
    const dasboardConfig = {
        totalBookingValue: 1542,
        totalRevenueValue: 582340,
        flightsTodayValue: 78,
        activeUserValue: 893,
        currencySymbol: '$',
        animationDuration: 1500
    };

    // Revenue Destinations Configuration
    const revenueDataConfig = [
        { month: 'January', revenue: 45000 },
        { month: 'February', revenue: 52000 },
        { month: 'March', revenue: 48000 },
        { month: 'April', revenue: 61000 },
        { month: 'May', revenue: 55000 },
        { month: 'June', revenue: 72000 }
    ];

    // Popular Destinations Configurations
    const destinationsConfig = [
        { name: 'Tokyo', bookings: 1250, rank: 1 },
        { name: 'New York', bookings: 980, rank: 2 },
        { name: 'London', bookings: 850, rank: 3 },
        { name: 'Dubai', bookings: 750, rank: 4 },
        { name: 'Paris', bookings: 640, rank: 5 }
    ];

    // Recent Activities Configuration
    const activitiesConfig = [
        { activity: 'Booking Created', user: 'John Doe', date: 'Today, 10:30AM', status: 'success', details: 'LI-2026-8901 to LAX' },
        { activity: 'Booking Cancelled', user: 'Jane Smith', date: 'Today, 09:15AM', status: 'danger', details: 'LI-2026-8850 to LHR' },
        { activity: 'Flight Updated', user: 'System', date: 'Today, 08:45AM', status: 'warning', details: 'LI-123 delayed 30 mins' },
        { activity: 'User Registered', user: 'Mike Johnson', date: 'Yesterday, 06:30PM', status: 'success', details: 'New Gold Member' },
        { activity: 'Payment Received', user: 'Sarah Brown', date: 'Yesterday, 04:20PM', status: 'success', details: '$890 payment' },
        { activity: 'Seat Changed', user: 'Emily Davis', date: 'Yesterday, 02:15PM', status: 'info', details: '12A to 15C' },
        { activity: 'Meal Updated', user: 'Robert Wilson', date: 'Yesterday, 11:00AM', status: 'info', details: 'Vegetarian meal' },
        { activity: 'Flight Scheduled', user: 'Admin', date: 'Jun 05, 2026', status: 'success', details: 'New route added. ' }, 
        { activity: 'Refund Processed', user: 'Lisa Anderson', date: 'Jun 14, 2026', status: 'warning', details: '$320 refund' },
        { activity: 'Baggage Added', user: 'James Taylor', date: 'Jun 14, 2026', status: 'info', details: 'Extra 23kg bag' } 
    ];

    // Status Badge Classes
    const statusClasses = {
        success: 'bg-success',
        warning: 'bg-warning text-dark',
        info: 'bg-info',
        danger: 'bg-danger'
    };

    /**
     * Toast Notifications
     */
    /**
     * Create reusable function: showToast(title, message, type)
     * @param {string} title - Toast Title
     * @param {string} message - Toast Message
     * @param {string} type - success, warning, info, or danger
     */
    function showToast(title, message, type){
        const toastId = 'toast-' + Date.now();
        const toastClass = type === 'success' ? 'text-success' :
                        type === 'warning' ? 'text-warning' :
                        type === 'info' ? 'text-info': 'text-danger';
        const toastHTML = `
            <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="toast-header">
                <i class="bi ${toastClass} me-2"></i>
                <strong class="me-auto"> ${title} </strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;

        // Create container if not exists
        if(!$('#toastContainer').length) {
            $('body').append('<div id="toastContainer" class="position-fixed top-0 end-0 p-3" style="z-index: 1100;"></div>');
        }
        
        $('#toastContainer').append(toastHTML);

        // Initialize Boostrap toast
        const toastElement = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastElement);
        bsToast.show();

        // Remove after hidden
        $(toastElement).on('hidden.bs.toast', function() {
            $(this).remove();
        });
    }

    /**
     *  Loading spinner 
     */
    // Create reusable function: showSpinner()
    function showSpinner() {
        if(!$('#loadingSpinner').length) {
            const spinnerHTML = `
                <div id="loadingSpinner" class="position-fixed top-50 start-50 translate-middle" style="z-index: 9999;">
                    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden"> Loading... </span>
                    </div>
                </div>
            `;
            $(body).append(spinnerHTML);
        }
        $('#loadingSpinner').show();
    }

    // Create reusable function: hideSpinner()
    function hideSpinner() {
        if($('#loadingSpinner').length) {
            $('#loadingSpinner').hide();
        }
    }

    /**
     *  Animated Counters
     */
    /**
     *  Animate statistics card from 0 to their final values
     * @param {string} elementId - Targets elementID
     * @param {number} targetValue - Final Value
     * @param {number} duration - Animation duration in ms
     * @param {string} prefix - Prefix(e.g., '$')
     * @param {string} suffix - Suffix(e.g., '')
     */
    function animateCounter(elementId, targetValue, duration, prefix, suffix) {
        if(!$(elementId).length) return;
        
        const $element = $(elementId);
        const startValue = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out the function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

            // Format numbers with commas
            const formattedValue = currentValue.toLocateString();
            $element.text(prefix + formattedValue + suffix);

            if(progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Error Handling
    /**
     *  Validates required elements exist before manipulation
     * @param {string} elementId - ElementID to check
     * @returns {boolean} = True if element exist
     */
    function validateElement(elementId) {
        return $(elementId).length > 0;
    }
})