/* =============================================
   Placeholder - Admin Flights Page
   js/admin-flights.js
   ============================================= */

$(document).ready(function () {

    /* ── Local editable copy of flights ── */
    let flights     = JSON.parse(JSON.stringify(FLIGHTS));
    let filtered    = [...flights];
    let currentPage = 1;
    let flightToDelete = null;
    const PER_PAGE  = 8;

    /* ── Populate modal dropdowns ── */
    function populateModalDropdowns() {
        const airlineOpts = AIRLINES.map((a, i) =>
            `<option value="${i}">${a.name}</option>`
        ).join("");
        $("#afAirline").html(airlineOpts);

        const airportOpts = AIRPORTS.map(a =>
            `<option value="${a.code}">${a.code} – ${a.city}</option>`
        ).join("");
        $("#afFrom, #afTo").html(airportOpts);

        const filterOpts = AIRLINES.map(a =>
            `<option value="${a.name}">${a.name}</option>`
        ).join("");
        $("#flightAirlineFilter").append(filterOpts);
    }

    /* ── Filter + sort ── */
    function applyFilters() {
        const q       = $("#flightSearch").val().toLowerCase();
        const airline = $("#flightAirlineFilter").val();
        const cabin   = $("#flightCabinFilter").val();
        const sort    = $("#flightSort").val();

        filtered = flights.filter(f => {
            const airlineName = AIRLINES[f.airline].name;
            if (q && !f.id.toLowerCase().includes(q) &&
                     !f.from.toLowerCase().includes(q) &&
                     !f.to.toLowerCase().includes(q) &&
                     !airlineName.toLowerCase().includes(q)) return false;
            if (airline && airlineName !== airline) return false;
            if (cabin   && f.cabin !== cabin)       return false;
            return true;
        }).sort((a, b) => {
            if (sort === "price-asc")  return a.price - b.price;
            if (sort === "price-desc") return b.price - a.price;
            if (sort === "dep-asc")    return a.dep.localeCompare(b.dep);
            return 0;
        });

        currentPage = 1;
        renderTable();
    }

    /* ── Render table ── */
    function renderTable() {
        const start    = (currentPage - 1) * PER_PAGE;
        const page     = filtered.slice(start, start + PER_PAGE);
        const total    = filtered.length;
        const totalPg  = Math.ceil(total / PER_PAGE);

        if (!page.length) {
            $("#flightsTableBody").html(`
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-airplane me-2"></i> No flights found.
                    </td>
                </tr>`
            );
            $("#flightPaginationInfo").text("No results");
            $("#flightPagination").html("");
            return;
        }

        const rows = page.map(f => {
            const airline   = AIRLINES[f.airline];
            const seatsClass = f.seats <= 5 ? "text-danger" : f.seats <= 15 ? "text-warning" : "text-success";
            const stopBadge  = f.stops === 0
                ? `<span class="badge bg-success-subtle text-success"> Direct </span>`
                : `<span class="badge bg-warning-subtle text-warning"> ${f.stops} stop </span>`;
            return `
                <tr>
                    <td class="ps-3 fw-semibold small">${f.id}</td>
                    <td>
                        <span class="badge text-white" style="background:${airline.color};">
                            ${airline.code}
                        </span>
                    </td>
                    <td class="small">${f.from} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-right" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                                                </svg> ${f.to}</td>
                    <td class="small">${f.dep}</td>
                    <td class="small text-muted">${f.dur}</td>
                    <td>${stopBadge}</td>
                    <td class="small">${f.cabin}</td>
                    <td class="small ${seatsClass}">${f.seats}</td>
                    <td class="small fw-bold text-primary">${formatPrice(f.price)}</td>
                    <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-warning" title="Edit"
                                    onclick="openEditFlight('${f.id}')">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn btn-outline-danger" title="Delete"
                                    onclick="promptDeleteFlight('${f.id}')">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join("");

        $("#flightsTableBody").html(rows);
        $("#flightPaginationInfo").text(
            `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} flights`
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
        $("#flightPagination").html(pgHtml);
    }

    /* Pagination click */
    $(document).on("click", "#flightPagination .page-link", function (e) {
        e.preventDefault();
        const pg  = parseInt($(this).data("page"));
        const max = Math.ceil(filtered.length / PER_PAGE);
        if (pg < 1 || pg > max) return;
        currentPage = pg;
        renderTable();
    });

    /* ── Add flight ── */
    $("#saveAddFlightBtn").on("click", function () {
        const id    = $("#afId").val().trim();
        const from  = $("#afFrom").val();
        const to    = $("#afTo").val();
        const price = parseInt($("#afPrice").val());

        if (!id)    { showToast("Flight ID is required.", "warning"); return; }
        if (!from || !to) { showToast("Route airports are required.", "warning"); return; }
        if (from === to)  { showToast("Origin and destination cannot be the same.", "warning"); return; }
        if (!price) { showToast("Price is required.", "warning"); return; }

        if (flights.find(f => f.id === id)) {
            showToast("Flight ID already exists.", "danger");
            return;
        }

        const newFlight = {
            id:      id,
            airline: parseInt($("#afAirline").val()),
            from:    from,
            to:      to,
            dep:     $("#afDep").val(),
            arr:     $("#afArr").val(),
            dur:     $("#afDur").val() || "N/A",
            stops:   parseInt($("#afStops").val()),
            seats:   parseInt($("#afSeats").val()) || 50,
            price:   price,
            cabin:   $("#afCabin").val()
        };

        flights.unshift(newFlight);
        applyFilters();
        bootstrap.Modal.getInstance(document.getElementById("addFlightModal")).hide();
        showToast(`Flight ${id} added successfully.`, "success");
        $("#afId, #afDur, #afPrice").val("");
    });

    /* ── Edit flight ── */
    window.openEditFlight = function (id) {
        const f = flights.find(x => x.id === id);
        $("#efId").val(f.id);
        $("#efDep").val(f.dep);
        $("#efArr").val(f.arr);
        $("#efDur").val(f.dur);
        $("#efStops").val(f.stops);
        $("#efSeats").val(f.seats);
        $("#efPrice").val(f.price);
        $("#efCabin").val(f.cabin);
        new bootstrap.Modal(document.getElementById("editFlightModal")).show();
    };

    $("#saveEditFlightBtn").on("click", function () {
        const id = $("#efId").val();
        const f  = flights.find(x => x.id === id);
        if (!f) return;
        f.dep   = $("#efDep").val();
        f.arr   = $("#efArr").val();
        f.dur   = $("#efDur").val();
        f.stops = parseInt($("#efStops").val());
        f.seats = parseInt($("#efSeats").val());
        f.price = parseInt($("#efPrice").val());
        f.cabin = $("#efCabin").val();
        applyFilters();
        bootstrap.Modal.getInstance(document.getElementById("editFlightModal")).hide();
        showToast(`Flight ${id} updated.`, "success");
    });

    /* ── Delete flight ── */
    window.promptDeleteFlight = function (id) {
        flightToDelete = id;
        $("#deleteFlightId").text(id);
        new bootstrap.Modal(document.getElementById("deleteFlightModal")).show();
    };

    $("#confirmDeleteFlightBtn").on("click", function () {
        if (!flightToDelete) return;
        flights = flights.filter(f => f.id !== flightToDelete);
        applyFilters();
        bootstrap.Modal.getInstance(document.getElementById("deleteFlightModal")).hide();
        showToast(`Flight ${flightToDelete} deleted.`, "danger");
        flightToDelete = null;
    });

    /* ── Event listeners ── */
    $("#flightSearch").on("input", applyFilters);
    $("#flightAirlineFilter, #flightCabinFilter, #flightSort").on("change", applyFilters);
    $("#clearFlightFilters").on("click", function () {
        $("#flightSearch").val("");
        $("#flightAirlineFilter, #flightCabinFilter").val("");
        applyFilters();
        showToast("Filters cleared.", "info");
    });

    /* ── Init ── */
    populateModalDropdowns();
    applyFilters();

});
