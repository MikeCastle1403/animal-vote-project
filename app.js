// ── Supabase Configuration ──
// TODO: Replace with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = 'https://bqtfbuapthewnvtwtbjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdGZidWFwdGhld252dHd0YmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDA0MDAsImV4cCI6MjA4NzQ3NjQwMH0.raSoWzsTDqpexu8vUplkjXyMB6dsjRgDai26Eye7tc8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isLoginMode = true; // Track whether user is logging in or signing up
let currentUser = null;

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
// Use database to keep track. We define this just to keep tracking state during fetch, 
// though we'll update it from the DB.
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
async function initRound() {
    currentPair = getNewPair();
    renderCard('left', currentPair[0]);
    renderCard('right', currentPair[1]);
    await fetchVotes(); // Load true votes from Supabase
    renderScoreboard();
}

// ── Vote handler ──
function vote(side) {
    const winnerIndex = side === 'left' ? 0 : 1;
    const loserSide = side === 'left' ? 'right' : 'left';
    const loserIndex = side === 'left' ? 1 : 0;

    const winnerName = currentPair[winnerIndex].name;

    // Record vote locally for instant feedback
    votes[winnerName]++;

    // Save vote to Supabase
    saveVote(winnerName);

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

// ── Database (Supabase) Logic ──
async function fetchVotes() {
    try {
        const { data, error } = await supabase
            .from('animal_votes')
            .select('name, votes');

        if (error) {
            console.error('Error fetching votes:', error);
            return;
        }

        if (data) {
            data.forEach(row => {
                if (votes[row.name] !== undefined) {
                    votes[row.name] = row.votes;
                }
            });
            // Update UI after fetching
            updateBar('left');
            updateBar('right');
            renderScoreboard();
        }
    } catch (error) {
        console.error('Exception fetching votes:', error);
    }
}

async function saveVote(animalName) {
    try {
        // Find existing vote count to increment
        const { data: existingData, error: fetchError } = await supabase
            .from('animal_votes')
            .select('votes')
            .eq('name', animalName)
            .single();

        if (fetchError) {
            console.error('Error fetching vote to update:', fetchError);
            return;
        }

        const newCount = (existingData?.votes || 0) + 1;

        const { error: updateError } = await supabase
            .from('animal_votes')
            .update({ votes: newCount })
            .eq('name', animalName);

        if (updateError) {
            console.error('Error updating vote:', updateError);
        }
    } catch (error) {
        console.error('Exception saving vote:', error);
    }
}

// ── Auth Logic ──
function toggleAuthMode(e) {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').textContent = isLoginMode ? 'Iniciar Sesión' : 'Registrarse';
    document.getElementById('auth-toggle-link').textContent = isLoginMode ? 'Regístrate' : 'Inicia Sesión';
    document.getElementById('auth-title').previousSibling.textContent = isLoginMode ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '; // Update the text before the link
    const pTag = document.getElementById('auth-toggle-link').parentElement;
    pTag.innerHTML = isLoginMode
        ? '¿No tienes cuenta? <a href="#" onclick="toggleAuthMode(event)" id="auth-toggle-link">Regístrate</a>'
        : '¿Ya tienes cuenta? <a href="#" onclick="toggleAuthMode(event)" id="auth-toggle-link">Inicia Sesión</a>';
}

async function handleAuth(e) {
    e.preventDefault();

    // Check if placeholders are still present
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        showAuthError("Please configure SUPABASE_URL and SUPABASE_ANON_KEY in app.js");
        return;
    }

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.querySelector('#auth-form button');

    btn.disabled = true;
    btn.textContent = 'Cargando...';
    hideAuthError();

    let result;
    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({ email, password });
    } else {
        result = await supabase.auth.signUp({ email, password });
    }

    const { data, error } = result;

    btn.disabled = false;
    btn.textContent = 'Entrar';

    if (error) {
        showAuthError(error.message);
    } else {
        // Success
        if (!isLoginMode && data.user && !data.session) {
            showAuthError("Please check your email to verify your account.");
            return;
        }
        document.getElementById('auth-form').reset();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
}

function showAuthError(message) {
    const errDiv = document.getElementById('auth-error');
    errDiv.textContent = message;
    errDiv.style.display = 'block';
}

function hideAuthError() {
    const errDiv = document.getElementById('auth-error');
    errDiv.style.display = 'none';
}

// ── App State Management ──
supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;

    const authSection = document.getElementById('auth-section');
    const appContent = document.getElementById('app-content');
    const logoutBtn = document.getElementById('logout-btn');

    if (currentUser) {
        // Logged In
        authSection.style.display = 'none';
        appContent.style.display = 'block';
        logoutBtn.style.display = 'block';
        // Initialize once logged in
        initRound();
    } else {
        // Logged Out
        authSection.style.display = 'flex';
        appContent.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
});
