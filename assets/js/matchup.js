// ===============================
// MATCHUP SYSTEM
// ===============================

// Bootstrap Modal
const playerModal = new bootstrap.Modal(
    document.getElementById("playerModal")
);

// Dados
let teamsData = [];

// Estado do jogo
const gameState = {
    teamA: null,
    teamB: null,
    selectedPlayers: {}
};

// Elementos
const teamASelect = document.getElementById("teamA");
const teamBSelect = document.getElementById("teamB");


// ===============================
// CARREGAR TIMES
// ===============================

fetch("assets/data/teams.json")
    .then(response => response.json())
    .then(data => {
        teamsData = data;
        populateTeams();
    });


// ===============================
// PREENCHER SELECTS
// ===============================

function populateTeams() {

    teamsData.forEach(team => {

        const optionA = document.createElement("option");
        optionA.value = team.id;
        optionA.textContent = team.name;

        const optionB = optionA.cloneNode(true);

        teamASelect.appendChild(optionA);
        teamBSelect.appendChild(optionB);
    });
}


// ===============================
// CAPTURAR SELEÇÃO DOS TIMES
// ===============================

teamASelect.addEventListener("change", (e) => {

    const selectedId = e.target.value;

    if (selectedId === gameState.teamB?.id) {
        showTopMessage("You cannot select the same team.");
        teamASelect.value = "";
        return;
    }

    gameState.teamA = teamsData.find(team => team.id === selectedId);

    clearMatchup()

    updateSelectOptions();
});

teamBSelect.addEventListener("change", (e) => {

    const selectedId = e.target.value;

    if (selectedId === gameState.teamA?.id) {
        showTopMessage("You cannot select the same team.");
        teamBSelect.value = "";
        return;
    }

    gameState.teamB = teamsData.find(team => team.id === selectedId);

    clearMatchup()
    updateSelectOptions();
});

function updateSelectOptions() {

    Array.from(teamASelect.options).forEach(option => {
        option.disabled = false;
    });

    Array.from(teamBSelect.options).forEach(option => {
        option.disabled = false;
    });

    if (gameState.teamA) {
        const option = teamBSelect.querySelector(
            `option[value="${gameState.teamA.id}"]`
        );
        if (option) option.disabled = true;
    }

    if (gameState.teamB) {
        const option = teamASelect.querySelector(
            `option[value="${gameState.teamB.id}"]`
        );
        if (option) option.disabled = true;
    }
}


// ===============================
// CLIQUE NAS POSIÇÕES
// ===============================

document.querySelectorAll(".position-slot").forEach(button => {

    button.addEventListener("click", () => {

        const position = button.dataset.position;
        const slot = button.dataset.slot; // 🔥 ESSENCIAL

        if (!gameState.teamA || !gameState.teamB) {
            showTopMessage("Please select both teams first!");
            return;
        }

        openPlayerModal(position, slot);
    });

});




// ===============================
// OPEN MODAL WITH POSITION FILTER
// ===============================

