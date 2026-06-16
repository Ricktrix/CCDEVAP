/* =============================================
   Placeholder - Admin Reservations Page
   js/admin-reservations.js
   ============================================= */

$(document).ready(function () {

    /* ── Local editable copy ── */
    let reservations  = JSON.parse(JSON.stringify(RESERVATIONS));
    let filtered      = [...reservations];
    let currentPage   = 1;
    let refToCancel   = null;
    let refToDelete   = null;
    const PER_PAGE    = 8;

    /* ── Stats + revenue ── */
    function renderStats() {
        const confirmed = reservations.filter(r => r.status === "Confirmed");
        const pending   = reservations.filter(r => r.status === "Pending").length;
        const cancelled = reservations.filter(r => r.status === "Cancelled").length;
        const revenue   = confirmed.reduce((s, r) => s + r.price, 0);
        const avg       = confirmed.length ? Math.round(revenue / confirmed.length) : 0;

        const stats = [
            { label: "Total Reservations", value: reservations.length,  color: "primary", icon: "bi-journal-check"         },
            { label: "Confirmed",           value: confirmed.length,     color: "success", icon: "bi-check-circle-fill"      },
            { label: "Pending",             value: pending,              color: "warning", icon: "bi-clock-fill"             },
            { label: "Cancelled",           value: cancelled,            color: "danger",  icon: "bi-x-circle-fill"          }
        ];

        const html = stats.map(s => `
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 p-3 text-center hover-card">
                    <div class="bg-${s.color} bg-opacity-10 rounded p-2 d-inline-block mb-2 mx-auto">
                        <i class="bi ${s.icon} fs-5 text-${s.color}"></i>
                    </div>
                    <div class="fw-bold fs-4 text-${s.color}">${s.value}</div>
                    <div class="text-muted small">${s.label}</div>
                </div>
            </div>`
        ).join("");

        $("#resStatsRow").html(html);
        $("#totalRevenue").text(formatPrice(revenue));
        $("#avgBooking").text(formatPrice(avg));
        $("#monthlyRevenue").text(formatPrice(Math.round(revenue * 0.3)));
    }

    /* ── Filter + sort ── */
    function applyFilters() {
        const q      = $("#adminResSearch").val().toLowerCase();
        const status = $("#adminResStatusFilter").val();
        const cabin  = $("#adminResCabinFilter").val();
        const sort   = $("#adminResSort").val();

        filtered = reservations.filter(r => {
            if (q && !r.ref.toLowerCase().includes(q) &&
                     !r.name.toLowerCase().includes(q) &&
                     !r.route.toLowerCase().includes(q)) return false;
            if (status && r.status !== status) return false;
            if (cabin  && r.cabin  !== cabin)  return false;
            return true;
        }).sort((a, b) => {
            if (sort === "date-desc")  return b.date.localeCompare(a.date);
            if (sort === "date-asc")   return a.date.localeCompare(b.date);
            if (sort === "price-desc") return b.price - a.price;
            if (sort === "price-asc")  return a.price - b.price;
            return 0;
        });

        currentPage = 1;
        renderTable();
    }

    /* ── Render table ── */
    function renderTable() {
        const start   = (currentPage - 1) * PER_PAGE;
        const page    = filtered.slice(start, start + PER_PAGE);
        const total   = filtered.length;
        const totalPg = Math.ceil(total / PER_PAGE);

        if (!page.length) {
            $("#adminResTableBody").html(`
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-inbox me-2"></i> No reservations found.
                    </td>
                </tr>`
            );
            $("#adminResPaginationInfo").text("No results");
            $("#adminResPagination").html("");
            return;
        }

        const rows = page.map(r => `
            <tr>
                <td class="ps-3">
                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold">
                        ${r.ref}
                    </span>
                </td>
                <td class="fw-semibold small">${r.name}</td>
                <td class="small text-muted">${r.route}</td>
                <td class="small text-muted">${r.flightId}</td>
                <td class="small">${r.date}</td>
                <td><span class="badge bg-secondary-subtle text-secondary border">${r.seat}</span></td>
                <td class="small">${r.cabin}</td>
                <td>${getStatusBadge(r.status)}</td>
                <td class="fw-bold text-primary small">${formatPrice(r.price)}</td>
                <td class="text-end pe-3">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" title="View"
                                onclick="openViewAdminRes('${r.ref}')">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button class="btn btn-outline-warning" title="Edit"
                                onclick="openEditAdminRes('${r.ref}')">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-outline-danger" title="Cancel"
                                onclick="promptCancelAdminRes('${r.ref}')"
                                ${r.status === "Cancelled" || r.status === "Completed" ? "disabled" : ""}>
                            <i class="bi bi-x-circle"></i>
                        </button>
                        <button class="btn btn-outline-dark" title="Delete"
                                onclick="promptDeleteAdminRes('${r.ref}')">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>`
        ).join("");

        $("#adminResTableBody").html(rows);
        $("#adminResPaginationInfo").text(
            `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} reservations`
        );

        /* Pagination */
        let pgHtml = `
            <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">‹</a>
            </li>`;
        for (let i = 1; i <= totalPg; i++) {
            pgHtml += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }
        pgHtml += `
            <li class="page-item ${currentPage === totalPg ? "disabled" : ""}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">›</a>
            </li>`;
        $("#adminResPagination").html(pgHtml);
    }

    /* Pagination click */
    $(document).on("click", "#adminResPagination .page-link", function (e) {
        e.preventDefault();
        const pg  = parseInt($(this).data("page"));
        const max = Math.ceil(filtered.length / PER_PAGE);
        if (pg < 1 || pg > max) return;
        currentPage = pg;
        renderTable();
    });

    /* ── View ── */
    window.openViewAdminRes = function (ref) {
        const r   = reservations.find(x => x.ref === ref);
        const tax = Math.round(r.price * 0.12);
        $("#viewAdminResBody").html(`
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card border-0 bg-light p-3 rounded-3 h-100">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <div class="text-muted small"> Booking Reference </div>
                                <div class="fw-bold fs-5 text-primary">${r.ref}</div>
                            </div>
                            ${getStatusBadge(r.status)}
                        </div>
                        <table class="table table-sm mb-0">
                            <tr><td class="text-muted small border-0 ps-0"> Passenger </td> <td class="fw-semibold small border-0">${r.name}</td></tr>
                            <tr><td class="text-muted small ps-0"> Route </td>      <td class="fw-semibold small">${r.route}</td></tr>
                            <tr><td class="text-muted small ps-0"> Flight ID </td>  <td class="fw-semibold small">${r.flightId}</td></tr>
                            <tr><td class="text-muted small ps-0"> Travel Date </td><td class="fw-semibold small">${r.date}</td></tr>
                            <tr><td class="text-muted small ps-0"> Seat </td>       <td class="fw-semibold small">${r.seat}</td></tr>
                            <tr><td class="text-muted small ps-0"> Cabin </td>      <td class="fw-semibold small">${r.cabin}</td></tr>
                            <tr><td class="text-muted small ps-0"> Meal </td>       <td class="fw-semibold small">${r.meal}</td></tr>
                        </table>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card border-0 bg-light p-3 rounded-3 h-100">
                        <div class="fw-semibold mb-2"> Price Breakdown </div>
                        <div class="d-flex justify-content-between small mb-1">
                            <span class="text-muted"> Base Fare </span><span>${formatPrice(r.price)}</span>
                        </div>
                        <div class="d-flex justify-content-between small mb-1">
                            <span class="text-muted"> Airport Tax (12%) </span><span>${formatPrice(tax)}</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold border-top pt-2 mt-2">
                            <span> Total </span>
                            <span class="text-primary">${formatPrice(r.price + tax)}</span>
                        </div>
                    </div>
                </div>
            </div>`
        );
        new bootstrap.Modal(document.getElementById("viewAdminResModal")).show();
    };

    /* ── Edit ── */
    window.openEditAdminRes = function (ref) {
        const r = reservations.find(x => x.ref === ref);
        $("#erRef").val(r.ref);
        $("#erName").val(r.name);
        $("#erDate").val(r.date);
        $("#erSeat").val(r.seat);
        $("#erStatus").val(r.status);
        $("#erPrice").val(r.price);
        new bootstrap.Modal(document.getElementById("editAdminResModal")).show();
    };

    $("#saveEditAdminResBtn").on("click", function () {
        const ref = $("#erRef").val();
        const r   = reservations.find(x => x.ref === ref);
        if (!r) return;
        r.name   = $("#erName").val();
        r.date   = $("#erDate").val();
        r.seat   = $("#erSeat").val();
        r.status = $("#erStatus").val();
        r.price  = parseInt($("#erPrice").val()) || r.price;
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("editAdminResModal")).hide();
        showToast("Reservation updated.", "success");
    });

    /* ── Cancel ── */
    window.promptCancelAdminRes = function (ref) {
        refToCancel = ref;
        $("#cancelAdminResRef").text(ref);
        new bootstrap.Modal(document.getElementById("cancelAdminResModal")).show();
    };

    $("#confirmCancelAdminResBtn").on("click", function () {
        if (!refToCancel) return;
        const r = reservations.find(x => x.ref === refToCancel);
        if (r) r.status = "Cancelled";
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("cancelAdminResModal")).hide();
        showToast(`Booking ${refToCancel} cancelled.`, "warning");
        refToCancel = null;
    });

    /* ── Delete ── */
    window.promptDeleteAdminRes = function (ref) {
        refToDelete = ref;
        $("#deleteAdminResRef").text(ref);
        new bootstrap.Modal(document.getElementById("deleteAdminResModal")).show();
    };

    $("#confirmDeleteAdminResBtn").on("click", function () {
        if (!refToDelete) return;
        reservations = reservations.filter(x => x.ref !== refToDelete);
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("deleteAdminResModal")).hide();
        showToast("Reservation deleted.", "danger");
        refToDelete = null;
    });

    /* ── Add reservation ── */
    function populateFlightDropdown() {
        const opts = FLIGHTS.map(f =>
            `<option value="${f.id}" data-price="${f.price}" data-route="${f.from} → ${f.to}">
                ${f.id} – ${f.from} → ${f.to} (${formatPrice(f.price)})
            </option>`
        ).join(""); 
        $("#arFlight").append(opts);
    }

    $("#arFlight").on("change", function () {
        const selected = $(this).find(":selected");
        const price    = selected.data("price");
        if (price) $("#arPrice").val(price);
    });

    $("#saveAddResBtn").on("click", function () {
        const name   = $("#arName").val().trim();
        const flight = $("#arFlight").val();
        const date   = $("#arDate").val();

        if (!name)   { showToast("Passenger name is required.", "warning"); return; }
        if (!flight) { showToast("Please select a flight.", "warning"); return; }
        if (!date)   { showToast("Travel date is required.", "warning"); return; }

        const f   = FLIGHTS.find(x => x.id === flight);
        const route = f ? `${f.from} → ${f.to}` : "N/A";

        const newRes = {
            ref:      "SKY-" + String(reservations.length + 1).padStart(3, "0"),
            name:     name,
            route:    route,
            flightId: flight,
            seat:     $("#arSeat").val() || "TBA",
            date:     date,
            status:   $("#arStatus").val(),
            price:    parseInt($("#arPrice").val()) || (f ? f.price : 0),
            cabin:    $("#arCabin").val(),
            meal:     $("#arMeal").val()
        };

        reservations.unshift(newRes);
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("addResModal")).hide();
        showToast(`Reservation ${newRes.ref} created!`, "success");
        $("#arName, #arSeat, #arDate, #arPrice").val("");
        $("#arFlight").val("");
    });

    /* ── Export ── */
    $("#exportResBtn").on("click", function () {
        showToast("Exporting reservations to CSV…", "info");
        setTimeout(() => showToast("Export complete!", "success"), 1200);
    });

    /* ── Event listeners ── */
    $("#adminResSearch").on("input", applyFilters);
    $("#adminResStatusFilter, #adminResCabinFilter, #adminResSort").on("change", applyFilters);
    $("#clearAdminResFilters").on("click", function () {
        $("#adminResSearch").val("");
        $("#adminResStatusFilter, #adminResCabinFilter").val("");
        applyFilters();
        showToast("Filters cleared.", "info");
    });

    /* ── Init ── */
    populateFlightDropdown();
    renderStats();
    applyFilters();

});
