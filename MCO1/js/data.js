/* =============================================
   Placeholder - Shared Dummy Data
   js/data.js
   ============================================= */

const AIRLINES = [
    { code: "SW", name: "SkyWay Air",    color: "#0d6efd" },
    { code: "PA", name: "Pacific Air",   color: "#198754" },
    { code: "SL", name: "SunLine",       color: "#ffc107" },
    { code: "CE", name: "Cebu Eagle",    color: "#dc3545" },
    { code: "AS", name: "AsiaStar",      color: "#6f42c1" }
];

const AIRPORTS = [
    { code: "MNL", city: "Manila",          name: "Ninoy Aquino Intl"      },
    { code: "CEB", city: "Cebu",            name: "Mactan-Cebu Intl"       },
    { code: "DVO", city: "Davao",           name: "Francisco Bangoy Intl"  },
    { code: "ILO", city: "Iloilo",          name: "Iloilo Intl"            },
    { code: "BCD", city: "Bacolod",         name: "Bacolod-Silay Intl"     },
    { code: "PPS", city: "Palawan",         name: "Puerto Princesa Intl"   },
    { code: "TAG", city: "Bohol",           name: "Tagbilaran Airport"     },
    { code: "SIN", city: "Singapore",       name: "Changi Intl"            },
    { code: "HKG", city: "Hong Kong",       name: "Hong Kong Intl"         },
    { code: "NRT", city: "Tokyo",           name: "Narita Intl"            },
    { code: "BKK", city: "Bangkok",         name: "Suvarnabhumi"           },
    { code: "KUL", city: "Kuala Lumpur",    name: "KLIA"                   }
];

const FLIGHTS = [
    { id: "SW101", airline: 0, from: "MNL", to: "CEB", dep: "06:00", arr: "07:10", dur: "1h 10m", stops: 0, price: 1850,  seats: 32, cabin: "Economy"         },
    { id: "PA202", airline: 1, from: "MNL", to: "CEB", dep: "09:30", arr: "10:45", dur: "1h 15m", stops: 0, price: 2100,  seats: 18, cabin: "Economy"         },
    { id: "SL303", airline: 2, from: "MNL", to: "DVO", dep: "07:00", arr: "08:40", dur: "1h 40m", stops: 0, price: 2450,  seats: 5,  cabin: "Economy"         },
    { id: "CE404", airline: 3, from: "MNL", to: "DVO", dep: "11:15", arr: "14:00", dur: "2h 45m", stops: 1, price: 1650,  seats: 44, cabin: "Economy"         },
    { id: "AS505", airline: 4, from: "MNL", to: "ILO", dep: "08:00", arr: "09:05", dur: "1h 05m", stops: 0, price: 1950,  seats: 22, cabin: "Economy"         },
    { id: "SW606", airline: 0, from: "CEB", to: "SIN", dep: "13:00", arr: "17:20", dur: "3h 20m", stops: 0, price: 7200,  seats: 14, cabin: "Business"        },
    { id: "PA707", airline: 1, from: "MNL", to: "SIN", dep: "22:00", arr: "01:30", dur: "3h 30m", stops: 0, price: 5400,  seats: 28, cabin: "Economy"         },
    { id: "SL808", airline: 2, from: "MNL", to: "HKG", dep: "10:00", arr: "13:45", dur: "2h 45m", stops: 0, price: 6800,  seats: 9,  cabin: "Economy"         },
    { id: "CE909", airline: 3, from: "MNL", to: "NRT", dep: "15:00", arr: "20:30", dur: "4h 30m", stops: 0, price: 12500, seats: 7,  cabin: "Economy"         },
    { id: "AS110", airline: 4, from: "MNL", to: "BKK", dep: "18:30", arr: "21:00", dur: "3h 30m", stops: 0, price: 4900,  seats: 19, cabin: "Premium Economy" }
];

