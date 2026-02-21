// ── 25 Most Popular Animals ──
const ANIMALS = [
    { name: "Perro", emoji: "🐶" },
    { name: "Gato", emoji: "🐱" },
    { name: "León", emoji: "🦁" },
    { name: "Elefante", emoji: "🐘" },
    { name: "Delfín", emoji: "🐬" },
    { name: "Lobo", emoji: "🐺" },
    { name: "Caballo", emoji: "🐴" },
    { name: "Tigre", emoji: "🐯" },
    { name: "Panda", emoji: "🐼" },
    { name: "Zorro", emoji: "🦊" },
    { name: "Koala", emoji: "🐨" },
    { name: "Conejo", emoji: "🐰" },
    { name: "Oso", emoji: "🐻" },
    { name: "Pingüino", emoji: "🐧" },
    { name: "Jirafa", emoji: "🦒" },
    { name: "Gorila", emoji: "🦍" },
    { name: "Cebra", emoji: "🦓" },
    { name: "Pulpo", emoji: "🐙" },
    { name: "Águila", emoji: "🦅" },
    { name: "Cocodrilo", emoji: "🐊" },
    { name: "Ballena", emoji: "🐋" },
    { name: "Leopardo", emoji: "🐆" },
    { name: "Rana", emoji: "🐸" },
    { name: "Mariposa", emoji: "🦋" },
    { name: "Búho", emoji: "🦉" },
];

// ── State ──
const votes = {};
ANIMALS.forEach(a => votes[a.name] = 0);

let currentPair = [null, null]; // { name, emoji }

// ── Utilities ──
function getRandom(exclude = []) {
    const pool = ANIMALS.filter(a => !exclude.includes(a.name));
    return pool[Math.floor(Math.random() * pool.length)];
}

function getNewPair() {
    const a = getRandom();
    const b = getRandom([a.name]);
    return [a, b];
}

function totalVotes() {
    return Object.values(votes).reduce((s, v) => s + v, 0);
}

// ── Render card content (without animation) ──
function renderCard(side, animal) {
    document.getElementById(`emoji-${side}`).textContent = animal.emoji;
    document.getElementById(`name-${side}`).textContent = animal.name;
    updateBar(side);
}

function updateBar(side) {
    const animalName = currentPair[side === 'left' ? 0 : 1].name;
    const total = totalVotes();
    const animalVotes = votes[animalName];
    const pct = total > 0 ? Math.round((animalVotes / total) * 100) : 0;
    document.getElementById(`bar-${side}`).style.width = pct + '%';
    const vLabel = animalVotes === 1 ? '1 voto' : `${animalVotes} votos`;
    document.getElementById(`count-${side}`).textContent = vLabel;
}

// ── Initial load ──
function initRound() {
    currentPair = getNewPair();
    renderCard('left', currentPair[0]);
    renderCard('right', currentPair[1]);
    renderScoreboard();
}

// ── Vote handler ──
function vote(side) {
    const winnerIndex = side === 'left' ? 0 : 1;
    const loserSide = side === 'left' ? 'right' : 'left';
    const loserIndex = side === 'left' ? 1 : 0;

    // Record vote
    votes[currentPair[winnerIndex].name]++;

    // Disable buttons during animation
    document.getElementById('btn-left').disabled = true;
    document.getElementById('btn-right').disabled = true;

    // Winner pulse glow
    const winnerCard = document.getElementById(`card-${side}`);
    winnerCard.classList.add('winner-pulse');

    // Update winner bar immediately
    updateBar(side);

    // Loser card flies out
    const loserCard = document.getElementById(`card-${loserSide}`);
    loserCard.classList.add('fly-out');

    setTimeout(() => {
        loserCard.classList.remove('fly-out');
        winnerCard.classList.remove('winner-pulse');

        // Pick a new animal for the loser side (not same as winner)
        const newAnimal = getRandom([currentPair[winnerIndex].name]);
        currentPair[loserIndex] = newAnimal;

        // Apply content without animation first (hidden via fly-in start)
        renderCard(loserSide, newAnimal);

        // Trigger fly-in
        loserCard.classList.add('fly-in');

        loserCard.addEventListener('animationend', () => {
            loserCard.classList.remove('fly-in');
            document.getElementById('btn-left').disabled = false;
            document.getElementById('btn-right').disabled = false;
            renderScoreboard();
        }, { once: true });

    }, 430);
}

// ── Scoreboard ──
function renderScoreboard() {
    const sorted = [...ANIMALS].sort((a, b) => votes[b.name] - votes[a.name]);
    const grid = document.getElementById('scores-grid');
    grid.innerHTML = '';

    sorted.forEach((animal, idx) => {
        const div = document.createElement('div');
        div.className = 'score-item' + (idx === 0 ? ' rank-1' : idx === 1 ? ' rank-2' : idx === 2 ? ' rank-3' : '');
        const medal = idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '';
        const vLabel = votes[animal.name] === 1 ? '1 voto' : `${votes[animal.name]} votos`;
        div.innerHTML = `
      <span class="si-emoji">${animal.emoji}</span>
      <div class="si-info">
        <div class="si-name">${medal}${animal.name}</div>
        <div class="si-votes">${vLabel}</div>
      </div>`;
        grid.appendChild(div);
    });
}

// ── Boot ──
initRound();
