/* reservations.js */
$(document).ready(function() {
    // Static dummy datas
    const reservations = [
        { reservationId: 1, bookingReference: "SJ-2026-10452", passengerName: "Maria Santos", flightNumber: "SJ 101", origin: "MNL", destination: "NRT", departureDate: "2026-07-10", departureTime: "06:00", arrivalTime: "14:30", seatNumber: "3A", cabinClass: "Economy", bookingDate: "2026-06-01", status: "Confirmed", totalPrice: 320 },
        { reservationId: 2, bookingReference: "SJ-2026-10453", passengerName: "Juan dela Cruz", flightNumber: "PR 502", origin: "MNL", destination: "DXB", departureDate: "2026-07-15", departureTime: "22:00", arrivalTime: "04:30", seatNumber: "3C", cabinClass: "Business", bookingDate: "2026-06-03", status: "Confirmed", totalPrice: 550 },
        { reservationId: 3, bookingReference: "SJ-2026-10454", passengerName: "Ana Reyes", flightNumber: "SQ 921", origin: "MNL", destination: "SIN", departureDate: "2026-07-20", departureTime: "11:00", arrivalTime: "14:10", seatNumber: "2F", cabinClass: "Economy", bookingDate: "2026-06-05", status: "Pending", totalPrice: 280 },
        { reservationId: 4, bookingReference: "SJ-2026-10455", passengerName: "Carlos Mendoza", flightNumber: "EK 335", origin: "MNL", destination: "DXB", departureDate: "2026-08-01", departureTime: "14:30", arrivalTime: "20:00", seatNumber: "1A", cabinClass: "First Class", bookingDate: "2026-06-06", status: "Confirmed", totalPrice: 620 },
        { reservationId: 5, bookingReference: "SJ-2026-10456", passengerName: "Liza Villanueva", flightNumber: "QR 931", origin: "MNL", destination: "DOH", departureDate: "2026-08-05", departureTime: "01:00", arrivalTime: "06:30", seatNumber: "5B", cabinClass: "Economy", bookingDate: "2026-06-07", status: "Cancelled", totalPrice: 470 },
        { reservationId: 6, bookingReference: "SJ-2026-10457", passengerName: "Roberto Garcia", flightNumber: "SJ 205", origin: "MNL", destination: "SIN", departureDate: "2026-06-25", departureTime: "08:15", arrivalTime: "11:45", seatNumber: "10D", cabinClass: "Economy", bookingDate: "2026-06-08", status: "Confirmed", totalPrice: 210 },
        { reservationId: 7, bookingReference: "SJ-2026-10458", passengerName: "Elena Castillo", flightNumber: "SQ 318", origin: "MNL", destinaion: "LHR", departureDate: "2026-09-01", departureTime: "23:55", arrivalTime: "07:20", seatNumber: "5F", cabinClass: "Business", bookingDate: "2026-06-09", status: "Pending", totalPrice: 980 },
        { reservationId: 8, bookingReference: "SJ-2026-10459", passengerName: "Miguel Torres", flightNumber: "EK 339", origin: "MNL", destination: "CDG", departureDate: "2026-09-10", departureTime: "03:00", arrivalTime: "13:45", seatNumber: "9C", cabinClass: "Economy", bookingDate: "2026-06-10", status: "Confirmed", totalPrice: 850 },
        { reservationId: 9, bookingReference: "SJ-2026-10460", passengerName: "Patricia Lim", flightNumber: "QR 145", origin: "MNL", destination: "LHR", departureDate: "2026-09-20", departureTime: "16:20", arrivalTime: "23:55", seatNumber: "2B", cabinClass: "First Class", bookingDate: "2026-06-11", status: "Confirmed", totalPrice: 1050 },
        { reservationId: 10, bookingReference: "SJ-2026-10461", passengerName: "David Fernandez", flightNumber: "PR 310", origin: "MNL", destination: "NRT", departureDate: "2026-07-05", departureTime: "09:00", arrivalTime: "14:00", seatNumber: "33A", cabinClass: "Economy", bookingDate: "2026-06-12", status: "Completed", totalPrice: 390 }
    ];
    // Internal State
    let filteredReservations = [...reservations];
    let currentPage = 1;
    const perPage = 5;

    /* Page Initialization */
    // Entry point
    function initializeReservationsPage() {
        loadReservations();
        initializeSearch();
        initializeFilters();
        initializeSorting();
        initializePagination();
        initializeReservationActions();
        initializeStatistics();
        initializeResponsiveUI();
        initializeTooltips();
        showWelcomeToast();
    }

    /* Spinner */
    // Loading spinning overlay
    function showSpinner() {
        if ($("#loadingSpinner").length) {
            $("#loadingSpinner").removeClass("d-none").fadeIn(200);
        }
    }

    // Hides the loading spinner overlay
    function hideSpinner() {
        if ($("#loadingSpinner").length) {
            $("#loadingSpinner").fadeOut(200, function() {
                $(this).addClass("d-none");
            });
        }
    }

    /* Toast Notifications */
    function showToast(title, message, type) {
        if (!$("#toastContainer").length) return;

        const icons = {
            success: "bi-check-circle-fill",
            warning: "bi-exclamation-triangle-fill",
            info: "bi-info-circle-fill",
            danger: "bi-x-circle-fill"
        };
        const colors = {
            success: "text-bg-success",
            warning: "text-bg-warning",
            info: "text-bg-info",
            danger: "text-bg-danger"
        };

        const id = "toast-" + Date.now();
        const iconClass = icons[type] || icons.info;
        const colorClass = colors[type] || colors.info;
        const html = `
        <div id="${id}" class="toast align-items-center border-0 ${colorClass}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${iconClass}"></i>
                    <div><strong>${title}</strong><br><span>${message}</span></div>
                </div>
                <button type="button" class-"btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;

        $("#toastContainer").append(html);
        const el = document.getElementById(id);
        const toast = new bootstrap.Toast(el);
        toast.show();
        el.addEventListener("hidden.bs.toast", function() { $(this).remove(); });
    }

    /* TOOLTIPS */
    function initializeTooltips() {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function(el) {
            new bootstrap.Tooltip(el);
        });
    }

    /* ANIMATED COUNTERS */
    function animateCounter(elementId, targetValue) {
        const $el = $("#" + elementId);
        if (!$el.length) return;

        const duration = 1500;
        const frameRate = 16;
        const steps = Math.round(duration / frameRate);
        const increment = targetValue / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(function() {
            step++;
            current += increment;
            if (step >= steps) {
                current = targetValue;
                clearInterval(timer);
            }
            $el.text(Math.round(current));
        }, frameRate);
    }

    /* Statistics */
    function initializeStatistics() {
        const total = reservations.length;
        const confirmed = reservations.filter(r => r.status === "Confirmed").length;
        const pending = reservations.filter(r => r.status === "Pending").length;
        const cancelled = reservations.filter(r => r.status === "Cancelled").length;

        animateCounter("totalReservations", total);
        animateCounter("confirmedReservations", confirmed);
        animateCounter("pendingReservations", pending);
        animateCounter("cancelledReservations", cancelled);
    }

    // Re-calculation and updates the stats cards without animation
    function refreshStatistics() {
        const total = reservations.length;
        const confirmed = reservations.filter(r => r.status === "Confirmed").length;
        const pending = reservations.filter(r => r.status === "Pending").length;
        const cancelled = reservations.filter(r => r.status === "Cancelled").length;

        if ($("#totalReservations").length)     $("#totalReservations").text(total);
        if ($("#confirmedReservations").length)     $("#confirmedReservations").text(confirmed);
        if ($("#pendingReservations").length)       $("#pendingReservations").text(pending);
        if ($("#cancelledReservations").length)     $("#cancelledReservations").text(cancelled);
    }

    /* Load Reservations */
    function loadReservations() {
        filteredReservations = [...reservations];
        currentPage = 1;
        renderReservations();
        populateDestinationFilter();
        loadUpcomingFlights();
        loadRecentActivity();
    }

    /* Render Reservations Table */
    function renderReservations() {
        if(!$("#reservationsTableBody").length) return;

        const start = (currentPage - 1) * perPage;
        const pageSlice = filteredReservations.slice(start, start + perPage);

        $("#reservationsTableBody").empty();

        if (pageSlice.length === 0) {
            $("#reservationsTableBody").html(`
                <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                        <i class="bi bi-snow fs-3 d-block mb-2"></i> No reservations found.
                    </td>
                </tr>`);
            updateResultsCount(0);
            renderPagination();
            return;
        }

        pageSlice.forEach(function(r) {
            const badge = getStatusBadge(r.status);
            const canEdit = r.status !== "Cancelled" && r.status !== "Completed";

            const row = `
            <tr id="reservation-row-${r.reservationId}">
                <td class="fw-semibold text-primary small">${r.bookingReference}</td>
                <td>
                    <div class="fw-semibold">${r.passengerName}</div>
                </td>
                <td class="small">${r.flightNumber}</td>
                <td class="small">${r.origin} → ${r.destination}</td>
                <td class="small">
                    <div>${formatDate(r.departureDate)}</div>
                    <div class="text-muted">${r.departureTime}</div>
                </td>
                <td class="small">${r.seatNumber}<br><span class="text-muted">${r.cabinClass}</span></td>
                <td>${badge}</td>
                <td class="fw-bold text-primary">$${r.totalPrice}</td>
                <td>
                    <div class="d-flex gap-1 flex-wrap">
                        <button class="btn btn-sm btn-outline-primary view-reservation-btn" data-id="${r.reservationId}" data-bs-toggle="tooltip" title="View Details" aria-label="View reservation ${r.bookingReference}">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${canEdit ? `
                        <button class="btn btn-sm btn-outline-warning edit-reservation-btn" data-id="${r.reservationId}" data-bs-toggle="tooltip" title="Edit Reservation" aria-label="Edit Reservation ${r.bookingReference}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger cancel-reservation-btn" data-id="${r.reservationId}" data-bs-toggle="tooltip" title="Cancel Reservation" aria-label="Cancel reservation ${r.bookingReference}">
                            <i class="bi bi-x-circle"></i>
                        </button>` : ""}
                        <button class="btn btn-sm btn-outline-success download-ticket-btn" data-id="${r.reservationId}" data-bs-toggle="tooltip" title="Download E-Ticktet" aria-label="Download ticket for ${r.bookingReference}">
                            <i class="bi bi-download"></i>
                        </button>
                    </div>
                </td>
            </tr>`;

            $("#reservationsTableBody").append(row);
        });

        updateResultsCount(filteredReservations.length);
        renderPagination();
        initializeTooltips();
    }

    // Returns the bootstrap badge HTML string for a given status
    function getStatusBadge(status) {
        const map = {
            Confirmed: "bg-success",
            Pending: "bg-warning text-dark",
            Cancelled: "bg-danger",
            Completed: "bg-secondary"
        };
        const cls = map[status] || "bg-light text-dark";
        return `<span class="badge ${cls}">${status}</span>`;
    }

    // Formats and ISO date string to a readable format
    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric"});
    }

    /* Result Count */
    function updateResultsCount(count) {
        if($("#resultsCount").length) {
            $("#resultsCount").text(`Showing ${count} Reservation${count !== 1 ? "s" : ""}`);
        }
    }

    /* Search */
    function initializeSearch() {
        if (!$("#reservationSearch").length) return;

        $("#reservationSearch").on("input", function() {
            applyAllFitlers();
        });
    }

    /* Filters */
    function populateDestinationFilter() {
        if(!$("#destinationFilter").length) return;

        const destinations = [...new Set(reservations.map(r => r.destination))].sort();
        $("#destinationFilter").empty().append('</option value="">All Destinations</option>');
        destinations.forEach(function(dest) {
            $("#destinationFilter").append(`<option value="${dest}">${dest}</option>`);
        });
    }

    // Binds all filter dropdowns
    function initializeFilters() {
        $(document).on("change", "#statusFilter, #destinationFilter, #dateFilter", function() {
            currentPage = 1;
            applyAllFilters();
        });
    }

    // Central fiter engine - reads search input + all dropdowns
    function applyAllFilters() {
        const query = ($("#reservationSearch").val() || "").toLowerCase().trim();
        const status = ($("#statusFilter").val() || "").toLowerCase();
        const dest = ($("#destinationFilter").val() || "").toLowerCase();
        const date = ($("#dateFilter").val() || "");

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredReservations = reservations.filter(function(r) {
            // Text search
            if (query) {
                const hayStack = [ r.bookingReference, r.passengerName, r.flightNumber, r.destination ].join(" ").toLowerCase();
                if (!hayStack.includes(query)) return false;
            }
            // Staus Fitler
            if (status && r.status.toLowerCase() !== status) return false;
            // Destination filter
            if (dest && r.destination.toLowerCase() !== dest) return false;
            // Date Fitler
            if (date && date !== "all") {
                const dep = new Date(r.departureDate + "T00:00:00");
                dep.setHours(0, 0, 0, 0);

                if (date === "today") {
                    if (dep.getTime() !== today.getTime()) return false;
                } else if (date === "week") {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(today.getDate() + 7);
                    if (dep < today || dep > weekEnd) return false;
                } else if (date === "month") {
                    if (dep.getMonth() !== today.getMonth() || dep.getFullYear() !== today.getFullYear()) return false;
                }
            }
            return true;
        });
        currentPage = 1;
        renderReservations();
    }

    /* Sorting */
    function intializeSorting() {
        if (!$("#sortReservations").length) return;

        $("#sortReservations").on("change", function() {
            const criterion = $(this).val();
            sortReservations(criterion);
        });
    }

    function sortReservations(criterion) {
        filteredReservations.sort(function(a, b) {
            if (criterion === "bookingDate") {
                return new Date(a.bookingDate) - new Date(b.bookingDate);
            } else if (criterion === "departureDate") {
                return new Date(a.departureDate) - new Date(b.departureDate);
            } else if (criterion === "passengerName") {
                return a.passengerName.localeCompare(b.passengerName);
            } else if (criterion === "price") {
                return a.totalPrice - b.totalPrice;
            }
            return 0;
        });

        currentPage = 1;
        renderReservations();
        showToast("Sorted", "Reservations sorted successfully.", "info");
    }

    /* Pagination */
    function initializePagination() {
        $(document).on("click", "#paginationContainer .page-link", function(e) {
            e.preventDefault();
            const action = $(this).data("action");

            if (action === "prev") {
                if (currentPage > 1) currentPage--;
            } else if (action === "next") {
                const totalPages = Math.ceil(filteredReservations.length / perPage);
                if (currentPage < totalPages) currentPage++;
            } else {
                currentPage = parseInt(action);
            }

            renderReservations();
        });
    }

    // Renders pagination controls into #paginationContainer
    function renderPagination() {
        if (!$("#paginationContainer").length) return;
        const totalPages = Math.ceil(filteredReservations.length / perPage);
        $("#paginationContainer").empty();

        if (totalPages <= 1) return;

        let html = '<ul class="pagination pagination-sm mb-0 flex-wrap">';
        // Previously 
        html += `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-action="prev" aria-label=""Previous">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>`;
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" data-action="${i}" aria-label="Page ${i}">${i}</a>
            </li>`;
        }
        // Next
        html += `
            <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
                <a class="page-link" href="#" data-action="next" aria-label="Next">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>`;
        html += "</ul>";
        $("#paginationContainer").html(html);
    }

    /* Reservation Actions */
    function initializeReservationActions() {
        // View Details
        $(document).on("click", ".view-reservation-btn", function() {
            const id = parseInt($(this).data("id"));
            const r = reservations.find(x => x.reservationId === id);
            if (!r || !$("#reservationDetailsModal").length) return;

            populateDetailsModal(r);
            new bootstrap.Modal(document.getElementById("reservationDetailsModal")).show();
        });
        // Edit Reservations
        $(document).on("click", ".edit-reservation-btn", function() {
            const id = parseInt($(this).data("id"));
            const r = reservations.find(x => x.reservationId === id);
            if (!r || !$("#editReservationModal").length) return;

            populateEditModal(r);
            new bootstrap.Modal(document.getElementById("editReservationModal")).show();
        });
        // Save Edit
        $(document).on("click", "#saveReservationChangesBtn", function() {
            const id = parseInt($("#editReservationId").val());
            const idx = reservations.findIndex(x => x.reservationId === id);
            if (idx === -1) return;

            const newSeat = $("#editSeatNumber").val().trim();
            const newCabin = $("#editCabinClass").val();

            if (!newSeat) {
                showToast("Validation Error", "Seat number cannot be empty.", "warning");
                return;
            }
            showSpinner();
            setTimeout(function() {
                reservations[idx].seatNumber = newSeat;
                reservations[idx].cabinClass = newCabin;
                applyAllFilters();
                refreshStatistics();
                hideSpinner();
                const modal = bootstrap.Modal.getInstance(document.getElementById("editReservationModal"));
                if (modal) modal.hide();
                showToast("Reservation Updated", `${reservations[idx].bookingReference} has been updated.`, "success");
                addRecentActivity("Reservation Updated", `${reservations[idx].bookingReference} seat changed to ${newSeat}.`);
            }, 800);
        });
        // Cancel Reservation
        let pendingCancelId = null;
        $(document).on("click", ".cancel-reservation-btn", function() {
            pendingCancelId = parseInt($(this).data("id"));
            const r = reservations.find(x => x.reservationId === pendingCancelId);
            if (!r) return;

            if ($("#cancelBookingRef").length) {
                $("#cancelBookingRef").text(r.bookingReference);
            }
            if ($("#cancelReservationModal").length) {
                new bootstrap.Modal(document.getElementById("cancelReservationModal")).show();
            }
        });

        $(document).on("click", "#confirmCancelBtn", function() {
            if (pendingCancelId === null) return;

            const idx = reservations.findIndex(x => x.reservationId === pendingCancelId);
            if (idx === -1) return;
            showSpinner();
            setTimeout(function() {
                reservations[idx].status = "Cancelled";
                const modal = bootstrap.Modal.getInstance(document.getElementById("cancelReservationModal"));
                if (modal) modal.hide();
                applyAllFilters();
                refreshStatistics();
                hideSpinner();
                showToast("Reservation Cancelled", `${reservations[idx].bookingReference} has been cancelled.`, "warning");
                addRecentActivity("Reservation Cancelled", `${reservations[idx].bookingReference} was cancelled.`);
                pendingCancelId = null;
            }, 800);
        });

        // Download Ticket
        $(document).on("click", ".download-ticket-btn", function() {
            const id = parseInt($(this).data("id"));
            const r = reservations.find(x => x.reservationId === id);
            showSpinner();
            setTimeout(function() {
                hideSpinner();
                showToast("Ticket Downloaded", `E-ticket for ${r ? r.bookingReference : "flight"} downloaded successfully.`, "success");
                addRecentActivity("Ticket Downloaded", `E-Ticket for ${r ? r.bookingReference : "flight"} was downloaded.`);
            }, 700);
        });

        // Refresh
        if ($("#refreshReservationsBtn").length) {
            $("#refreshReservationsBtn").on("click", function() {
                showSpinner();
                setTimeout(function() {
                    filteredReservations = [...reservations];
                    currentPage = 1;
                    if ($("#reservationSearch").length)     $("#reservationSearch").val("");
                    if ($("#statusFilter").length)      $("#statusFitler").val("");
                    if ($("#destinationFilter").length)     $("#destinationFilter").val("");
                    if ($("dateFilter").length)     $("#dateFilter").val("");
                    if ($("#sortReservations").length)      $("#sortReservations").val("bookingDate");

                    renderReservations();
                    refreshStatistics();
                    hideSpinner();
                    showToast("Refreshed", "Reservations have been reloaded.", "success");
                }, 1000);
            });
        }

        // Export
        if ($("#exportReservationsBtn").length) {
            $("#exportReservationsBtn").on("click", function() {
                showSpinner();
                setTimeout(function() {
                    hideSpinner();
                    showToast("Export Complete", "Reservations exported as CSV successfully.", "info");
                    addRecentActivity("Data Exported", "Reservations list was exported to CSV.");
                }, 900);
            });
        }
    }

    /* Modal Populations */
    // Populates the view details modal with a reservation's data
    function populateDetailsModal(r) {
        const fields = {
            modalViewBookingRef: r.bookingReference,
            modalViewPassenger: r.passengerName,
            modalViewFlight: r.flightNumber,
            modalViewRoute: `${r.origin} -> ${r.destination}`,
            modalViewDepartureDate: formatDate(r.departureDate),
            modalViewDepartureTime: r.departureTime,
            modalViewArrivalTime: r.arrivalTime,
            modalViewSeat: r.seatNumber,
            modalViewCabin: r.cabinClass,
            modalViewBookingDate: formatDate(r.bookingDate),
            modalViewPrice: `$${r.totalPrice}`
        };
        Object.entries(fields).forEach(function([id, val]) {
            if ($("#" + id).length) $("#" + id).text(val);
        });

        // Status badge
        if ($("#modalViewStatus").length) {
            $("#modalViewStatus").html(getStatusBadge(r.status));
        }
    }
    // Populates the edit reservation modal form fields
    function populateEditModal(r) {
        if ($("#editReservationId").length)     $("#editReservationId").val(r.reservationId);
        if ($("#editBookingRef").length)    $("#editBookingRef").text(r.bookingReference);
        if ($("#editPassengerName").length)     $("#editPassengerName").text(r.passengerName);
        if ($("#editSeatNumber").length)    $("#editSeatNumber").val(r.seatNumber);
        if ($("#editCabinClass").length)    $("#editCabinClass").val(r.cabinClass);
    }

    /* Upcoming Flights */
    // Renders up to 3 upcoming confirmed flights
    function loadUpcomingFlights() {
        if (!$("#upcomingFlightsContainer").length) return;
        const today = new Date();
        const upcoming = reservations
            .filter(r => r.status === "Confirmed" && new Date(r.departureDate + "T00:00:00") >= today)
            .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate))
            .slice(0, 3);
        
        $("#upcomingFlightsContainer").empty();
        if (upcoming.length === 0) {
            $("#upcomingFlightsContainer").html(
                '<p class="text-muted small fst-italic">No upcoming flights found.</p>'
            );
            return;
        }
        upcoming.forEach(function(r) {
            const card = `
                <div class="card border-0 shadow-sm mb-3 rounded-3">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <div class="fw-bold text-primary fs-6">${r.destination}</div>
                            ${getStatusBadge(r.status)}
                        </div>
                        <div class="small text-muted mb-1">
                            <i class="bi bi-airplane me-1"></i>${r.flightNumber}
                        </div>
                        <div class="small text-muted">
                            <i class="bi bi-calendar3 me-1"></i>${formatDate(r.departureDate)}
                            &nbsp;
                            <i class="bi bi-clock me-1"></i>${r.departureTime}
                        </div>
                    </div>
                </div>`;
            $("#upcomingFlightsContainer").append(card);
        });
    }

    /* Recent Activity */
    const activityLog = [
        { action: "Reservation Created", detail: "SJ-2026-10452 booked successfully.", time: "2026-06-16 10:30" },
        { action: "Ticket Downloaded", detail: "E-Ticket for SJ-2026-10453 downloaded.", time: "2026-06-15 14:22" },
        { action: "Reservation Updated", detail: "SJ-2026-10454 seat changed to 22F.", time: "2026-06-14 09:10" },
        { action: "Reservation Cancelled", detail: "SJ-2026-10456 was cancelled by passenger.", time: "2026-06-13 17:45" },
        { action: "Reservation Created", detail: "SJ-2026-10460 booked successfully", time: "2026-06-11 08:00" }
    ];

    function loadRecentActivity() {
        if (!$("#recentActivityContainer").length) return;
        renderActivityLog();
    }
    // Re-renders the activity list group
    function renderActivityLog() {
        if (!$("#recentActivityContainer").length) return;
        $("#recentActivityContainer").empty();
        if (activityLog.length === 0) {
            $("#recentActivityContainer").html('<p class="text-muted small">No recent activity.</p>');
            return;
        }
        const iconMap = {
            "Reservation Created": { icon: "bi-plus-circle-fill", color: "text-success" },
            "Reservation Updated": { icon: "bi-pencil-fill", color: "text-warning" },
            "Reservation Cancelled": { icon: "bi-x-circle-fill", color: "text-danger" },
            "Ticket Downloaded": { icon: "bi-download", color: "text-info" },
            "Data Exported": { icon: "bi-file-earmark-arrow-down-fill", color: "text-secondary" }
        };
        const ul = $('<ul class="list-group list-group-flush"></ul>');
        activityLog.slice(0, 8).forEach(function(entry) {
            const meta = iconMap[entry.action] || { icon: "bi-circle-fill", color: "text-secondary" };
            const li = `
                <li class="list-group-item px-0 py-2 border-0 border-bottom">
                    <div class="d-flex align-items-start gap-2">
                        <i class="bi ${meta.icon} ${meta.color} mt-1 flex-shrink-0"></i>
                        <div>
                            <div class="fw-semibold small">${entry.action}</div>
                            <div class="text-muted small">${entry.detail}</div>
                            <div class-"text-muted" style="font-size: 0.75rem;">${entry.time}</div>
                        </div>
                    </div>
                </li>`;
            ul.append(li);
        });
        $("#recentActivityContainer").append(ul);
    }

    // Prepends a new entry to the activityLog and refreshes the widget
    function addRecentActivity(action, detail) {
        const now = new Date();
        const time = now.toISOString().replace("T", " ").substring(0, 16);
        activityLog.unshift({ action, detail, time });
        renderActivityLog();
    }

    /* Responsive UI */
    function initializeResponsiveUI() {
        function checkWidth() {
            if ($(window).width() < 768) {
                if ($("#mobileReservationsNotice").length) {
                    $("#mobileReservationsNotice")
                        .text("Mobile reservation management mode enabled.")
                        .slideDown(300);
                }
            } else {
                if ($("#mobileReservationNotice").length) {
                    $("#mobileReservationNotice").slideUp(300);
                }
            }
        }
        checkWidth();
        $(window).on("resize", checkWidth);
    }

    /* Welcome Toast */
    function showWelcomeToast() {
        setTimeout(function() {
            showToast("My Reservations", "View and manage all your flight bookings here.", "info");
        }, 600);
    }

    // Start it
    initializeReservationsPage();
});