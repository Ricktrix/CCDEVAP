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
        
    }
})