(function () {
    "use strict";

    // Initialize the app once the document is fully loaded
    document.addEventListener("DOMContentLoaded", function () {
        // Call the init function once the document is ready
        t.init();
    });

    var t = {};
    t.cache = {};
    t.opts = {
        maxSpeed: 200
    };
    t.localStorage = localStorage;

    // Initialize the app
    t.init = function () {
        // Cache the speed element
        t.cache.speed = document.getElementById("speed");

        // Default to miles per hour (mph)
        if (!localStorage.measure) {
            localStorage.measure = "mh";
        }

        // Hide installer element if it's present
        if (document.getElementById("installer")) {
            document.getElementById("installer").style.display = "none";
        }

        // Function to update the speed display
        t.writeSpeed = function (position) {
            document.getElementById("error").innerHTML = ""; // Clear any error messages
            document.getElementById("unit").innerHTML = "miles/hour"; // Default unit to miles per hour

            var speed = position.coords.speed; // Speed in meters per second

            if (localStorage.measure === "kh") {
                // Convert meters per second to kilometers per hour (km/h)
                speed = 60 * speed * 60;
                speed /= 1000;
                document.getElementById("unit").innerHTML = "km/h"; // Display unit as km/h
            } else if (localStorage.measure === "mh") {
                // Convert meters per second to miles per hour
                speed = 60 * speed * 60;
                speed *= 0.000621371192;
                document.getElementById("unit").innerHTML = "miles/hour";

                // Round the speed and display it
                speed = Math.round(speed);
                t.cache.speed.innerHTML = speed;
            };

            // Watch the geolocation to update speed in real-time
            navigator.geolocation.watchPosition(function (position) {
                t.writeSpeed(position);
                // Hide any unnecessary info or errors
                document.getElementById("lat").innerHTML = "";
                document.getElementById("long").innerHTML = "";
                document.getElementById("info").style.display = "none";

                let loggingInterval = null;
                let loggingActive = false;

                const toggleButton = document.getElementById("toggle-log-btn");

                toggleButton.addEventListener("click", function () {
                    if (loggingActive) {
                        clearInterval(loggingInterval);
                        loggingInterval = null;
                        loggingActive = false;
                        toggleButton.textContent = "Start Measuring Speed";
                    } else {
                        loggingInterval = setInterval(function () {
                            const speedStr = t.cache.speed?.innerHTML;
                            const speedValue = parseFloat(speedStr);
                            if (!isNaN(speedValue)) {
                                logSpeed(speedValue);
                            }
                        }, 300);
                        loggingActive = true;
                        toggleButton.textContent = "Stop Measuring Speed";
                    }
                });

            }, function (error) {
                // Handle geolocation errors
                document.getElementById("speed").innerHTML = "";
                document.getElementById("error").innerHTML = "ERROR(" + error.code + "): " + error.message;
                document.getElementById("lat").innerHTML = "ERROR!!!";
                document.getElementById("info").style.display = "block";
            }, {
                enableHighAccuracy: true,
                maximumAge: 0
            });
        };

        function logSpeed(speed) {
            const table = document.getElementById("speed-log").getElementsByTagName('tbody')[0];
            const newRow = table.insertRow();

            const timeCell = newRow.insertCell(0);
            const speedCell = newRow.insertCell(1);

            const now = new Date();
            const timeString = now.toLocaleTimeString();

            timeCell.textContent = timeString;
            speedCell.textContent = speed.toFixed(2); // adjust decimal places if needed
        }
    }) ();