function openPlayerModal(position, slot) {

    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    modalTitle.textContent = `Select ${position}`;
    modalBody.innerHTML = "";

    const players = [];

    // Filter players from selected teams
    function filterTeam(team) {

        if (!team) return;

        team.starters.forEach(player => {

            const matchesPosition =
                Array.isArray(player.position)
                    ? player.position.includes(position)
                    : player.position === position;

            if (matchesPosition) {
                players.push({
                    ...player,
                    team: team.name
                });
            }
        });
    }

    filterTeam(gameState.teamA);
    filterTeam(gameState.teamB);

    if (players.length === 0) {
        modalBody.innerHTML =
            "<p class='text-center'>No players found for this position.</p>";
        playerModal.show();
        return;
    }

    players.forEach(player => {

        const card = document.createElement("div");
        card.classList.add("card", "mb-2", "p-2", "player-option");

        // 🔒 Check if player already selected
        const alreadySelected = Object.values(gameState.selectedPlayers)
            .some(p => p.name === player.name);

        if (alreadySelected) {
            card.classList.add("disabled-player");
            card.style.opacity = "0.5";
            card.style.cursor = "not-allowed";
        } else {
            card.style.cursor = "pointer";

            card.addEventListener("click", () => {
                selectPlayer(slot, player);
            });
        }

        card.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <img src="${player.photo}" style="height:50px;">
                <div>
                    <strong>${player.name}</strong><br>
                    <small>${player.team}</small>
                </div>
            </div>
        `;

        modalBody.appendChild(card);
    });

    playerModal.show();
}


// ===============================
// SELECIONAR JOGADOR
// ===============================

function selectPlayer(slot, player) {

    const alreadySelected = Object.values(gameState.selectedPlayers)
        .some(p => p.name === player.name);

    if (alreadySelected) {
        showTopMessage("This player is already selected in another slot.");
        return;
    }

    gameState.selectedPlayers[slot] = player;

    playerModal.hide();

    // - FIELD
    updateField(slot, player);

    // - ROSTER
    updateRoster();

    // - STATS
    updateStats();
}

function updateField(slot, player) {

    const button = document.querySelector(
        `.position-slot[data-slot="${slot}"]`
    );

    if (!button) return;

    button.innerHTML = `
        <img src="${player.photo}" class="slot-image">
    `;

    button.classList.add("filled-slot");
}

// ROSTER
function updateRoster() {

    const rosterDiv = document.getElementById("roster");
    rosterDiv.innerHTML = "";

    const players = Object.values(gameState.selectedPlayers);

    if (players.length === 0) {
        rosterDiv.innerHTML = "<p class='text-muted text-center'>No players selected yet.</p>";
        return;
    }

    players.forEach(player => {
        const age = calculateAge(player.birthDate);
        const experience = calculateExperience(player.draftYear);

        const card = document.createElement("div");
        card.classList.add("card", "mb-2", "p-2");

        card.innerHTML = `
            <div class="d-flex align-items-center gap-3">

                <img src="${player.photo}" 
                     style="height:60px; width:60px; 
                            border-radius:50%; 
                            object-fit:cover;">

                <div>
                    <strong>${player.name}</strong>
                    <small>#${player.number}</small><br>
                    <small>
                        ${player.position}<br>
                        Age: ${age} | Exp: ${experience} yrs<br>
                        ${formatHeight(player.height)} | 
                        ${player.weight} lbs
                    </small>
                </div>

            </div>
        `;

        rosterDiv.appendChild(card);
    });
}

function showTopMessage(message) {

    const messageDiv = document.getElementById("topMessage");

    messageDiv.textContent = message;
    messageDiv.classList.remove("d-none");

    setTimeout(() => {
        messageDiv.classList.add("d-none");
    }, 3000);
}


// ===============================
// STATS SYSTEM
// ===============================

function updateStats() {

    const statsDiv = document.getElementById("stats");
    const players = Object.values(gameState.selectedPlayers);

    if (players.length === 0) {
        statsDiv.innerHTML = "";
        return;
    }

    let totalAge = 0;
    let totalExp = 0;
    let totalHeight = 0;
    let totalWeight = 0;

    players.forEach(player => {

        totalAge += calculateAge(player.birthDate);
        totalExp += calculateExperience(player.draftYear);
        totalHeight += player.height;
        totalWeight += player.weight;

    });

    const count = players.length;

    const avgAge = (totalAge / count).toFixed(1);
    const avgExp = (totalExp / count).toFixed(1);
    const avgHeight = formatHeight(
        Math.round(totalHeight / count)
    );
    const avgWeight = Math.round(totalWeight / count);

    statsDiv.innerHTML = `
        <div class="card shadow-sm p-4">

            <h4 class="mb-3 text-center fw-bold">
                Team Statistics
            </h4>

            <p><strong>Players Selected:</strong> ${count}</p>
            <p><strong>Average Age:</strong> ${avgAge}</p>
            <p><strong>Average Experience:</strong> ${avgExp} yrs</p>
            <p><strong>Average Height:</strong> ${avgHeight}</p>
            <p><strong>Average Weight:</strong> ${avgWeight} lbs</p>

        </div>
    `;
}

// ===== CLEAR FUNCTION =====
function clearMatchup() {

    // Reset selected players
    gameState.selectedPlayers = {};

    // Clear field buttons
    document.querySelectorAll(".position-slot").forEach(button => {
        button.innerHTML = button.dataset.position;
        button.style.background = "white";
        button.style.border = "2px solid black";
    });

    // Clear roster and stats
    document.getElementById("roster").innerHTML = "";
    document.getElementById("stats").innerHTML = "";
}