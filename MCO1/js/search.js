/* =============================================
   Placeholder Airlines - Search Flights Page
   js/search.js
   ============================================= */

$(document).ready(function () {

    let compareList = [];

    
    function populateAirports() {
        const opts = AIRPORTS.map(a =>
            `<option value="${a.code}">${a.code} – ${a.city}</option>`
        ).join("");
        $("#searchFrom").html(opts).val("MNL");
        $("#searchTo").html(opts).val("CEB");
    }

    function populateAirlineFilter() {
        const airlineHtml = AIRLINES.map((a, i) => `
            <div class="form-check">
                <input class="form-check-input airline-filter" type="checkbox"
                       value="${i}" id="af${i}" checked>
                <label class="form-check-label small d-flex align-items-center gap-2" for="af${i}">
                    <span style="width:12px;height:12px;border-radius:3px;background:${a.color};display:inline-block;"></span>
                    ${a.name}
                </label>
            </div>`
        ).join("");
        $("#airlineFilters").html(airlineHtml);

        const airlineOpts = AIRLINES.map(a =>
            `<option value="${a.name}">${a.name}</option>`
        ).join("");
        $("#prefAirline").append(airlineOpts);
    }

    function setDefaultDate() {
        const today = new Date().toISOString().split("T")[0];
        $("#searchDep").val(today);
    }


    function showSkeleton() {
        const skels = Array.from({ length: 3 }, () => `
            <div class="card mb-3 shadow-sm border-0">
                <div class="card-body">
                    <div class="skeleton mb-2" style="height:20px;width:40%;"></div>
                    <div class="skeleton mb-2" style="height:16px;width:65%;"></div>
                    <div class="skeleton" style="height:16px;width:50%;"></div>
                </div>
            </div>`
        ).join("");
        $("#skeletonLoader").html(skels);
        $("#flightResultsList").empty();
    }

    function hideSkeleton() {
        $("#skeletonLoader").empty();
    }


    function renderFlightCard(f) {
        const airline    = AIRLINES[f.airline];
        const seatsClass = f.seats <= 5 ? "text-danger" : f.seats <= 15 ? "text-warning" : "text-success";
        const stopBadge  = f.stops === 0
            ? `<span class="badge bg-success-subtle text-success border border-success-subtle"> Direct </span>`
            : `<span class="badge bg-warning-subtle text-warning border border-warning-subtle"> ${f.stops} stop </span>`;
        const inCompare  = compareList.includes(f.id);

        return `
            <div class="card shadow-sm border-0 mb-3 fade-in-up" id="fc-${f.id}">
                <div class="card-body">
                    <div class="row align-items-center g-3">
                        <div class="col-auto">
                            <div class="rounded p-2 fw-bold text-white text-center"
                                 style="background:${airline.color}; min-width:52px;">
                                ${airline.code}
                            </div>
                            <div class="text-muted text-center mt-1" style="font-size:0.65rem;">
                                ${airline.name}
                            </div>
                        </div>
                        <div class="col">
                            <div class="d-flex align-items-center gap-3">
                                <div class="text-center">
                                    <div class="fw-bold fs-5">${f.dep}</div>
                                    <div class="fw-semibold small">${f.from}</div>
                                </div>
                                <div class="flex-grow-1 text-center">
                                    <div class="text-muted small">${f.dur}</div>
                                    <div class="route-line my-1">
                                        <hr style="border-style:dashed;">
                                        <i class="bi bi-airplane-fill text-primary small"></i>
                                        <hr style="border-style:dashed;">
                                    </div>
                                    ${stopBadge}
                                </div>
                                <div class="text-center">
                                    <div class="fw-bold fs-5">${f.arr}</div>
                                    <div class="fw-semibold small">${f.to}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-auto text-end">
                            <div class="fw-bold fs-5 text-primary mb-1">${formatPrice(f.price)}</div>
                            <div class="small ${seatsClass} mb-2">
                                <i class="bi bi-person-fill me-1"></i>${f.seats} seats left
                            </div>
                            <a href="booking.html" class="btn btn-primary btn-sm d-block mb-1 book-btn" data-id="${f.id}"> Book Now </a>
                            <button class="btn btn-outline-secondary btn-sm d-block w-100"
                                    onclick="openFlightDetail('${f.id}')"> Details </button>
                        </div>
                    </div>
                    <div class="border-top mt-2 pt-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="d-flex gap-3 small text-muted">
                            <span><i class="bi bi-ticket-perforated me-1"></i>${f.id}</span>
                            <span><i class="bi bi-briefcase me-1"></i>${f.cabin}</span>
                            <span><i class="bi bi-clock me-1"></i>${f.dur}</span>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary compare-btn ${inCompare ? "active" : ""}"
                                data-id="${f.id}" onclick="toggleCompare('${f.id}', this)">
                            <i class="bi bi-arrow-left-right me-1"></i>${inCompare ? "Remove" : "Compare"}
                        </button>
                    </div>
                </div>
            </div>`;
    }

   
    function applyFilters() {
        const maxPrice      = parseInt($("#filterPriceRange").val());
        const checkedAirlines = $(".airline-filter:checked").map(function () { return +$(this).val(); }).get();
        const checkedStops  = $(".stop-filter:checked").map(function () { return +$(this).val(); }).get();
        const activeTimes   = $(".time-btn.active").map(function () {
            return { from: +$(this).data("from"), to: +$(this).data("to") };
        }).get();
        const sortVal       = $("#sortSelect").val();

        let results = FLIGHTS.filter(f => {
            if (!checkedAirlines.includes(f.airline)) return false;
            if (!checkedStops.includes(Math.min(f.stops, 1))) return false;
            if (f.price > maxPrice) return false;
            const hour = parseInt(f.dep.split(":")[0]);
            return activeTimes.some(t => hour >= t.from && hour < t.to);
        }).sort((a, b) => {
            if (sortVal === "price-asc")  return a.price - b.price;
            if (sortVal === "price-desc") return b.price - a.price;
            if (sortVal === "dep-asc")    return a.dep.localeCompare(b.dep);
            if (sortVal === "dep-desc")   return b.dep.localeCompare(a.dep);
            if (sortVal === "dur-asc")    return a.dur.localeCompare(b.dur);
            return 0;
        });

        if (!results.length) {
            $("#flightResultsList").empty();
            $("#noResultsMsg").removeClass("d-none");
            $("#resultCount").text("0 flights");
        } else {
            $("#noResultsMsg").addClass("d-none");
            $("#resultCount").text(results.length + " flight" + (results.length > 1 ? "s" : ""));
            $("#flightResultsList").html(results.map(f => renderFlightCard(f)).join(""));
        }
    }

    
    window.openFlightDetail = function (id) {
        const f  = FLIGHTS.find(x => x.id === id);
        const a  = AIRLINES[f.airline];
        const from = AIRPORTS.find(x => x.code === f.from);
        const to   = AIRPORTS.find(x => x.code === f.to);

       
        $("#flightDetailModal .modal-footer a").attr("data-id", f.id).addClass("book-btn");

        $("#flightDetailBody").html(`
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card border-0 bg-light p-3 rounded-3 h-100">
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="rounded p-2 fw-bold text-white"
                                 style="background:${a.color}; min-width:52px; text-align:center;">
                                ${a.code}
                            </div>
                            <div>
                                <div class="fw-bold fs-5">${a.name}</div>
                                <div class="text-muted small"> Flight ${f.id} </div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <div class="fw-bold fs-4">${f.dep}</div>
                                <div class="fw-semibold">${f.from}</div>
                                <div class="text-muted small">${from ? from.name : ""}</div>
                            </div>
                            <div class="text-center">
                                <i class="bi bi-airplane-fill text-primary fs-4"></i>
                                <div class="small text-muted">${f.dur}</div>
                            </div>
                            <div class="text-end">
                                <div class="fw-bold fs-4">${f.arr}</div>
                                <div class="fw-semibold">${f.to}</div>
                                <div class="text-muted small">${to ? to.name : ""}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <table class="table table-sm">
                        <tr><td class="text-muted small"> Stops </td>
                            <td class="fw-semibold">${f.stops === 0 ? "Direct (Non-stop)" : f.stops + " stop(s)"}</td></tr>
                        <tr><td class="text-muted small"> Cabin Class </td>
                            <td class="fw-semibold">${f.cabin}</td></tr>
                        <tr><td class="text-muted small"> Available Seats </td>
                            <td class="fw-semibold">${f.seats} seats</td></tr>
                        <tr><td class="text-muted small"> Checked Baggage </td>
                            <td class="fw-semibold"> 20kg included </td></tr>
                        <tr><td class="text-muted small"> Meal </td>
                            <td class="fw-semibold"> Standard included </td></tr>
                        <tr><td class="text-muted small fw-bold"> Price </td>
                            <td class="fw-bold fs-5 text-primary">${formatPrice(f.price)}</td></tr>
                    </table>
                    <div class="alert alert-info small mb-0">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        Free cancellation up to 24 hours before departure.
                    </div>
                </div>
            </div>`
        );
        new bootstrap.Modal(document.getElementById("flightDetailModal")).show();
    };

    
    window.toggleCompare = function (id, btn) {
        if (compareList.includes(id)) {
            compareList = compareList.filter(x => x !== id);
            $(btn).removeClass("active").html('<i class="bi bi-arrow-left-right me-1"></i>Compare');
            showToast("Removed from comparison.", "info");
        } else {
            if (compareList.length >= 3) {
                showToast("You can compare up to 3 flights.", "warning");
                return;
            }
            compareList.push(id);
            $(btn).addClass("active").html('<i class="bi bi-check-lg me-1"></i>Remove');
            showToast("Added to comparison.", "success");
        }
        updateCompareBar();
    };

    function updateCompareBar() {
        if (compareList.length >= 2) {
            if (!$("#compareBar").length) {
                $("body").append(`
                    <div id="compareBar" class="position-fixed bottom-0 start-0 end-0 bg-primary text-white
                                                py-2 px-4 d-flex justify-content-between align-items-center shadow-lg"
                         style="z-index:1050;">
                        <span>
                            <i class="bi bi-arrow-left-right me-2"></i>
                            <strong id="compareCount">0</strong> flights selected
                        </span>
                        <div class="d-flex gap-2">
                            <button class="btn btn-light btn-sm fw-semibold"
                                    onclick="openCompareModal()"> Compare Now </button>
                            <button class="btn btn-outline-light btn-sm"
                                    onclick="clearCompare()"> Clear </button>
                        </div>
                    </div>`
                );
            }
            $("#compareCount").text(compareList.length);
        } else {
            $("#compareBar").remove();
        }
    }

    window.openCompareModal = function () {
        const flights = compareList.map(id => FLIGHTS.find(f => f.id === id));
        const rows = [
            ["Airline",      f => AIRLINES[f.airline].name],
            ["Flight No.",   f => f.id],
            ["Departure",    f => f.dep],
            ["Arrival",      f => f.arr],
            ["Duration",     f => f.dur],
            ["Stops",        f => f.stops === 0 ? "✅ Direct" : `${f.stops} stop(s)`],
            ["Cabin",        f => f.cabin],
            ["Seats Left",   f => f.seats],
            ["Price",        f => `<strong class="text-primary">${formatPrice(f.price)}</strong>`]
        ];
        const html = `
            <div class="table-responsive">
                <table class="table table-bordered align-middle text-center">
                    <thead class="table-primary">
                        <tr>
                            <th class="text-start"> Feature </th>
                            ${flights.map(f => `<th>${AIRLINES[f.airline].code}<br><small>${f.from}→${f.to}</small></th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(([label, fn]) => `
                            <tr>
                                <td class="text-start fw-semibold small text-muted">${label}</td>
                                ${flights.map(f => `<td>${fn(f)}</td>`).join("")}
                            </tr>`
                        ).join("")}
                        <tr>
                            <td></td>
                            ${flights.map(f => `<td><a href="booking.html" class="btn btn-primary btn-sm book-btn" data-id="${f.id}"> Book </a></td>`).join("")}
                        </tr>
                    </tbody>
                </table>
            </div>`;
        $("#compareModalBody").html(html);
        new bootstrap.Modal(document.getElementById("compareModal")).show();
    };

    window.openCompareModal = function () {
        const flights = compareList.map(id => FLIGHTS.find(f => f.id === id));
        const rows = [
            ["Airline",      f => AIRLINES[f.airline].name],
            ["Flight No.",   f => f.id],
            ["Departure",    f => f.dep],
            ["Arrival",      f => f.arr],
            ["Duration",     f => f.dur],
            ["Stops",        f => f.stops === 0 ? "✅ Direct" : `${f.stops} stop(s)`],
            ["Cabin",        f => f.cabin],
            ["Seats Left",   f => f.seats],
            ["Price",        f => `<strong class="text-primary">${formatPrice(f.price)}</strong>`]
        ];
        const html = `
            <div class="table-responsive">
                <table class="table table-bordered align-middle text-center">
                    <thead class="table-primary">
                        <tr>
                            <th class="text-start"> Feature </th>
                            ${flights.map(f => `<th>${AIRLINES[f.airline].code}<br><small>${f.from}→${f.to}</small></th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(([label, fn]) => `
                            <tr>
                                <td class="text-start fw-semibold small text-muted">${label}</td>
                                ${flights.map(f => `<td>${fn(f)}</td>`).join("")}
                            </tr>`
                        ).join("")}
                        <tr>
                            <td></td>
                            ${flights.map(f => `<td><a href="booking.html" class="btn btn-primary btn-sm book-btn" data-id="${f.id}"> Book </a></td>`).join("")}
                        </tr>
                    </tbody>
                </table>
            </div>`;
        $("#compareModalBody").html(html);
        new bootstrap.Modal(document.getElementById("compareModal")).show();
    };

    window.clearCompare = function () {
        compareList = [];
        $(".compare-btn").removeClass("active").html('<i class="bi bi-arrow-left-right me-1"></i>Compare');
        $("#compareBar").remove();
    };

  
    $("#tripTypeGroup button").on("click", function () {
        $("#tripTypeGroup button").removeClass("active btn-primary").addClass("btn-outline-primary");
        $(this).removeClass("btn-outline-primary").addClass("active btn-primary");
        $("#searchRet").prop("disabled", $(this).data("type") !== "round-trip");
    });


    $("#swapBtn").on("click", function () {
        const fromVal = $("#searchFrom").val();
        const toVal   = $("#searchTo").val();
        $("#searchFrom").val(toVal);
        $("#searchTo").val(fromVal);
        showToast("Airports swapped.", "info");
    });

   
    $("#searchBtn").on("click", function () {
        const from = $("#searchFrom").val();
        const to   = $("#searchTo").val();
        if (!from || !to) { showToast("Please select airports.", "warning"); return; }
        if (from === to)  { showToast("Origin and destination cannot be the same.", "warning"); return; }
        showSkeleton();
        showToast("Searching flights…", "info");
        setTimeout(() => { hideSkeleton(); applyFilters(); }, 1000);
    });

 
    $("#filterPriceRange").on("input", function () {
        $("#filterPriceVal").text("₱" + Number(this.value).toLocaleString());
        applyFilters();
    });

    $("#advPriceRange").on("input", function () {
        $("#priceRangeVal").text("₱" + Number(this.value).toLocaleString());
    });

    $(document).on("change", ".airline-filter, .stop-filter", applyFilters);
    $("#sortSelect").on("change", applyFilters);

    $(".time-btn").on("click", function () {
        $(this).toggleClass("active btn-outline-secondary btn-secondary");
        applyFilters();
    });

    $("#clearFiltersBtn, #resetFiltersBtn").on("click", function () {
        $(".airline-filter, .stop-filter").prop("checked", true);
        $("#filterPriceRange").val(20000);
        $("#filterPriceVal").text("₱20,000");
        $(".time-btn").addClass("active");
        applyFilters();
        showToast("Filters cleared.", "info");
    });

    
    $(document).on("click", ".book-btn", function (e) {
        e.preventDefault();
        const flightId = $(this).attr("data-id");
        if (flightId) {
            localStorage.setItem("selectedFlightId", flightId);
        }
        window.location.href = "booking.html";
    });

    
    populateAirports();
    populateAirlineFilter();
    setDefaultDate();
    showSkeleton();
    setTimeout(() => { hideSkeleton(); applyFilters(); }, 900);

});