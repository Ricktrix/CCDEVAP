/* =============================================
   Placeholder - Home Page
   js/index.js
   ============================================= */

$(document).ready(function () {

    /* ── Populate airport dropdowns ── */
    function populateAirports() {
        const opts = AIRPORTS.map(a =>
            `<option value="${a.code}">${a.code} – ${a.city}</option>`
        ).join("");
        $("#quickFrom").html(opts);
        $("#quickTo").html(opts);
        $("#quickFrom").val("MNL");
        $("#quickTo").val("CEB");
    }

    /* ── Set default departure date ── */
    function setDefaultDate() {
        const today = new Date().toISOString().split("T")[0];
        $("#quickDep").val(today);
    }

    /* ── Trip type toggle ── */
    $("#tripTypeGroup button").on("click", function () {
        $("#tripTypeGroup button").removeClass("active btn-primary").addClass("btn-outline-primary");
        $(this).removeClass("btn-outline-primary").addClass("active btn-primary");
        if ($(this).data("type") === "round-trip") {
            $("#quickRet").prop("disabled", false);
        } else {
            $("#quickRet").prop("disabled", true).val("");
        }
    });

    /* ── Quick search button ── */
    $("#quickSearchBtn").on("click", function () {
        const from = $("#quickFrom").val();
        const to   = $("#quickTo").val();
        if (!from || !to) {
            showToast("Please select origin and destination.", "warning");
            return;
        }
        if (from === to) {
            showToast("Origin and destination cannot be the same.", "warning");
            return;
        }
        showSpinner();
        setTimeout(() => {
            window.location.href = "search.html";
        }, 600);
    });

    /* ── Stats row ── */
    function renderStats() {
        const confirmed = RESERVATIONS.filter(r => r.status === "Confirmed").length;
        const stats = [
            { label: "Available Flights",  value: FLIGHTS.length,     color: "primary", icon: "bi-airplane"             },
            { label: "Active Bookings",    value: confirmed,           color: "success", icon: "bi-ticket-perforated"    },
            { label: "Destinations",       value: AIRPORTS.length,     color: "warning", icon: "bi-geo-alt-fill"         },
            { label: "Happy Passengers",   value: "125,000+",          color: "info",    icon: "bi-people-fill"          }
        ];

        const html = stats.map(s => `
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 p-3 text-center hover-card">
                    <div class="bg-${s.color} bg-opacity-10 rounded p-3 d-inline-block mb-2 mx-auto">
                        <i class="bi ${s.icon} fs-4 text-${s.color}"></i>
                    </div>
                    <h3 class="fw-bold text-${s.color} mb-0">${s.value}</h3>
                    <p class="text-muted small mb-0">${s.label}</p>
                </div>
            </div>`
        ).join("");

        $("#statsRow").html(html);
    }

    /* ── Promotions carousel ── */
    const PROMOS = [
        { label: "LIMITED TIME OFFER",    title: "Manila → Cebu",            desc: "Seats from <strong>₱1,199</strong> — Book before Aug 31", bg: "linear-gradient(135deg, #0d6efd, #6610f2)" },
        { label: "BUSINESS CLASS UPGRADE",title: "Fly Business at Economy+ Rates", desc: "Upgrade for just <strong>₱3,500 more</strong>",        bg: "linear-gradient(135deg, #198754, #20c997)" },
        { label: "ANNIVERSARY PROMO",     title: "20% Off All International",desc: "Use code <strong>SKYWAY20</strong> at checkout",         bg: "linear-gradient(135deg, #dc3545, #fd7e14)" }
    ];

    function renderCarousel() {
        const indicators = PROMOS.map((p, i) => `
            <button type="button" data-bs-target="#promoCarousel" data-bs-slide-to="${i}"
                    ${i === 0 ? 'class="active"' : ""}></button>`
        ).join("");

        const slides = PROMOS.map((p, i) => `
            <div class="carousel-item ${i === 0 ? "active" : ""}">
                <div style="background:${p.bg}; height:230px; display:flex; align-items:center; padding:2.5rem;">
                    <div class="text-white">
                        <p class="small text-warning fw-semibold mb-1">${p.label}</p>
                        <h3 class="fw-bold mb-2">${p.title}</h3>
                        <p class="mb-3">${p.desc}</p>
                        <a href="search.html" class="btn btn-light btn-sm fw-semibold"> Book Now </a>
                    </div>
                </div>
            </div>`
        ).join("");

        $("#carouselIndicators").html(indicators);
        $("#carouselInner").html(slides);
    }

    /* ── Popular destinations ── */
    const DOMESTIC_CITIES = ["Cebu", "Davao", "Iloilo", "Bacolod", "Palawan", "Bohol"];

    const DEST_DATA = [
        { city: "Cebu",         price: "₱1,850",  icon: "bi-water"              },
        { city: "Davao",        price: "₱2,450",  icon: "bi-tree-fill"          },
        { city: "Palawan",      price: "₱2,800",  icon: "bi-sun-fill"           },
        { city: "Singapore",    price: "₱5,400",  icon: "bi-buildings-fill"     },
        { city: "Tokyo",        price: "₱12,500", icon: "bi-snow"               },
        { city: "Bangkok",      price: "₱4,900",  icon: "bi-gem"                }
    ];

    function renderDestinations(filter) {
        const filtered = DEST_DATA.filter(d => {
            if (!filter) return true;
            const isDomestic = DOMESTIC_CITIES.includes(d.city);
            return filter === "domestic" ? isDomestic : !isDomestic;
        });

        if (!filtered.length) {
            $("#destinationsRow").html('<p class="text-muted"> No destinations found. </p>');
            return;
        }

        const colors = ["primary", "success", "warning", "info", "danger", "secondary"];
        const html = filtered.map((d, i) => `
            <div class="col-6 col-md-4 col-lg-2">
                <div class="card border-0 shadow-sm hover-card overflow-hidden"
                     onclick="window.location.href='search.html'" style="cursor:pointer;">
                    <div class="bg-${colors[i % colors.length]} bg-opacity-10 text-center py-4">
                        <i class="bi ${d.icon} fs-1 text-${colors[i % colors.length]}"></i>
                    </div>
                    <div class="card-body p-2 text-center">
                        <div class="fw-semibold small">${d.city}</div>
                        <div class="text-primary fw-bold small"> from ${d.price} </div>
                    </div>
                </div>
            </div>`
        ).join("");

        $("#destinationsRow").html(html);
    }

    /* ── Recently viewed flights ── */
    function renderRecentFlights() {
        const recent = FLIGHTS.slice(0, 3);
        const html = recent.map(f => {
            const airline = AIRLINES[f.airline];
            return `
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <div class="rounded p-2 fw-bold text-white"
                                     style="background:${airline.color}; min-width:42px; text-align:center;">
                                    ${airline.code}
                                </div>
                                <div>
                                    <div class="fw-semibold">${airline.name}</div>
                                    <div class="text-muted small">${f.id} · ${f.cabin}</div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-3 mb-2">
                                <div class="text-center">
                                    <div class="fw-bold fs-5">${f.dep}</div>
                                    <div class="text-muted small">${f.from}</div>
                                </div>
                                <div class="flex-grow-1 text-center">
                                    <div class="text-muted small">${f.dur}</div>
                                    <div class="route-line my-1">
                                        <hr><i class="bi bi-airplane-fill text-primary"></i><hr>
                                    </div>
                                    <div class="text-muted small">${f.stops === 0 ? "Direct" : f.stops + " stop"}</div>
                                </div>
                                <div class="text-center">
                                    <div class="fw-bold fs-5">${f.arr}</div>
                                    <div class="text-muted small">${f.to}</div>
                                </div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="fw-bold text-primary fs-5">${formatPrice(f.price)}</span>
                                <a href="booking.html" class="btn btn-sm btn-primary"> Book </a>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join("");

        $("#recentFlightsRow").html(html);
    }

    /* ── Destination filter ── */
    $("#destFilter").on("change", function () {
        renderDestinations($(this).val());
    });

    /* ── Newsletter ── */
    $("#newsletterBtn").on("click", function () {
        const email = $("#newsletterEmail").val().trim();
        if (!email || !email.includes("@")) {
            showToast("Please enter a valid email address.", "warning");
            return;
        }
        showToast("Subscribed! Check your inbox for deals.", "success");
        $("#newsletterEmail").val("");
    });

    /* ── Init ── */
    populateAirports();
    setDefaultDate();
    renderStats();
    renderCarousel();
    renderDestinations("");
    renderRecentFlights();

});
