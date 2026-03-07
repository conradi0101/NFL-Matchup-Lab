document.addEventListener("DOMContentLoaded", loadMatchups);

function loadMatchups() {

    const container = document.getElementById("matchupsContainer");
    const emptyMessage = document.getElementById("emptyMessage");

    const matchups =
        JSON.parse(localStorage.getItem("nflMatchups")) || [];

    if (matchups.length === 0) {

        emptyMessage.classList.remove("d-none");
        return;
    }

    container.innerHTML = "";

    matchups.forEach(matchup => {

        const card = document.createElement("div");
        card.className = "col-md-4";

        card.innerHTML = `
        <div class="card shadow-sm h-100">

            <div class="card-body">

                <h5 class="card-title">
                    ${typeof matchup.teamA === "object"
                        ? matchup.teamA.name
                        : matchup.teamA}
                    vs
                    ${typeof matchup.teamB === "object"
                        ? matchup.teamB.name
                        : matchup.teamB}
                </h5>

                <p class="text-muted small">
                    Saved: ${new Date(matchup.createdAt).toLocaleString()}
                </p>

                <div class="d-flex gap-2 mt-3">

                    <button 
                        class="btn btn-sm btn-primary"
                        onclick="viewMatchup('${matchup.id}')">
                        View
                    </button>

                    <button 
                        class="btn btn-sm btn-warning"
                        onclick="editMatchup('${matchup.id}')">
                        Edit
                    </button>

                    <button 
                        class="btn btn-sm btn-danger"
                        onclick="deleteMatchup('${matchup.id}')">
                        Delete
                    </button>

                </div>

            </div>

        </div>
        `;

        container.appendChild(card);

    });

}

// =======================
// DELETE
// =======================

function deleteMatchup(id) {

    let matchups =
        JSON.parse(localStorage.getItem("nflMatchups")) || [];

    // remover o item
    matchups = matchups.filter(m => m.id !== Number(id));

    // salvar de volta
    localStorage.setItem(
        "nflMatchups",
        JSON.stringify(matchups)
    );

    // atualizar a tela sem reload
    loadMatchups();
}

// =======================
// VIEW
// =======================

function viewMatchup(id) {

    localStorage.setItem("viewMatchupId", id);

    window.location.href = "view.html";

}

// =======================
// EDIT
// =======================

function editMatchup(id) {

    localStorage.setItem("editMatchupId", id);

    window.location.href = "matchup.html?edit=true";

}

// =======================
// SHARE
// =======================

function shareMatchup(id) {
    localStorage.setItem("shareMatchupId", id);

    window.location.href = "share.html";

}
