// ===============================
// MATCHUP SYSTEM
// ===============================

// ===============================
// EDIT MODE
// ===============================

const urlParams = new URLSearchParams(window.location.search);

const isEditMode =
    urlParams.get("edit") === "true" &&
    localStorage.getItem("editMatchupId");

let pendingNavigation = null;

document.querySelectorAll(".edit-nav-link").forEach(link => {

    link.addEventListener("click", function (e) {

        if (!isEditMode) return;

        e.preventDefault();

        pendingNavigation = this.href;

        openEditExitModal();

    });

});

function openEditExitModal() {

    document
        .getElementById("editExitModal")
        .classList.remove("hidden");

}

const modalSave = document.getElementById("modalSave");
const modalDiscard = document.getElementById("modalDiscard");
const modalCancel = document.getElementById("modalCancel");

if (modalSave) {
    modalSave.addEventListener("click", () => {

        if (pendingNavigation === "saveMatchup") {
            saveMatchup("saved"); // save

            pendingNavigation = null;
            document.getElementById("editExitModal").classList.add("hidden");
            return;
        }

        // Se for um link normal
        if (pendingNavigation) {
            window.location.href = pendingNavigation;
        }

    });
}

if (modalDiscard) {
    modalDiscard.addEventListener("click", () => {

        localStorage.removeItem("editMatchupId");
        freePositions = {};

        if (pendingNavigation === "saveMatchup") {
            localStorage.removeItem("editMatchupId");
            freePositions = {};
            pendingNavigation = null;
            document.getElementById("editExitModal").classList.add("hidden");
            window.location.href = "saved.html";
            return;
        }

        if (pendingNavigation) {
            window.location.href = pendingNavigation;
        }

    });
};

if (modalCancel) {
    modalCancel.addEventListener("click", () => {

        document
            .getElementById("editExitModal")
            .classList.add("hidden");

        pendingNavigation = null;

    });
}

const saveMatchupBtn = document.querySelector(".edit-save-btn");

if (saveMatchupBtn) {
    saveMatchupBtn.addEventListener("click", function (e) {

        if (!isEditMode) {
            saveMatchup();
            return;
        }

        e.preventDefault();

        pendingNavigation = "saveMatchup";

        openEditExitModal();
    });
}




// Bootstrap Modal
const playerModal = new bootstrap.Modal(
    document.getElementById("playerModal")
);

// Dados
let teamsData = [];

// Field Mode
const originalPositions = {};
let freePositions = {};
let fieldMode = "fixed";
let showPlayerImages = true;

// Estado do jogo
const gameState = {
    teamA: null,
    teamB: null,
    selectedPlayers: {}
};

// Elementos
const teamASelect = document.getElementById("teamA");
const teamBSelect = document.getElementById("teamB");
const fieldModeSelect = document.getElementById("fieldMode");

if (fieldModeSelect) {
    fieldModeSelect.addEventListener("change", (e) => {

        fieldMode = e.target.value;

        if (fieldMode === "fixed") {
            resetFieldPositions();
        }

        if (fieldMode === "free") {
            applyFreePositions();
        }

    });
}


// ===============================
// CARREGAR TIMES
// ===============================

