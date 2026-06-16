/* =============================================
   Placeholder - Admin Users Page
   js/admin-users.js
   ============================================= */

$(document).ready(function () {

    /* ── Local editable copy of users ── */
    let users          = JSON.parse(JSON.stringify(USERS));
    let filtered       = [...users];
    let currentPage    = 1;
    let userToDelete   = null;
    let selectedUsers  = new Set();
    const PER_PAGE     = 8;

    /* ── Stats ── */
    function renderStats() {
        const active    = users.filter(u => u.status === "Active").length;
        const admins    = users.filter(u => u.role === "Admin").length;
        const suspended = users.filter(u => u.status === "Suspended").length;

        const stats = [
            { label: "Total Users",  value: users.length, color: "primary", icon: "bi-people-fill"     },
            { label: "Active",       value: active,        color: "success", icon: "bi-person-check-fill"},
            { label: "Admins",       value: admins,        color: "warning", icon: "bi-shield-fill"      },
            { label: "Suspended",    value: suspended,     color: "danger",  icon: "bi-person-x-fill"    }
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

        $("#userStatsRow").html(html);
    }

    /* ── Avatar initials ── */
    function avatarHtml(name, size = 38) {
        const parts    = name.trim().split(" ");
        const initials = (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
        const colors   = ["#0d6efd","#198754","#dc3545","#6f42c1","#fd7e14","#20c997"];
        const color    = colors[name.charCodeAt(0) % colors.length];
        return `
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};
                        color:#fff;display:flex;align-items:center;justify-content:center;
                        font-size:${size * 0.3}px;font-weight:700;flex-shrink:0;">
                ${initials}
            </div>`;
    }

    /* ── Role badge ── */
    function roleBadge(role) {
        return role === "Admin"
            ? `<span class="badge bg-warning text-dark"><i class="bi bi-shield-fill me-1"></i>Admin</span>`
            : `<span class="badge bg-info text-dark"><i class="bi bi-person-fill me-1"></i>Passenger</span>`;
    }

    /* ── Filter + sort ── */
    function applyFilters() {
        const q      = $("#userSearch").val().toLowerCase();
        const role   = $("#roleFilter").val();
        const status = $("#statusFilter").val();
        const sort   = $("#userSort").val();

        filtered = users.filter(u => {
            if (q && !u.name.toLowerCase().includes(q) &&
                     !u.email.toLowerCase().includes(q) &&
                     !u.id.toLowerCase().includes(q)) return false;
            if (role   && u.role   !== role)   return false;
            if (status && u.status !== status) return false;
            return true;
        }).sort((a, b) => {
            if (sort === "name-asc")      return a.name.localeCompare(b.name);
            if (sort === "name-desc")     return b.name.localeCompare(a.name);
            if (sort === "joined-desc")   return b.joined.localeCompare(a.joined);
            if (sort === "bookings-desc") return b.bookings - a.bookings;
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
            $("#usersTableBody").html(`
                <tr>
                    <td colspan="8" class="text-center text-muted py-4">
                        <i class="bi bi-person-slash me-2"></i> No users found.
                    </td>
                </tr>`
            );
            $("#userPaginationInfo").text("No results");
            $("#userPagination").html("");
            return;
        }

        const rows = page.map(u => `
            <tr id="urow-${u.id}">
                <td class="ps-3">
                    <input type="checkbox" class="form-check-input user-cb" data-id="${u.id}"
                           ${selectedUsers.has(u.id) ? "checked" : ""}>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        ${avatarHtml(u.name)}
                        <div>
                            <div class="fw-semibold small">${u.name}</div>
                            <div class="text-muted" style="font-size:0.72rem;">${u.id}</div>
                        </div>
                    </div>
                </td>
                <td class="small">${u.email}</td>
                <td>${roleBadge(u.role)}</td>
                <td>${getStatusBadge(u.status)}</td>
                <td><span class="badge bg-light text-dark border">${u.bookings}</span></td>
                <td class="small text-muted">${u.joined}</td>
                <td class="text-end pe-3">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" title="View"
                                onclick="openViewUser('${u.id}')">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button class="btn btn-outline-warning" title="Edit"
                                onclick="openEditUser('${u.id}')">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-outline-danger" title="Delete"
                                onclick="promptDeleteUser('${u.id}')">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            </tr>`
        ).join("");

        $("#usersTableBody").html(rows);
        $("#userPaginationInfo").text(
            `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} users`
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
        $("#userPagination").html(pgHtml);
    }

    /* Pagination click */
    $(document).on("click", "#userPagination .page-link", function (e) {
        e.preventDefault();
        const pg  = parseInt($(this).data("page"));
        const max = Math.ceil(filtered.length / PER_PAGE);
        if (pg < 1 || pg > max) return;
        currentPage = pg;
        renderTable();
    });

    /* ── View user ── */
    window.openViewUser = function (id) {
        const u = users.find(x => x.id === id);
        $("#viewUserBody").html(`
            <div class="text-center mb-3 pt-2">
                ${avatarHtml(u.name, 72)}
                <div class="mx-auto" style="width:72px;"></div>
                <h5 class="mt-2 mb-0">${u.name}</h5>
                <div class="text-muted small mb-2">${u.id}</div>
                <div class="d-flex gap-2 justify-content-center">
                    ${roleBadge(u.role)} ${getStatusBadge(u.status)}
                </div>
            </div>
            <table class="table table-sm">
                <tr><td class="text-muted small"> Email </td>      <td class="fw-semibold small">${u.email}</td></tr>
                <tr><td class="text-muted small"> Phone </td>      <td class="fw-semibold small">${u.phone}</td></tr>
                <tr><td class="text-muted small"> Bookings </td>   <td class="fw-semibold small">${u.bookings}</td></tr>
                <tr><td class="text-muted small"> Member Since </td><td class="fw-semibold small">${u.joined}</td></tr>
            </table>`
        );
        new bootstrap.Modal(document.getElementById("viewUserModal")).show();
    };

    /* ── Edit user ── */
    window.openEditUser = function (id) {
        const u = users.find(x => x.id === id);
        $("#euId").val(u.id);
        $("#euName").val(u.name);
        $("#euEmail").val(u.email);
        $("#euPhone").val(u.phone);
        $("#euRole").val(u.role);
        $("#euStatus").val(u.status);
        new bootstrap.Modal(document.getElementById("editUserModal")).show();
    };

    $("#saveEditUserBtn").on("click", function () {
        const id = $("#euId").val();
        const u  = users.find(x => x.id === id);
        if (!u) return;
        u.name   = $("#euName").val();
        u.email  = $("#euEmail").val();
        u.phone  = $("#euPhone").val();
        u.role   = $("#euRole").val();
        u.status = $("#euStatus").val();
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
        showToast("User updated successfully.", "success");
    });

    /* ── Delete user ── */
    window.promptDeleteUser = function (id) {
        userToDelete = id;
        const u = users.find(x => x.id === id);
        $("#deleteUserName").text(u.name);
        new bootstrap.Modal(document.getElementById("deleteUserModal")).show();
    };

    $("#confirmDeleteUserBtn").on("click", function () {
        if (!userToDelete) return;
        users = users.filter(u => u.id !== userToDelete);
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("deleteUserModal")).hide();
        showToast("User deleted.", "danger");
        userToDelete = null;
    });

    /* ── Add user ── */
    $("#saveAddUserBtn").on("click", function () {
        const fname = $("#auFname").val().trim();
        const lname = $("#auLname").val().trim();
        const email = $("#auEmail").val().trim();
        const pw1   = $("#auPassword").val();
        const pw2   = $("#auPassword2").val();
        let valid   = true;

        if (!fname) { $("#auFname").addClass("is-invalid"); valid = false; } else { $("#auFname").removeClass("is-invalid"); }
        if (!lname) { $("#auLname").addClass("is-invalid"); valid = false; } else { $("#auLname").removeClass("is-invalid"); }
        if (!email || !email.includes("@")) { $("#auEmail").addClass("is-invalid"); valid = false; } else { $("#auEmail").removeClass("is-invalid"); }
        if (!pw1 || pw1.length < 8 || pw1 !== pw2) {
            showToast("Passwords must match and be at least 8 characters.", "warning");
            valid = false;
        }
        if (!valid) return;

        const newUser = {
            id:       "USR" + String(users.length + 1).padStart(3, "0"),
            name:     fname + " " + lname,
            email:    email,
            phone:    $("#auPhone").val() || "N/A",
            role:     $("#auRole").val(),
            status:   $("#auStatus").val(),
            bookings: 0,
            joined:   new Date().toISOString().split("T")[0]
        };

        users.unshift(newUser);
        applyFilters();
        renderStats();
        bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
        showToast(`User ${newUser.name} created!`, "success");

        if ($("#auSendEmail").is(":checked")) {
            setTimeout(() => showToast("Welcome email sent!", "info"), 800);
        }

        $("#auFname, #auLname, #auEmail, #auPhone, #auPassword, #auPassword2").val("");
        $(".is-invalid").removeClass("is-invalid");
    });

    /* ── Password toggle ── */
    $("#togglePw1").on("click", function () {
        const inp = document.getElementById("auPassword");
        inp.type  = inp.type === "password" ? "text" : "password";
        $(this).find("i").toggleClass("bi-eye bi-eye-slash");
    });

    $("#togglePw2").on("click", function () {
        const inp = document.getElementById("auPassword2");
        inp.type  = inp.type === "password" ? "text" : "password";
        $(this).find("i").toggleClass("bi-eye bi-eye-slash");
    });

    /* ── Select all / bulk ── */
    $("#selectAll").on("change", function () {
        const checked = this.checked;
        $(".user-cb").prop("checked", checked);
        if (checked) {
            filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
                    .forEach(u => selectedUsers.add(u.id));
        } else {
            clearSelection();
            return;
        }
        updateBulkBar();
    });

    $(document).on("change", ".user-cb", function () {
        const id = $(this).data("id");
        this.checked ? selectedUsers.add(id) : selectedUsers.delete(id);
        updateBulkBar();
    });

    function updateBulkBar() {
        $("#selectedCount").text(selectedUsers.size);
        selectedUsers.size > 0
            ? $("#bulkActionsBar").removeClass("d-none")
            : $("#bulkActionsBar").addClass("d-none");
    }

    window.clearSelection = function () {
        selectedUsers.clear();
        $(".user-cb, #selectAll").prop("checked", false);
        $("#bulkActionsBar").addClass("d-none");
    };

    window.bulkAction = function (action) {
        if (!selectedUsers.size) return;
        const count = selectedUsers.size;

        if (action === "delete") {
            users = users.filter(u => !selectedUsers.has(u.id));
            showToast(`${count} user(s) deleted.`, "danger");
        } else {
            const newStatus = action === "activate" ? "Active" : "Suspended";
            users.forEach(u => { if (selectedUsers.has(u.id)) u.status = newStatus; });
            showToast(`${count} user(s) ${newStatus.toLowerCase()}.`, "success");
        }

        clearSelection();
        applyFilters();
        renderStats();
    };

    /* ── Event listeners ── */
    $("#userSearch").on("input", applyFilters);
    $("#roleFilter, #statusFilter, #userSort").on("change", applyFilters);
    $("#clearUserFilters").on("click", function () {
        $("#userSearch").val("");
        $("#roleFilter, #statusFilter").val("");
        applyFilters();
        showToast("Filters cleared.", "info");
    });

    /* ── Init ── */
    renderStats();
    applyFilters();

});
