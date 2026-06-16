/* =============================================
   Placehodler - Admin Dashboard Page
   js/admin-dashboard.js
   ============================================= */

$(document).ready(function () {

    /* ── Live clock ── */
    function updateClock() {
        $("#adminClock").text(new Date().toLocaleTimeString());
    }
    updateClock();
    setInterval(updateClock, 1000);

    /* ── KPI stats ── */
    function renderKPI() {
        const confirmed  = RESERVATIONS.filter(r => r.status === "Confirmed").length;
        const revenue    = RESERVATIONS.filter(r => r.status === "Confirmed")
                                       .reduce((s, r) => s + r.price, 0);
        const pending    = RESERVATIONS.filter(r => r.status === "Pending").length;

        const kpis = [
            { label: "Total Flights",   value: FLIGHTS.length,       color: "primary", icon: "bi-airplane-fill",         change: "+2 this week"  },
            { label: "Total Users",     value: USERS.length,         color: "success", icon: "bi-people-fill",            change: "+3 this month" },
            { label: "Total Bookings",  value: RESERVATIONS.length,  color: "info",    icon: "bi-ticket-perforated-fill", change: "+5 today"      },
            { label: "Revenue",         value: formatPrice(revenue),  color: "warning", icon: "bi-cash-stack",             change: "Confirmed only" }
        ];

        const html = kpis.map(k => `
            <div class="col-6 col-md-3">
                <div class="card shadow-sm border-0 p-3 hover-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="text-muted small mb-1">${k.label}</div>
                            <div class="fw-bold fs-4 text-${k.color}">${k.value}</div>
                            <div class="text-muted" style="font-size:0.75rem;">${k.change}</div>
                        </div>
                        <div class="bg-${k.color} bg-opacity-10 rounded p-2">
                            <i class="bi ${k.icon} fs-5 text-${k.color}"></i>
                        </div>
                    </div>
                </div>
            </div>`
        ).join("");

        $("#kpiRow").html(html);
    }

    /* ── Monthly bookings chart ── */
    function renderBookingsChart() {
        const months   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const bookings = [14, 22, 18, 30, 25, 38, 42, 35, 28, 20, 32, 45];
        const revenue  = [42000, 68000, 55000, 92000, 78000, 115000, 128000, 105000, 86000, 62000, 95000, 138000];

        const ctx = document.getElementById("bookingsChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: months,
                datasets: [
                    {
                        label: "Bookings",
                        data: bookings,
                        backgroundColor: "rgba(13, 110, 253, 0.7)",
                        borderRadius: 4,
                        yAxisID: "y"
                    },
                    {
                        label: "Revenue (₱)",
                        data: revenue,
                        type: "line",
                        borderColor: "#198754",
                        backgroundColor: "rgba(25, 135, 84, 0.1)",
                        tension: 0.4,
                        fill: true,
                        yAxisID: "y1"
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: "index", intersect: false },
                scales: {
                    y:  { beginAtZero: true, title: { display: true, text: "Bookings" } },
                    y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false },
                          title: { display: true, text: "Revenue (₱)" } }
                },
                plugins: { legend: { position: "top" } }
            }
        });
    }

    /* ── Status doughnut chart ── */
    function renderStatusChart() {
        const confirmed  = RESERVATIONS.filter(r => r.status === "Confirmed").length;
        const pending    = RESERVATIONS.filter(r => r.status === "Pending").length;
        const cancelled  = RESERVATIONS.filter(r => r.status === "Cancelled").length;
        const completed  = RESERVATIONS.filter(r => r.status === "Completed").length;

        const ctx = document.getElementById("statusChart").getContext("2d");
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Confirmed", "Pending", "Cancelled", "Completed"],
                datasets: [{
                    data: [confirmed, pending, cancelled, completed],
                    backgroundColor: ["#198754", "#ffc107", "#dc3545", "#0dcaf0"],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                },
                cutout: "65%"
            }
        });
    }

    /* ── Top routes table ── */
    function renderTopRoutes() {
        const routeCounts = {};
        RESERVATIONS.forEach(r => {
            routeCounts[r.route] = (routeCounts[r.route] || 0) + 1;
        });

        const sorted = Object.entries(routeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const rows = sorted.map(([route, count], i) => `
            <tr>
                <td class="small fw-semibold ps-3">${i + 1}. ${route}</td>
                <td class="small">${count} bookings</td>
                <td>
                    <div class="progress" style="height:6px;">
                        <div class="progress-bar bg-primary" style="width:${(count / sorted[0][1]) * 100}%"></div>
                    </div>
                </td>
            </tr>`
        ).join("");

        $("#topRoutesTable").html(`
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3"> Route </th>
                            <th> Volume </th>
                            <th style="width:120px;"> </th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`
        );
    }

    /* ── Recent bookings table ── */
    function renderRecentBookings() {
        const recent = [...RESERVATIONS]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 6);

        const rows = recent.map(r => `
            <tr>
                <td class="small fw-semibold ps-3">${r.ref}</td>
                <td class="small">${r.name}</td>
                <td class="small text-muted">${r.route}</td>
                <td>${getStatusBadge(r.status)}</td>
            </tr>`
        ).join("");

        $("#recentBookingsTable").html(`
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th class="ps-3"> Ref </th>
                            <th> Passenger </th>
                            <th> Route </th>
                            <th> Status </th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`
        );
    }

    /* ── Init ── */
    renderKPI();
    renderBookingsChart();
    renderStatusChart();
    renderTopRoutes();
    renderRecentBookings();

});