const RESERVATIONS = [
    { ref: "SKY-001", name: "Juan dela Cruz",  route: "MNL → CEB", flightId: "SW101", seat: "12A", date: "2025-08-10", status: "Confirmed", price: 1850,  cabin: "Economy",         meal: "Standard"    },
    { ref: "SKY-002", name: "Maria Santos",    route: "MNL → DVO", flightId: "SL303", seat: "7C",  date: "2025-08-15", status: "Confirmed", price: 2450,  cabin: "Economy",         meal: "Vegetarian"  },
    { ref: "SKY-003", name: "Pedro Reyes",     route: "CEB → SIN", flightId: "SW606", seat: "3A",  date: "2025-08-20", status: "Pending",   price: 7200,  cabin: "Business",        meal: "Halal"       },
    { ref: "SKY-004", name: "Ana Gonzalez",    route: "MNL → SIN", flightId: "PA707", seat: "22B", date: "2025-09-01", status: "Confirmed", price: 5400,  cabin: "Economy",         meal: "Standard"    },
    { ref: "SKY-005", name: "Carlo Mercado",   route: "MNL → HKG", flightId: "SL808", seat: "15D", date: "2025-09-10", status: "Cancelled", price: 6800,  cabin: "Economy",         meal: "Vegan"       },
    { ref: "SKY-006", name: "Lea Bonifacio",   route: "MNL → ILO", flightId: "AS505", seat: "9F",  date: "2025-09-18", status: "Pending",   price: 1950,  cabin: "Economy",         meal: "Standard"    },
    { ref: "SKY-007", name: "Ryan Cruz",       route: "MNL → CEB", flightId: "PA202", seat: "4B",  date: "2025-09-25", status: "Confirmed", price: 2100,  cabin: "Economy",         meal: "Gluten-Free" },
    { ref: "SKY-008", name: "Sofia Lim",       route: "MNL → BKK", flightId: "AS110", seat: "6C",  date: "2025-10-05", status: "Confirmed", price: 4900,  cabin: "Premium Economy", meal: "Vegetarian"  },
    { ref: "SKY-009", name: "Miguel Torres",   route: "MNL → NRT", flightId: "CE909", seat: "18E", date: "2025-10-12", status: "Pending",   price: 12500, cabin: "Economy",         meal: "Standard"    },
    { ref: "SKY-010", name: "Grace Flores",    route: "MNL → DVO", flightId: "CE404", seat: "31A", date: "2025-10-20", status: "Confirmed", price: 1650,  cabin: "Economy",         meal: "Halal"       },
    { ref: "SKY-011", name: "John Park",       route: "MNL → CEB", flightId: "SW101", seat: "5F",  date: "2025-11-01", status: "Completed", price: 1850,  cabin: "Economy",         meal: "Standard"    },
    { ref: "SKY-012", name: "Emma Davis",      route: "CEB → SIN", flightId: "SW606", seat: "2C",  date: "2025-11-10", status: "Cancelled", price: 7200,  cabin: "Business",        meal: "Kosher"      }
];

const USERS = [
    { id: "USR001", name: "Juan dela Cruz",  email: "juan@email.com",   phone: "+63 912 345 6789", role: "Passenger", status: "Active",    bookings: 4, joined: "2024-01-15" },
    { id: "USR002", name: "Maria Santos",    email: "maria@email.com",  phone: "+63 917 234 5678", role: "Passenger", status: "Active",    bookings: 7, joined: "2024-02-20" },
    { id: "USR003", name: "Pedro Reyes",     email: "pedro@email.com",  phone: "+63 918 456 7890", role: "Admin",     status: "Active",    bookings: 1, joined: "2023-11-10" },
    { id: "USR004", name: "Ana Gonzalez",    email: "ana@email.com",    phone: "+63 919 567 8901", role: "Passenger", status: "Active",    bookings: 3, joined: "2024-03-05" },
    { id: "USR005", name: "Carlo Mercado",   email: "carlo@email.com",  phone: "+63 920 678 9012", role: "Passenger", status: "Suspended", bookings: 2, joined: "2024-04-12" },
    { id: "USR006", name: "Lea Bonifacio",   email: "lea@email.com",    phone: "+63 921 789 0123", role: "Passenger", status: "Active",    bookings: 5, joined: "2024-05-08" },
    { id: "USR007", name: "Ryan Cruz",       email: "ryan@email.com",   phone: "+63 922 890 1234", role: "Passenger", status: "Inactive",  bookings: 0, joined: "2024-06-01" },
    { id: "USR008", name: "Sofia Lim",       email: "sofia@email.com",  phone: "+63 923 901 2345", role: "Admin",     status: "Active",    bookings: 0, joined: "2023-09-18" },
    { id: "USR009", name: "Miguel Torres",   email: "miguel@email.com", phone: "+63 924 012 3456", role: "Passenger", status: "Active",    bookings: 6, joined: "2024-07-22" },
    { id: "USR010", name: "Grace Flores",    email: "grace@email.com",  phone: "+63 925 123 4567", role: "Passenger", status: "Active",    bookings: 2, joined: "2024-08-14" }
];

/* ── Helpers ── */
function formatPrice(n) {
    return "₱" + n.toLocaleString();
}

function showToast(message, type = "success") {
    const icons = {
        success: "check-circle-fill",
        danger:  "x-circle-fill",
        warning: "exclamation-triangle-fill",
        info:    "info-circle-fill"
    };
    const id  = "toast-" + Date.now();
    const html = `
        <div id="${id}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-${icons[type] || "info-circle-fill"} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                        onclick="document.getElementById('${id}').remove()"></button>
            </div>
        </div>`;
    $("#toastContainer").append(html);
    setTimeout(() => { $("#" + id).remove(); }, 3500);
}

function showSpinner() {
    $("#loadingSpinner").show();
}

function hideSpinner() {
    $("#loadingSpinner").hide();
}

function getStatusBadge(status) {
    const map = {
        Confirmed: "success",
        Pending:   "warning",
        Cancelled: "danger",
        Completed: "info",
        Active:    "success",
        Suspended: "danger",
        Inactive:  "secondary"
    };
    return `<span class="badge bg-${map[status] || "secondary"}">${status}</span>`;
}
