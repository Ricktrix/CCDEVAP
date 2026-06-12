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
        totalBookingsValue: 1542,
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

   /**
    *  Dashboard Statistics
    */
   // Populate dashboard cards dynamically
   function loadStatistics() {
        // Validate elements exist
        if(!validateElement('#totalBookings') ||
            !validateElement('#totalRevenue') ||
            !validateElement('#flightsToday') ||
            !validateElement('#activeUsers')) {
            console.warn('Statistics elements not found in DOM');
            return;
        }

        // Animate Counters
        animateCounter('#totalBookings', dashboardConfig.totalBookingsValue, dashboardConfig.animateDuration, '', '');
        animateCounter('#totalRevenue', dashboardConfig.totalRevenueValue, dashboardConfig.animateDuration, dashboardConfig.currencySymbol, '');
        animateCounter('#flightsToday', dashboardConfig.flightsTodayValue, dashboardConfig.animationDuration, '', '');
        animateCounter('#activeUsers', dashboardConfig.activeUsersValue, dashboardConfig.animationDuration, '', '');
   }

   /* Revenue Chart Placeholder */
   // Render revenue data as Bootstrap Table
   function loadRevenueData() {
    if(!validateElement('#revenueChartContainer')) {
        console.warn('Revenue chart container not found');
        return;
    }

    const $container = $('#revenueChartContainer');
    let tableHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th> Month </th>
                        <th> Revenue </th>
                    </tr>
                </thead>
                <tbody>
    `;
    revenueDataConfig.forEach(data => {
        tableHTML += `
                <tr>
                    <td> ${data.month} </td>
                    <td><strong> $${data.revenue.toLocateString()} </strong></td>
                </tr>
        `;
    });
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    $container.html(tableHTML);
   }

   /* Popular Destinations */
   // Generate Destination cards dynamically
   function loadPopularDestinations() {
    if (!validateElement('#popularDestinationsContainer')) {
        console.warn('Popular destinations container is not found');
        return;
    }

    const $container = $('#popularDestinationsContainer');
    let cardsHTML = '<div class="row g-3">';

    destinationsConfig.forEach(dest => {
        const badgeClass = dest.rank === 1 ? 'bg-warning text-dark' :
                        dest.rank === 2 ? 'bg-secondary' :
                        dest.rank === 3 ? 'bg-danger' : 'bg-light text-dark';
        cardsHTML += `
            <div class="col-12">
                <div class="card h-100 border">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0"> ${dest.name} </h6>
                            <small class=" text-muted"> ${dest.bookings.toLocateString()} bookings </small>
                        </div>
                        <span class="badge ${badgeClass}"> #${dest.rank} </span>
                    </div>
                </div>
            </div>
        `;
    });

    cardsHTML += '</div>';
    $container.html(cardsHTML);
   }

   /* Recent Activity Table */
   // Generate recent activities dynamically
   function loadRecentActivities() {
    if(!validateElement('#recentActivityTableBody')) {
        console.warn('Recent actvity table body not found');
        return;
    }

    const $tableBody = $('#recentActivityTableBody');
    let rowsHTML = '';

    activitiesConfig.forEach(activity => {
        const statusClass = statusClasses[activity.status] || 'bg-secondary';
        const iconClass = activity.status === 'success' ? 'bi-check-circle' :
                    activity.status === 'warning' ? 'bi-exclamation-triangle' :
                    activity.status === 'info' ? 'bi-info-circle' : 'bi-x-circle';

        rowsHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-${activity.status} bg-opacity-10 rounded p-2 me-2">
                            <i class="bi ${iconsClass} text-${activity.status}"></i>
                        </div>
                        <div>
                            <strong> ${activity.activity} </strong>
                            <small class="text-muted d-block"> ${activity.details} </small>
                        </div>
                    </div>
                </td>
                <td> ${activity.user} </td>
                <td> ${activity.date} </td>
                <td><span class="badge ${statusClass}"> ${activity.status.charAt(0).toUpperCase() + activity.status.slice(1)} </span></td>
            </tr>

        `;
    });
    $tableBody.html(rowsHTML);
   }

   /* Dashboard Filters */
   // Initialize event listeners for filters
   function initializeFilters() {
        // Time Filter
        $('#timeFilter').on('change', function() {
            const selectedFilter = $(this).val();

            if(selectedFilter === 'today') {
                animateCounter('#totalBookings', 45, 800, '', '');
                animateCounter('#totalRevenue', 12500, 800, '$', '');
                showToast('Filter Applied', 'Showing today\'s data', 'info');
            } else if (selectedFilter === 'week') {
                animateCounter('#totalBookings', 320, 800, '', '');
                animateCounter('#toalRevenue', 85000, 800, '$', '');
                showToast('Filter Applied', 'Showing this week\'s data', 'info');
            } else if (selectedFilter === 'month') {
                animateCounter('#totalBookings', 1542, 800, '', '');
                animateCounter('#totalRevenue', 582340, 800, '$', '');
                showToast('Filter Applied', 'Showing this month\'s data', 'info');
            }
        });
        // Destination Filter
        $('#destinationFilter').on('change', function() {
            const selectedDest = $(this).val();

            if(selectedDest === 'all') {
                loadPopularDestinations();
                showToast('Filter Reset', 'Showing all destinations', 'info');
            } else {
                // Filter to show single destination
                const filteredDest = destinationsConfig.filter(d => d.name.toLowerCase() === selectedDest);
                if(filteredDest.length > 0) {
                    const $container = $('popularDestinationsContainer');
                    let cardsHTML = '<div class="row g-3">';
                    filteredDest.forEach(dest => {
                        cardsHTML += `
                            <div class="col-12">
                                <div class="card h-100 border">
                                    <div class="card-body d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6 class="mb-0"> ${dest.name} </h6>
                                            <small class="text-muted"> ${dest.bookings.toLocateString()} bookings </small>
                                        </div>
                                        <span class="badge bg-warning text-dark"> #${dest.rank} </span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    cardsHTML += '</div>';
                    $container.html(cardsHTML);
                    showToast('Filter Applied', `Showing ${selectedDest} data`, 'success');
                }
            }
        });
    }

    /* Quick Action Buttons */
    // Initialize button event listeners
    function initializeButtons() {
        // Refresh Dashboard button
        $('#refreshDasboardBtn').on('click', function() {
            showSpinner();
            setTimeout(function() {
                hideSpinner();
                loadStatistics();
                loadRevenueData();
                loadPopularDestinations();
                loadRecentActivities();
                showToast('Dashboard Refreshed', 'Statistics updated successfully', 'success');
            }, 1000);
        });

        // Export Report Button
        $('#exportReportBtn').on('click', function() {
            showSpinner();
            setTimeout(function() {
                hideSpinner();
                showToast('Report Exported', 'Download will start shortly', 'info');
            }, 1500);
        });

        // Generate Analytics Button
        $('#generatedAnalyticsBtn').on('click', function() {
            showSpinner();
            setTimeout(function() {
                hideSpinner();
                loadStatistics();
                loadRevenueData();
                showToast('Analytics Generated', 'New analytics data loaded', 'success');
            }, 2000);
        });
    }
    
    /* Responsive Behavior */
    // Detects screen width and adjust UI
    function initializeResponsiveUI() {
        function checkScreenSize() {
            const screenWidth = $(window).width();

            if(screenWidth < 768) {
                // Mobile View
                if(!$('#mobileNotice').length) {
                    $('.container').prepend('<div id="mobileNotice" class="alert alert-info mobile-notice"><i class="bi bi-phone"></i> Mobile Dashboard View </div>');
                }
                // Collapse optional widgets
                $('.optional-widget').hide();
            } else {
                // Desktop View
                if($('#mobileNotice').length) {
                    $('#mobileNotice').remove();
                }
                // Showing Widgets
                $('.optional-wdiget').show();
            }
        }
        // Initial check
        checkScreenSize();
        
        // Check on resize
        $(window).on('resize', function() {
            checkScreenSize();
        });
    }

    /**
     * Initialization
     */
    /**
     * Master Initialization function
     * Calls all setup functions
     */
    function initializeDashboard() {
        // Load all dashboard components
        loadStatistics();
        loadRevenueData();
        loadPopularDestinations();
        loadRecentActivities();
        // Initialize interactive features
        initializeFilters();
        initializeButtons();
        initializeResponsiveUI();

        // Console Log for debugging
        console.log('Admin Dashboard initialized successfully');
    }

    // Run initialization
    initializeDashboard();

})