/* =============================================
   Placeholder - Profile Page
   js/profile.js
   ============================================= */

$(document).ready(function () {

    /* ── State ── */
    let savedPassengers = [
        { id: 1, name: "Mother",  relation: "Mother",  passport: "P9876543B", nationality: "Filipino" },
        { id: 2, name: "Child", relation: "Child",   passport: "P5432167C", nationality: "Filipino" }
    ];

    let personalData = {
        firstName:  "Name",
        lastName:   "Last Name",
        email:      "example@email.com",
        phone:      "+63 999 999 9999",
        dob:        "1990-05-15",
        gender:     "Male",
        nationality:"Filipino",
        passport:   "P1234567A",
        address:    "123 Rizal St., Malate, Manila"
    };

    let notifications = {
        emailBooking:    true,
        emailPromos:     true,
        smsUpdates:      false,
        flightReminders: true,
        priceAlerts:     false,
        newsletter:      true
    };

    /* ── Tab switching ── */
    $("#profileTabsList a").on("click", function (e) {
        e.preventDefault();
        const tab = $(this).data("tab");

        $("#profileTabsList a").removeClass("active");
        $(this).addClass("active");

        $(".profile-tab-panel").addClass("d-none");
        $("#tab-" + tab).removeClass("d-none");
    });

    /* ── Avatar upload ── */
    $("#avatarUpload").on("click", function () {
        $("#avatarInput").trigger("click");
    });

    $("#avatarInput").on("change", function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            $("#avatarUpload").html(`<img src="${e.target.result}" alt="Avatar"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`);
        };
        reader.readAsDataURL(file);
        showToast("Profile photo updated.", "success");
    });

    /* ── Personal Info ── */
    function renderPersonalFields(editable = false) {
        const fields = [
            { label: "First Name",   key: "firstName",   type: "text",   col: 6  },
            { label: "Last Name",    key: "lastName",    type: "text",   col: 6  },
            { label: "Email",        key: "email",       type: "email",  col: 6  },
            { label: "Phone",        key: "phone",       type: "tel",    col: 6  },
            { label: "Date of Birth",key: "dob",         type: "date",   col: 6  },
            { label: "Gender",       key: "gender",      type: "select", col: 6, options: ["Male","Female","Prefer not to say"] },
            { label: "Nationality",  key: "nationality", type: "select", col: 6, options: ["Filipino","American","Japanese","Other"] },
            { label: "Passport No.", key: "passport",    type: "text",   col: 6  },
            { label: "Address",      key: "address",     type: "text",   col: 12 }
        ];

        const html = fields.map(f => {
            let input;
            if (!editable) {
                input = `<div class="form-control bg-light">${personalData[f.key]}</div>`;
            } else if (f.type === "select") {
                const opts = f.options.map(o =>
                    `<option ${o === personalData[f.key] ? "selected" : ""}>${o}</option>`
                ).join("");
                input = `<select class="form-select personal-field" data-key="${f.key}">${opts}</select>`;
            } else {
                input = `<input type="${f.type}" class="form-control personal-field"
                          data-key="${f.key}" value="${personalData[f.key]}">`;
            }
            return `
                <div class="col-md-${f.col}">
                    <label class="form-label fw-semibold small">${f.label}</label>
                    ${input}
                </div>`;
        }).join("");

        $("#personalFields").html(html);
    }

    $("#editPersonalBtn").on("click", function () {
        renderPersonalFields(true);
        $("#personalActions").removeClass("d-none");
        $(this).addClass("d-none");
    });

    $("#savePersonalBtn").on("click", function () {
        $(".personal-field").each(function () {
            personalData[$(this).data("key")] = $(this).val();
        });
        renderPersonalFields(false);
        $("#personalActions").addClass("d-none");
        $("#editPersonalBtn").removeClass("d-none");
        showToast("Personal information saved.", "success");
    });

    $("#cancelPersonalBtn").on("click", function () {
        renderPersonalFields(false);
        $("#personalActions").addClass("d-none");
        $("#editPersonalBtn").removeClass("d-none");
    });

    /* ── Saved Passengers ── */
    function renderSavedPassengers() {
        if (!savedPassengers.length) {
            $("#savedPassengersList").html(`
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-people fs-1 d-block mb-2"></i>
                    No saved passengers yet.
                </div>`
            );
            return;
        }

        const html = savedPassengers.map(p => `
            <div class="card border mb-3" id="pax-${p.id}">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div class="d-flex align-items-center gap-3">
                            <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center
                                        justify-content-center text-primary fw-bold"
                                 style="width:42px;height:42px;">
                                ${p.name.charAt(0)}
                            </div>
                            <div>
                                <div class="fw-semibold">${p.name}</div>
                                <div class="text-muted small">${p.relation} · ${p.nationality}</div>
                                <div class="text-muted" style="font-size:0.75rem;">Passport: ${p.passport}</div>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-danger"
                                    onclick="removePassenger(${p.id})">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`
        ).join("");

        $("#savedPassengersList").html(html);
    }

    window.removePassenger = function (id) {
        savedPassengers = savedPassengers.filter(p => p.id !== id);
        renderSavedPassengers();
        showToast("Passenger removed.", "info");
    };

    $("#addPassengerBtn").on("click", function () {
        new bootstrap.Modal(document.getElementById("addPassengerModal")).show();
    });

    $("#savePassengerBtn").on("click", function () {
        const name = $("#apName").val().trim();
        if (!name) { showToast("Passenger name is required.", "warning"); return; }

        savedPassengers.push({
            id:          Date.now(),
            name:        name,
            relation:    $("#apRelation").val(),
            passport:    $("#apPassport").val() || "N/A",
            nationality: $("#apNationality").val()
        });

        renderSavedPassengers();
        bootstrap.Modal.getInstance(document.getElementById("addPassengerModal")).hide();
        $("#apName, #apPassport").val("");
        showToast("Passenger saved.", "success");
    });

    /* ── Payment Methods ── */
    function renderPaymentMethods() {
        const cards = [
            { type: "Visa",       last4: "4242", expiry: "08/27", icon: "bi-credit-card-2-front-fill", color: "primary"  },
            { type: "Mastercard", last4: "5353", expiry: "12/26", icon: "bi-credit-card-fill",         color: "warning"  }
        ];

        const html = cards.map(c => `
            <div class="card border mb-3">
                <div class="card-body py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi ${c.icon} fs-3 text-${c.color}"></i>
                        <div>
                            <div class="fw-semibold">${c.type} ending in ${c.last4}</div>
                            <div class="text-muted small"> Expires ${c.expiry} </div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash-fill me-1"></i> Remove
                    </button>
                </div>
            </div>`
        ).join("");

        const addHtml = `
            <div class="border border-dashed rounded p-4 text-center text-muted mt-2"
                 style="cursor:pointer; border-style:dashed !important;"
                 id="addCardBtn">
                <i class="bi bi-plus-circle fs-4 d-block mb-1"></i>
                Add New Card
            </div>`;

        $("#paymentMethodsList").html(html + addHtml);

        $("#addCardBtn").on("click", function () {
            showToast("Card management coming soon.", "info");
        });
    }

    /* ── Notifications ── */
    function renderNotifications() {
        const items = [
            { key: "emailBooking",    label: "Booking Confirmations",  desc: "Receive email confirmations for all bookings"     },
            { key: "emailPromos",     label: "Promotional Emails",     desc: "Get notified about deals and special offers"       },
            { key: "smsUpdates",      label: "SMS Flight Updates",     desc: "Text messages for gate changes and delays"         },
            { key: "flightReminders", label: "Flight Reminders",       desc: "Reminders 24 hours before departure"               },
            { key: "priceAlerts",     label: "Price Alerts",           desc: "Alert when prices drop on saved routes"            },
            { key: "newsletter",      label: "Monthly Newsletter",     desc: "Monthly travel inspiration and tips"               }
        ];

        const html = items.map(item => `
            <div class="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                <div>
                    <div class="fw-semibold small">${item.label}</div>
                    <div class="text-muted" style="font-size:0.8rem;">${item.desc}</div>
                </div>
                <div class="form-check form-switch ms-3 mb-0">
                    <input class="form-check-input notif-toggle" type="checkbox"
                           data-key="${item.key}" ${notifications[item.key] ? "checked" : ""}>
                </div>
            </div>`
        ).join("");

        $("#notificationPrefs").html(html + `
            <button class="btn btn-primary mt-2" id="saveNotifsBtn">
                <i class="bi bi-save me-1"></i> Save Preferences
            </button>`
        );

        $(document).on("change", ".notif-toggle", function () {
            notifications[$(this).data("key")] = this.checked;
        });

        $(document).on("click", "#saveNotifsBtn", function () {
            showToast("Notification preferences saved.", "success");
        });
    }

    /* ── Travel History ── */
    function renderTravelHistory() {
        const completed = RESERVATIONS.filter(r => r.status === "Confirmed" || r.status === "Completed");
        if (!completed.length) {
            $("#travelHistoryTable").html('<p class="text-muted p-4"> No travel history yet. </p>');
            return;
        }
        const rows = completed.map(r => `
            <tr>
                <td class="small fw-semibold">${r.ref}</td>
                <td class="small">${r.route}</td>
                <td class="small">${r.date}</td>
                <td class="small">${r.cabin}</td>
                <td class="small fw-bold text-primary">${formatPrice(r.price)}</td>
                <td>${getStatusBadge(r.status)}</td>
            </tr>`
        ).join("");

        $("#travelHistoryTable").html(`
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                        <tr>
                            <th> Ref </th><th> Route </th><th> Date </th>
                            <th> Cabin </th><th> Price </th><th> Status </th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`
        );
    }

    /* ── Security ── */
    function renderSecurity() {
        $("#securityPanel").html(`
            <h6 class="fw-semibold mb-3"> Change Password </h6>
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <label class="form-label fw-semibold small"> Current Password </label>
                    <input type="password" class="form-control" id="currPw" placeholder="Enter current password">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-semibold small"> New Password </label>
                    <input type="password" class="form-control" id="newPw" placeholder="Min. 8 characters">
                </div>
                <div class="col-md-6">
                    <label class="form-label fw-semibold small"> Confirm New Password </label>
                    <input type="password" class="form-control" id="confirmPw" placeholder="Repeat new password">
                </div>
            </div>
            <button class="btn btn-primary mb-4" id="changePwBtn">
                <i class="bi bi-shield-lock me-1"></i> Update Password
            </button>

            <hr>

            <h6 class="fw-semibold mb-3 mt-3"> Two-Factor Authentication </h6>
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-semibold small"> Authenticator App </div>
                    <div class="text-muted" style="font-size:0.8rem;">
                        Use an authenticator app for stronger security
                    </div>
                </div>
                <div class="form-check form-switch mb-0">
                    <input class="form-check-input" type="checkbox" id="twoFactorToggle">
                </div>
            </div>

            <hr>

            <h6 class="fw-semibold mb-3 mt-3 text-danger"> Danger Zone </h6>
            <button class="btn btn-outline-danger btn-sm" onclick="showToast('Account deletion requires email confirmation.','warning')">
                <i class="bi bi-trash me-1"></i> Delete Account
            </button>`
        );

        $("#changePwBtn").on("click", function () {
            const curr = $("#currPw").val();
            const nw   = $("#newPw").val();
            const conf = $("#confirmPw").val();
            if (!curr || !nw || !conf) { showToast("All password fields are required.", "warning"); return; }
            if (nw.length < 8)         { showToast("New password must be at least 8 characters.", "warning"); return; }
            if (nw !== conf)            { showToast("New passwords do not match.", "warning"); return; }
            showToast("Password updated successfully.", "success");
            $("#currPw, #newPw, #confirmPw").val("");
        });

        $("#twoFactorToggle").on("change", function () {
            showToast(this.checked ? "2FA enabled." : "2FA disabled.", this.checked ? "success" : "info");
        });
    }

    /* ── Init ── */
    renderPersonalFields(false);
    renderSavedPassengers();
    renderPaymentMethods();
    renderNotifications();
    renderTravelHistory();
    renderSecurity();

});
