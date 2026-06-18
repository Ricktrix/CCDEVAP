/* =============================================
   Lorem Ipsum - Ticket Booking Page Functionality
   js/booking.js
   ============================================= */

$(document).ready(function () {
    
    var activeStep = 1;
    var currentFlight = null;

    
    var priceStructure = {
        baseFare: 0,
        seatFee: 0,
        mealFee: 0,
        extraServicesFee: 0,
        taxPercentage: 0.12
    };

    
    var selectedSeatCode = "";
    var selectedMealType = "Standard";
    var dynamicAddOns = {
        baggageCost: 0,
        priorityCost: 0,
        insuranceCost: 0,
        loungeCost: 0
    };

    
    function initialize() {
        console.log("Initializing flight booking wizard...");
        
        
        try {
            populateFlightSelector();
        } catch (e) {
            console.error("Failed to populate flight selector dropdown:", e);
        }

        try {
            retrieveSelectedFlight();
        } catch (e) {
            console.error("Failed to load flight info:", e);
        }
        
        try {
            generateAircraftSeatsMap();
        } catch (e) {
            console.error("Failed to generate seat grid:", e);
        }
        
        try {
            bindEventHandlers();
        } catch (e) {
            console.error("Failed to bind event handlers:", e);
        }
        
        try {
            recalculateTotals();
            // Trigger initial menu description display
            $("#mealSelect").trigger("change");
        } catch (e) {
            console.error("Failed to calculate initial pricing:", e);
        }
    }

   
    function populateFlightSelector() {
        var $selector = $("#flightSelector");
        if ($selector.length === 0) return;

        $selector.empty();
        $selector.append('<option value="" disabled>-- Select a Flight --</option>');

        if (typeof FLIGHTS !== 'undefined' && FLIGHTS.length > 0) {
            for (var i = 0; i < FLIGHTS.length; i++) {
                var f = FLIGHTS[i];
                var airlineName = (typeof AIRLINES !== 'undefined' && AIRLINES[f.airline]) ? AIRLINES[f.airline].name : "Airline";
                var optText = f.id + " – " + airlineName + " (" + f.from + " → " + f.to + ") – " + f.cabin + " Class – ₱" + f.price.toLocaleString();
                $selector.append('<option value="' + f.id + '">' + optText + '</option>');
            }
        }
    }

   
    function retrieveSelectedFlight() {
        var storedId = localStorage.getItem("selectedFlightId");
        var activeFlightId = storedId;

       
        var selectedDropdownVal = $("#flightSelector").val();
        if (selectedDropdownVal) {
            activeFlightId = selectedDropdownVal;
        }

        if (typeof FLIGHTS !== 'undefined' && FLIGHTS.length > 0) {
            currentFlight = FLIGHTS.find(function(f) {
                return f.id === activeFlightId;
            }) || FLIGHTS[0];
        } else {
            currentFlight = { id: "SW101", from: "MNL", to: "CEB", price: 1850, cabin: "Economy" };
        }

        priceStructure.baseFare = currentFlight.price;
        
        
        $("#flightSelector").val(currentFlight.id);

        var flightHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-primary">${currentFlight.id}</span>
                <span class="fw-bold text-primary">${currentFlight.cabin}</span>
            </div>
            <div class="mt-2 text-center">
                <span class="fs-5 fw-bold">${currentFlight.from}</span>
                <i class="bi bi-arrow-right mx-2"></i>
                <span class="fs-5 fw-bold">${currentFlight.to}</span>
            </div>
            <div class="text-center mt-1 text-muted small">
                Base Fare: ₱${currentFlight.price.toLocaleString()}
            </div>
        `;
        $("#summaryFlightInfo").html(flightHTML);
    }

    
    function generateAircraftSeatsMap() {
        var $cabin = $("#airplaneCabin");
        if ($cabin.length === 0) return;
        
        $cabin.empty();

        var rowsCount = 6;
        var seatsPattern = ["A", "B", "Aisle", "C", "D"];

        for (var r = 1; r <= rowsCount; r++) {
            
            var $rowDiv = $('<div class="row g-1 align-items-center justify-content-center mb-2"></div>');
            
            
            $rowDiv.append('<div class="col-1 text-center font-monospace fw-bold text-muted small">' + r + '</div>');

            for (var colIdx = 0; colIdx < seatsPattern.length; colIdx++) {
                var patternVal = seatsPattern[colIdx];

                if (patternVal === "Aisle") {
                    
                    $rowDiv.append('<div class="col-2 text-center text-muted small" style="font-size: 0.7rem; font-weight: 500;">AISLE</div>');
                } else {
                    
                    var seatId = r + patternVal;
                    var seatTypeClass = "available"; 

                    if (r <= 2) {
                        seatTypeClass = "premium";
                    }

                   
                    var isOccupied = false;
                    if (currentFlight && currentFlight.id) {
                        var charCodeSum = 0;
                        for (var charIdx = 0; charIdx < currentFlight.id.length; charIdx++) {
                            charCodeSum += currentFlight.id.charCodeAt(charIdx);
                        }
                       
                        if (charCodeSum % 2 === 0) {
                            isOccupied = (r === 3 && patternVal === "A") || (r === 5 && patternVal === "C") || (r === 1 && patternVal === "B");
                        } else {
                            isOccupied = (r === 2 && patternVal === "B") || (r === 4 && patternVal === "D") || (r === 6 && patternVal === "A");
                        }
                    }

                    if (isOccupied) {
                        seatTypeClass = "occupied";
                    }

                    var seatCost = (seatTypeClass === "premium") ? 500 : 0;
                    var costLabel = (seatTypeClass === "premium") ? "Premium Seat (+₱500)" : "Standard Seat (₱0)";
                    
                    
                    var $seatCol = $('<div class="col-2 d-flex justify-content-center"></div>');
                    var $seatEl = $('<div class="plane-seat ' + seatTypeClass + '" data-seat-id="' + seatId + '" data-price="' + seatCost + '" data-bs-toggle="tooltip" title="' + costLabel + '">' + patternVal + '</div>');
                    
                    $seatCol.append($seatEl);
                    $rowDiv.append($seatCol);
                }
            }
            
            
            $rowDiv.append('<div class="col-1 text-center font-monospace fw-bold text-muted small">' + r + '</div>');
            $cabin.append($rowDiv);
        }

        
        try {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            if (window.bootstrap && bootstrap.Tooltip) {
                tooltipTriggerList.map(function (tooltipTriggerEl) {
                    return new bootstrap.Tooltip(tooltipTriggerEl);
                });
            }
        } catch (e) {
            console.warn("Bootstrap Tooltips initialization failed, bypassing silently: ", e);
        }
    }

    
    function bindEventHandlers() {
        
        
        $("#btnNext1").on("click", function() {
            if (validatePassengerForm()) {
                $("#sumPassengerName").text($("#fullName").val());
                transitionStep(2);
            } else {
                showToastNotification("Form Validation", "Please enter correct details in the blank fields highlighted in red.", "warning");
            }
        });

        
        $("#btnBack2").on("click", function() {
            transitionStep(1);
        });

        $("#btnNext2").on("click", function() {
            if (selectedSeatCode === "") {
                showToastNotification("Selection Required", "Please tap on any available seat on the cabin grid.", "warning");
            } else {
                transitionStep(3);
            }
        });

       
        $("#btnBack3").on("click", function() {
            transitionStep(2);
        });

        
        $("#flightSelector").on("change", function() {
            var selectedId = $(this).val();
            localStorage.setItem("selectedFlightId", selectedId);
            
            
            selectedSeatCode = "";
            priceStructure.seatFee = 0;
            $("#seatSelectionDisplay").text("No seat selected. Please pick a seat above.");
            $("#sumSeat").text("-");

            retrieveSelectedFlight();
            generateAircraftSeatsMap();
            recalculateTotals();
            showToastNotification("Flight Updated", "Pricing details and seat maps have been updated.", "success");
        });

        
        $(document).on("click", ".plane-seat", function() {
            var $clicked = $(this);
            
            
            if ($clicked.hasClass("occupied")) {
                showToastNotification("Seat Occupied", "This seat is already booked. Please try an available seat.", "danger");
                return;
            }

            
            $(".plane-seat.selected").removeClass("selected");
            
            
            $clicked.addClass("selected");
            
            selectedSeatCode = $clicked.attr("data-seat-id");
            priceStructure.seatFee = parseInt($clicked.attr("data-price")) || 0;

            
            $("#seatSelectionDisplay").html('<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Selected Seat: ' + selectedSeatCode + ' (' + (priceStructure.seatFee > 0 ? "Premium Seat" : "Standard Seat") + ')</span>');
            $("#sumSeat").text(selectedSeatCode);

            
            recalculateTotals();
            showToastNotification("Seat Selection", "You selected seat " + selectedSeatCode, "success");

            
            var seatDetailsHTML = 
                'Seat Number: <strong>' + selectedSeatCode + '</strong><br>' +
                'Status: <strong>' + (priceStructure.seatFee > 0 ? "Premium Comfort Row" : "Standard Seat") + '</strong><br>' +
                'Additional Surcharge: <strong>₱' + priceStructure.seatFee.toLocaleString() + '</strong>';

            
            $("#seatModalDetails, #seat-modal-info").html(seatDetailsHTML);

            try {
                var modalTargetElement = document.getElementById("seatDetailModal") || document.getElementById("seatModal");
                if (modalTargetElement) {
                    if (window.bootstrap && bootstrap.Modal) {
                        
                        var myModal = bootstrap.Modal.getInstance(modalTargetElement);
                        if (!myModal) {
                            myModal = new bootstrap.Modal(modalTargetElement);
                        }
                        myModal.show();
                    } else {
                        $(modalTargetElement).addClass("show").css({
                            "display": "block",
                            "background": "rgba(0,0,0,0.5)"
                        });
                        $(modalTargetElement).find("[data-bs-dismiss='modal']").off("click").on("click", function() {
                            $(modalTargetElement).removeClass("show").css("display", "none");
                        });
                    }
                }
            } catch (err) {
                console.warn("Bootstrap Modal show encountered an issue. Using layout fallback: ", err);
            }
        });

        
        $("#mealSelect").on("change", function() {
            var $selectedOption = $(this).find("option:selected");
            selectedMealType = $selectedOption.val();
            priceStructure.mealFee = parseInt($selectedOption.attr("data-price"));

            var description = "";
            switch (selectedMealType) {
                case "Standard":
                    description = "Standard menu.";
                    break;
                case "Vegetarian":
                    description = "Plant-based menu.";
                    break;
                case "Vegan":
                    description = "Vegan-based menu.";
                    break;
                case "Halal":
                    description = "Halal-based menu.";
                    break;
                case "Kosher":
                    description = "Kosher-based menu.";
                    break;
                case "Gluten-Free":
                    description = "Gluten-free menu.";
                    break;
            }

            $("#mealDescription").text(description);
            $("#sumMeal").text(selectedMealType);
            
            recalculateTotals();
            showToastNotification("Meal Updated", "Meal pack option set to " + selectedMealType, "info");
        });

        
        $("#baggageCount").on("change", function() {
            var count = parseInt($(this).val());
            var costUnit = parseInt($(this).attr("data-cost-unit")) || 500;
            dynamicAddOns.baggageCost = count * costUnit;
            recalculateTotals();
        });

        
        $(".check-extra").on("change", function() {
            var $elem = $(this);
            var cost = parseInt($elem.attr("data-cost"));
            var targetProp = "";

            if ($elem.attr("id") === "priorityBoarding") targetProp = "priorityCost";
            else if ($elem.attr("id") === "travelInsurance") targetProp = "insuranceCost";
            else if ($elem.attr("id") === "loungeAccess") targetProp = "loungeCost";

            dynamicAddOns[targetProp] = $elem.is(":checked") ? cost : 0;
            recalculateTotals();
        });

        
        $("#themeToggle").on("click", function() {
            $("body").toggleClass("dark-mode");
            var isDark = $("body").hasClass("dark-mode");
            var $icon = $(this).find("i");
            
            if (isDark) {
                $icon.removeClass("bi-moon-fill").addClass("bi-sun-fill");
                showToastNotification("Display Update", "Dark mode UI theme enabled.", "info");
            } else {
                $icon.removeClass("bi-sun-fill").addClass("bi-moon-fill");
                showToastNotification("Display Update", "Light mode UI theme enabled.", "info");
            }
        });

        
        $("#btnConfirmBooking").on("click", function() {
            triggerSpinnerLoader();
            
            setTimeout(function() {
                hideSpinnerLoader();
                
                var finalTotal = calculateTotalsValue();
                var newBooking = {
                    ref: "SKY-" + Math.floor(100 + Math.random() * 900),
                    name: $("#fullName").val(),
                    route: currentFlight.from + " → " + currentFlight.to,
                    flightId: currentFlight.id,
                    seat: selectedSeatCode,
                    date: new Date().toISOString().split('T')[0],
                    status: "Confirmed",
                    price: finalTotal,
                    cabin: currentFlight.cabin,
                    meal: selectedMealType
                };

                if (typeof RESERVATIONS !== 'undefined') {
                    RESERVATIONS.unshift(newBooking);
                }

                showToastNotification("Booking Complete", "Ticket registration processed. Loading dashboard.", "success");
                
                setTimeout(function() {
                    window.location.href = "reservations.html";
                }, 1500);
            }, 1800);
        });
    }

    
    function transitionStep(targetStep) {
        // Toggle Panel displays
        $(".card[id^='stepPanel']").addClass("d-none");
        $("#stepPanel" + targetStep).removeClass("d-none");

        $(".stepper .step").removeClass("active completed");
        for (var i = 1; i <= 3; i++) {
            var $indicator = $("#stepIndicator" + i);
            if (i < targetStep) {
                $indicator.addClass("completed");
            } else if (i === targetStep) {
                $indicator.addClass("active");
            }
        }

        activeStep = targetStep;
        
        $("html, body").animate({ scrollTop: 0 }, 300);
    }

    
    function validatePassengerForm() {
        var $form = $("#passengerForm");
        var nativeForm = document.getElementById("passengerForm");
        
        if (nativeForm) {
            if (!nativeForm.checkValidity()) {
                $form.addClass("was-validated");
                return false;
            }
            return true;
        }

        
        var isFormValid = true;
        $("#passengerForm input, #passengerForm select").each(function () {
            if ($(this).prop("required") && $(this).val() === "") {
                $(this).addClass("is-invalid");
                isFormValid = false;
            } else {
                $(this).removeClass("is-invalid");
            }
        });
        return isFormValid;
    }

    
    function recalculateTotals() {
        var seatAmt = priceStructure.seatFee;
        var mealAmt = priceStructure.mealFee;
        var addOnServicesAmt = dynamicAddOns.baggageCost + dynamicAddOns.priorityCost + dynamicAddOns.insuranceCost + dynamicAddOns.loungeCost;
        
        var rawSubTotal = priceStructure.baseFare + seatAmt + mealAmt + addOnServicesAmt;
        var calculatedTax = Math.round(rawSubTotal * priceStructure.taxPercentage);
        var grandTotalSum = rawSubTotal + calculatedTax;

        $("#priceBase").text("₱" + priceStructure.baseFare.toLocaleString());
        $("#priceSeat").text("₱" + seatAmt.toLocaleString());
        $("#priceMeal").text("₱" + mealAmt.toLocaleString());
        $("#priceServices").text("₱" + addOnServicesAmt.toLocaleString());
        $("#priceTax").text("₱" + calculatedTax.toLocaleString());
        $("#grandTotal").text("₱" + grandTotalSum.toLocaleString());
    }

    function calculateTotalsValue() {
        var seatAmt = priceStructure.seatFee;
        var mealAmt = priceStructure.mealFee;
        var addOnServicesAmt = dynamicAddOns.baggageCost + dynamicAddOns.priorityCost + dynamicAddOns.insuranceCost + dynamicAddOns.loungeCost;
        var sub = priceStructure.baseFare + seatAmt + mealAmt + addOnServicesAmt;
        return sub + Math.round(sub * priceStructure.taxPercentage);
    }

    
    function showToastNotification(title, message, type) {
        var icons = {
            success: "check-circle-fill",
            danger: "x-circle-fill",
            warning: "exclamation-triangle-fill",
            info: "info-circle-fill"
        };
        var currentId = "toast-" + Date.now();
        var selectedIcon = icons[type] || "info-circle-fill";

        var toastHTML = `
            <div id="${currentId}" class="toast align-items-center text-bg-${type} border-0 show" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${selectedIcon} me-2"></i><strong>${title}:</strong> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="document.getElementById('${currentId}').remove()"></button>
                </div>
            </div>`;

        $("#toastContainer").append(toastHTML);
        setTimeout(function() {
            $("#" + currentId).fadeOut(400, function() {
                $(this).remove();
            });
        }, 3500);
    }

    
    function triggerSpinnerLoader() {
        $("#loadingSpinner").fadeIn(150);
    }

    function hideSpinnerLoader() {
        $("#loadingSpinner").fadeOut(150);
    }

    initialize();
});