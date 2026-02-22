// Study Mode JavaScript
let studySets = [];
let currentSetIndex = -1;
let currentCardIndex = 0;
let allCards = [];
let userObject = null;

// Initialize study mode
window.onload = async function() {
    const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (!savedUser) {
        window.location.href = CONFIG.REDIRECTS.LOGIN;
        return;
    }
    
    userObject = JSON.parse(savedUser);
    
    // Load sets
    await loadStudySets();
    
    // Check if a specific set was requested via URL parameter
    const params = new URLSearchParams(window.location.search);
    const requestedSet = params.get('set');
    if (requestedSet) {
        setTimeout(() => {
            startStudySession(requestedSet);
        }, 500); // Small delay to ensure sets are loaded
    }
};

// Load all sets for study selection
async function loadStudySets() {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        return;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('Set_name')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD]);
        
        if (error) {
            console.error('Error loading sets:', error);
            return;
        }
        
        studySets = data.map(row => row.Set_name).sort();
        displaySetSelector();
        
    } catch (e) {
        console.error('Error:', e);
    }
}

// Display set selector
function displaySetSelector() {
    const setButtonsContainer = document.getElementById('setButtonsStudy');
    setButtonsContainer.innerHTML = '';
    
    studySets.forEach(setName => {
        const btn = document.createElement('button');
        btn.className = 'btn-set';
        btn.textContent = setName;
        btn.onclick = () => startStudySession(setName);
        setButtonsContainer.appendChild(btn);
    });
    
    document.getElementById('setSelector').style.display = 'block';
}

// Start a study session
async function startStudySession(setName) {
    try {
        // Load cards for this set
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('Cards')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName)
            .single();
        
        if (error) {
            console.error('Error loading cards:', error);
            alert('Failed to load set');
            return;
        }
        
        const cardsData = data.Cards || { cards: [] };
        allCards = cardsData.cards || [];
        
        if (allCards.length === 0) {
            alert('This set has no cards yet');
            return;
        }
        
        currentCardIndex = 0;
        
        // Update UI
        document.getElementById('setSelector').style.display = 'none';
        document.getElementById('studySession').style.display = 'block';
        document.getElementById('completionScreen').style.display = 'none';
        
        document.getElementById('studySetName').textContent = setName;
        document.getElementById('totalCards').textContent = allCards.length;
        
        // Display first card
        displayCard(0);
        
    } catch (e) {
        console.error('Error:', e);
        alert('An error occurred');
    }
}

// Display card
function displayCard(index) {
    if (index < 0 || index >= allCards.length) {
        showCompletion();
        return;
    }
    
    currentCardIndex = index;
    const card = allCards[index];
    
    // Extract front/back from both array and object formats
    let frontText = '';
    let backText = '';
    let frontImageUrl = '';
    let backImageUrl = '';
    
    if (Array.isArray(card)) {
        // Array format: ["front", "back"]
        frontText = card[0] || '';
        backText = card[1] || '';
    } else if (typeof card === 'object' && card !== null) {
        // Object format: {front, back, frontImage, backImage}
        frontText = card.front || '';
        backText = card.back || '';
        frontImageUrl = card.frontImage || '';
        backImageUrl = card.backImage || '';
    }
    
    // Reset flip
    document.getElementById('flipCard').classList.remove('flipped');
    
    // Update front
    const frontImageContainer = document.getElementById('frontImage');
    if (frontImageUrl) {
        frontImageContainer.innerHTML = `<img src="${frontImageUrl}" alt="front" class="card-image">`;
    } else {
        frontImageContainer.innerHTML = '';
    }
    document.getElementById('cardFront').textContent = frontText;
    
    // Update back
    const backImageContainer = document.getElementById('backImage');
    if (backImageUrl) {
        backImageContainer.innerHTML = `<img src="${backImageUrl}" alt="back" class="card-image">`;
    } else {
        backImageContainer.innerHTML = '';
    }
    document.getElementById('cardBack').textContent = backText;
    
    // Update counter and progress
    document.getElementById('currentCard').textContent = index + 1;
    const progress = ((index + 1) / allCards.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    // Update button states
    document.getElementById('prevBtn').disabled = index === 0;
    document.getElementById('nextBtn').disabled = index === allCards.length - 1;
    
    if (index === 0) document.getElementById('prevBtn').style.opacity = '0.5';
    else document.getElementById('prevBtn').style.opacity = '1';
    
    if (index === allCards.length - 1) document.getElementById('nextBtn').style.opacity = '0.5';
    else document.getElementById('nextBtn').style.opacity = '1';
}

// Toggle card flip
function toggleFlip() {
    document.getElementById('flipCard').classList.toggle('flipped');
}

// Previous card
function prevCard() {
    if (currentCardIndex > 0) {
        displayCard(currentCardIndex - 1);
    }
}

// Next card
function nextCard() {
    if (currentCardIndex < allCards.length - 1) {
        displayCard(currentCardIndex + 1);
    } else {
        showCompletion();
    }
}

// Show completion screen
function showCompletion() {
    document.getElementById('studySession').style.display = 'none';
    document.getElementById('completionScreen').style.display = 'block';
}

// Study again (restart from beginning)
function studyAgain() {
    displayCard(0);
    document.getElementById('studySession').style.display = 'block';
    document.getElementById('completionScreen').style.display = 'none';
}

// Exit study session
function exitStudy() {
    if (confirm('Exit study session?')) {
        document.getElementById('studySession').style.display = 'none';
        document.getElementById('setSelector').style.display = 'block';
        document.getElementById('completionScreen').style.display = 'none';
        allCards = [];
        currentCardIndex = 0;
    }
}

// Go back to dashboard
function goBack() {
    window.location.href = '../index.html';
}

// Sidebar Functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// Navigation functions
function goToIndex() {
    window.location.href = '../index.html';
}

function goToSettings() {
    window.location.href = '../Settings/settings.html';
}

function goToLibrary() {
    window.location.href = '../GlobalLibrary.html';
}

function goToStats() {
    alert('Study Stats feature coming soon!');
}

function sidebarLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        window.location.href = CONFIG.REDIRECTS.LOGIN;
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (allCards.length === 0) return;
    
    if (e.key === 'ArrowLeft') prevCard();
    if (e.key === 'ArrowRight') nextCard();
    if (e.key === ' ') {
        e.preventDefault();
        toggleFlip();
    }
});
