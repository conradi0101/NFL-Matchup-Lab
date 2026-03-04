const params = new URLSearchParams(window.location.search);
const teamId = params.get("id");

let currentPlayers = [];
let sortDirection = {};

// JSON
fetch("assets/data/teams.json")
    .then(response => response.json())
    .then(data => {
        const team = data.find(t => t.id === teamId);

        if (!team) {
            document.body.innerHTML = "<h1 class='text-center mt-5'>Team not found</h1>";
            return;
        }

        document.getElementById("team-logo").src = team.logo;
        document.getElementById("team-name").textContent = team.name;
        document.getElementById("team-conference").textContent = team.conference;

        currentPlayers = team.starters;

        renderTable(currentPlayers);
    });


function renderTable(players) {

    const tableBody = document.getElementById("players-table");
    tableBody.innerHTML = "";

    players.forEach(player => {

        const age = calculateAge(player.birthDate);
        const experience = new Date().getFullYear() - player.draftYear;

        const row = `
            <tr>
                <td><img src="${player.photo}" style="height:60px;"></td>
                <td>${player.name}</td>
                <td>${Array.isArray(player.position) ? player.position.join(", ") : player.position}</td>
                <td>${player.number}</td>
                <td>${age}</td>
                <td>${experience} years</td>
                <td>${formatHeight(player.height)}</td>
                <td>${player.weight} lbs</td>
                <td>${player.college}</td>
            </tr>
        `;

        tableBody.innerHTML += row;
    });
}

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("sortable")) {

        const key = e.target.dataset.key;

        sortTable(key);
    }
});


function sortTable(key) {
    
    sortDirection[key] = !sortDirection[key];

    currentPlayers.sort((a, b) => {

        let valueA = getValue(a, key);
        let valueB = getValue(b, key);

        if (typeof valueA === "string") {

            return sortDirection[key]
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);

        } else {

            return sortDirection[key]
                ? valueA - valueB
                : valueB - valueA;
        }
    });

    renderTable(currentPlayers);
}


// ===============================
// GET VALUE FOR SORT
// ===============================

function getValue(player, key) {

    const age = calculateAge(player.birthDate);
    const experience = new Date().getFullYear() - player.draftYear;

    switch (key) {
        case "name": return player.name;
        case "position":
            return Array.isArray(player.position)
                ? player.position.join(", ")
                : player.position;
        case "number": return player.number;
        case "age": return age;
        case "experience": return experience;
        case "height": return player.height;
        case "weight": return player.weight;
        case "college": return player.college;
        default: return "";
    }
}

// AGE
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();

    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// HEIGHT
function formatHeight(inches) {

    const feet = Math.floor(inches / 12);
    const remaining = inches % 12;

    return `${feet}' ${remaining}"`;
}


