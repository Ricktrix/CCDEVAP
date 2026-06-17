$(document).ready(function () {
    const seedBookings = JSON.parse(JSON.stringify(RESERVATIONS));
    if (!localStorage.getItem("myReservations")) {
        localStorage.setItem("myReservations", JSON.stringify(seedBookings));
    }

    let records = JSON.parse(localStorage.getItem("myReservations"));
    let targetIndexToEdit = null;

    renderReservationsTable(records);

    function renderReservationsTable(dataList) {
        const container = $("#reservations-container");
        container.empty();

        if (dataList.length === 0) {
            container.append(`<tr><td colspan="7" class="text-center text-muted py-4">No reservations found.</td></tr>`);
            return;
        }

        dataList.forEach((item, index) => {
            const badge = item.status === "Confirmed"
                ? `<span class="badge bg-success">Confirmed</span>`
                : item.status === "Pending"
                    ? `<span class="badge bg-warning text-dark">Pending</span>`
                    : `<span class="badge bg-secondary">${item.status}</span>`;

            container.append(`
                <tr data-index="${index}">
                    <td><strong>${item.ref}</strong></td>
                    <td>${item.name}</td>
                    <td>${item.route}</td>
                    <td>${item.seat}</td>
                    <td>${badge}</td>
                    <td>₱${item.price.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-view-details" data-index="${index}">View</button>
                        <button class="btn btn-sm btn-outline-primary btn-edit" data-index="${index}" ${item.status === "Cancelled" ? "disabled" : ""}>Edit</button>
                        <button class="btn btn-sm btn-danger btn-cancel" data-index="${index}" ${item.status === "Cancelled" ? "disabled" : ""}>Cancel</button>
                    </td>
                </tr>
            `);
        });
    }

    $("#search-reservation, #filter-status").on("input change", function () {
        const searchVal = $("#search-reservation").val().toLowerCase();
        const statusFilter = $("#filter-status").val();

        const filtered = records.filter(item => {
            const matchesSearch = item.ref.toLowerCase().includes(searchVal) || item.name.toLowerCase().includes(searchVal);
            const matchesStatus = statusFilter === "All" || item.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        renderReservationsTable(filtered);
    });

    $(document).on("click", ".btn-view-details", function () {
        const index = $(this).data("index");
        const booking = records[index];

        $("#modal-ref").text(booking.ref);
        $("#modal-name").text(booking.name);
        $("#modal-flight").text(`${booking.flightId} (${booking.route})`);
        $("#modal-seat").text(booking.seat);
        $("#modal-meal").text(booking.meal);
        $("#modal-status").text(booking.status);
        $("#modal-total").text(`₱${booking.price.toLocaleString()}`);

        new bootstrap.Modal(document.getElementById("viewDetailsModal")).show();
    });

    $(document).on("click", ".btn-edit", function () {
        targetIndexToEdit = $(this).data("index");
        const booking = records[targetIndexToEdit];

        $("#edit-fullName").val(booking.name);
        $("#edit-meal").val(booking.meal);

        new bootstrap.Modal(document.getElementById("editReservationModal")).show();
    });

    $("#btn-save-edit").click(function () {
        if (targetIndexToEdit !== null) {
            records[targetIndexToEdit].name = $("#edit-fullName").val();
            records[targetIndexToEdit].meal = $("#edit-meal").val();
            localStorage.setItem("myReservations", JSON.stringify(records));
            renderReservationsTable(records);
            bootstrap.Modal.getInstance(document.getElementById("editReservationModal")).hide();
            alert("Reservation updated successfully.");
        }
    });

    $(document).on("click", ".btn-cancel", function () {
        const index = $(this).data("index");
        if (confirm(`Cancel reservation ${records[index].ref}?`)) {
            records[index].status = "Cancelled";
            localStorage.setItem("myReservations", JSON.stringify(records));
            renderReservationsTable(records);
        }
    });
});