fetch("assets/data/teams.json")
    .then(response => response.json())
    .then(data => {
        teamsData = data;
        populateTeams();

        // Edit Mode
        const editMatchupId = localStorage.getItem("editMatchupId");

        if (editMatchupId) {
            loadMatchupForEdit(editMatchupId);
        }

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

        if (hasMoved) {
            hasMoved = false;
            return;
        }
        if (!gameState.teamA || !gameState.teamB) {
            return;
        }

        const position = button.dataset.position;
        const slot = button.dataset.slot;

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
    updateAllSlots();

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
        <img src="${player.photo}" 
            class="slot-image player-token">
    `;

    button.classList.add("filled-slot");
}

// ROSTER
function updateRoster() {

    const rosterDiv = document.getElementById("roster");
    rosterDiv.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = "Your Roster";
    title.classList.add("mb-3", "text-center");
    rosterDiv.appendChild(title);

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

    // Team Count
    const teamCounts = {};
    if (gameState.teamA) teamCounts[gameState.teamA.name] = 0;
    if (gameState.teamB) teamCounts[gameState.teamB.name] = 0;

    players.forEach(player => {

        totalAge += calculateAge(player.birthDate);
        totalExp += calculateExperience(player.draftYear);
        totalHeight += player.height;
        totalWeight += player.weight;

        if (teamCounts[player.team] !== undefined) {
            teamCounts[player.team] += 1;
        }

    });

    const count = players.length;

    const avgAge = (totalAge / count).toFixed(1);
    const avgExp = (totalExp / count).toFixed(1);
    const avgHeight = formatHeight(
        Math.round(totalHeight / count)
    );
    const avgWeight = Math.round(totalWeight / count);

    const teamText = Object.entries(teamCounts)
        .map(([team, num]) => `${team}: (${num})`)
        .join(" & ");

    statsDiv.innerHTML = `
        <div class="card shadow-sm p-4">

            <h4 class="mb-3 text-center fw-bold">
                Team Statistics
            </h4>

            <p><strong>Players Selected:</strong> ${count} (${teamText})</p>
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

    // Reset toggle
    showPlayerImages = true;

    // Clear roster and stats
    document.getElementById("roster").innerHTML = "";
    document.getElementById("stats").innerHTML = "";

    // Atualiza todos os slots corretamente
    updateAllSlots();
}


// ===============================
// SAVE ORIGINAL FIELD POSITIONS
// ===============================

document.querySelectorAll(".position-slot").forEach(slot => {

    const id = slot.dataset.slot;

    originalPositions[id] = {
        top: slot.style.top,
        left: slot.style.left
    };

});

// ===============================
// RESET FIELD POSITION
// ===============================
function resetFieldPositions() {

    document.querySelectorAll(".position-slot").forEach(slot => {

        slot.style.left = "";
        slot.style.top = "";
        slot.style.position = "";
    });

}

// ===============================
// DRAG SYSTEM
// ===============================
const field = document.getElementById("field");
let activeSlot = null;
let offsetX = 0;
let offsetY = 0;
let startX = 0;
let startY = 0;
let hasMoved = false;

document.addEventListener("pointerdown", (e) => {

    if (fieldMode !== "free") return;

    const slot = e.target.closest(".position-slot");
    if (!slot) return;

    activeSlot = slot;
    hasMoved = false;

    startX = e.clientX;
    startY = e.clientY;

    const rect = slot.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    slot.setPointerCapture(e.pointerId);

    document.body.classList.add("dragging");

    // ⚠️ impede scroll no mobile
    e.preventDefault();

}, { passive: false }); // importante

document.addEventListener("pointermove", (e) => {

    if (fieldMode !== "free" || !activeSlot) return;

    e.preventDefault(); // trava scroll

    const moveDistance = Math.sqrt(
        Math.pow(e.clientX - startX, 2) +
        Math.pow(e.clientY - startY, 2)
    );

    if (moveDistance > 5) hasMoved = true;

    const fieldRect = field.getBoundingClientRect();
    let x = e.clientX - fieldRect.left - offsetX;
    let y = e.clientY - fieldRect.top - offsetY;

    activeSlot.style.position = "absolute";
    activeSlot.style.left = x + "px";
    activeSlot.style.top = y + "px";

}, { passive: false }); // importante

document.addEventListener("pointerup", (e) => {
    if (!activeSlot) return;

    if (activeSlot.hasPointerCapture(e.pointerId)) {
        activeSlot.releasePointerCapture(e.pointerId);
    }

    document.body.classList.remove("dragging");

    if (fieldMode === "free") {
        const slotId = activeSlot.dataset.slot;

        freePositions[slotId] = {
            x: parseInt(activeSlot.style.left) || 0,
            y: parseInt(activeSlot.style.top) || 0
        };

        const player = gameState.selectedPlayers[slotId];
        if (player) {
            player.x = parseInt(activeSlot.style.left) || 0;
            player.y = parseInt(activeSlot.style.top) || 0;
        }
    }

    activeSlot = null;

});

// pointercancel só reseta activeSlot, não remove a classe
document.addEventListener("pointercancel", () => {
    activeSlot = null;
});


// ===============================
// SWITCH BUTTOM
// ===============================

const toggleButton = document.getElementById("toggleView");

toggleButton.addEventListener("click", () => {

    showPlayerImages = !showPlayerImages;

    updateAllSlots();
});

function updateAllSlots() {

    document.querySelectorAll(".position-slot").forEach(slot => {

        const slotId = slot.dataset.slot;
        const player = gameState.selectedPlayers[slotId];

        slot.classList.remove("slot-green", "filled-slot");

        if (player) {

            if (showPlayerImages) {

                slot.innerHTML = `<img src="${player.photo}" class="slot-image player-token">`;
                slot.classList.add("filled-slot");

                // Se Free Mode, aplica posição salva
                // if (fieldMode === "free" && player.x !== undefined && player.y !== undefined) {
                //     slot.style.position = "absolute";
                //     slot.style.left = player.x + "px";
                //     slot.style.top = player.y + "px";
                // } else {
                //     slot.style.position = "";
                //     slot.style.left = "";
                //     slot.style.top = "";
                // }

            } else {
                // GREEN
                slot.innerHTML = slot.dataset.position;
                slot.classList.add("slot-green");
            }

        } else {
            // SLOT VAZIO
            slot.innerHTML = slot.dataset.position;
            slot.style.position = "";
            // slot.style.left = "";
            // slot.style.top = "";
        }
    });
}

function applyFreePositions() {

    if (fieldMode !== "free") return;

    document.querySelectorAll(".position-slot").forEach(slot => {

        const slotId = slot.dataset.slot;
        const player = gameState.selectedPlayers[slotId];

        if (player && player.x !== undefined && player.y !== undefined) {
            slot.style.position = "absolute";
            slot.style.left = player.x + "px";
            slot.style.top = player.y + "px";
        }

    });
}

// ===============================
// SAVE
// ===============================
// const saveButton = document.getElementById("saveMatchup");

// saveButton.addEventListener("click", saveMatchup);

function saveMatchup(redirect = "saved") {

    if (!gameState.teamA || !gameState.teamB) {
        showTopMessage("Select both teams first.");
        return;
    }

    const matchups =
        JSON.parse(localStorage.getItem("nflMatchups")) || [];

    const editId = localStorage.getItem("editMatchupId");

    if (editId) {

        const index = matchups.findIndex(m => m.id == Number(editId));

        if (index !== -1) {

            matchups[index] = {
                ...matchups[index],
                teamA: gameState.teamA.name,
                teamB: gameState.teamB.name,
                players: gameState.selectedPlayers,
                fieldMode: fieldMode,
                freePositions: freePositions,
                updatedAt: new Date().toLocaleString()
            };

        }

        localStorage.removeItem("editMatchupId");

        showTopMessage("Matchup updated!");

    } else {

        const newMatchup = {
            id: Date.now(),
            teamA: gameState.teamA.name,
            teamB: gameState.teamB.name,
            players: gameState.selectedPlayers,
            fieldMode: fieldMode,
            freePositions: freePositions,
            createdAt: new Date().toLocaleString()
        };

        matchups.push(newMatchup);

        showTopMessage("Matchup saved!");
    }

    localStorage.setItem("nflMatchups", JSON.stringify(matchups));

    // IMPORTANT
    if (redirect === "saved") {
        window.location.href = "saved.html";
    } else {
        window.location.href = "matchup.html";
    }
}



// =======================
// EDIT MODE
// =======================

function loadMatchupForEdit(id) {

    const matchups =
        JSON.parse(localStorage.getItem("nflMatchups")) || [];

    const matchup = matchups.find(m => m.id == id);

    if (!matchup) return;

    // Restaurar times
    gameState.teamA = teamsData.find(t => t.name === matchup.teamA);
    gameState.teamB = teamsData.find(t => t.name === matchup.teamB);

    if (!gameState.teamA || !gameState.teamB) return;

    // Atualizar selects
    teamASelect.value = gameState.teamA.id;
    teamBSelect.value = gameState.teamB.id;

    // Bloquear alteração
    teamASelect.disabled = true;
    teamBSelect.disabled = true;

    // Restaurar jogadores
    gameState.selectedPlayers = { ...matchup.players };



    // Restaurar fieldMode se quiser manter o modo salvo
    if (matchup.fieldMode) {
        fieldMode = matchup.fieldMode;
        fieldModeSelect.value = matchup.fieldMode;
    }

    // 🔥 Restaurar posições livres
    if (matchup.freePositions) {
        freePositions = { ...matchup.freePositions };
    }

    // Atualizar interface
    updateAllSlots();
    updateRoster();
    updateStats();

    if (fieldMode === "free") {
        applyFreePositions();
    }
}


// DELETE
function deleteMatchup(id) {

    if (!confirm("Are you sure you want to delete this matchup?")) {
        return;
    }

    let matchups =
        JSON.parse(localStorage.getItem("nflMatchups")) || [];

    matchups = matchups.filter(m => m.id !== Number(id));

    localStorage.setItem("nflMatchups", JSON.stringify(matchups));

    loadMatchups();
}