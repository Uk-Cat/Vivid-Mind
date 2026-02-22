// Global state for current set
let currentSet = null;
let selectedFrontImage = null;
let selectedBackImage = null;

// Generate unique card ID
function generateCardId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


// Handle image selection and preview
function setupImageHandlers() {
    const frontImageInput = document.getElementById('frontImage');
    const backImageInput = document.getElementById('backImage');
    
    if (frontImageInput) {
        frontImageInput.addEventListener('change', (e) => handleImageSelect(e, 'front'));
    }
    if (backImageInput) {
        backImageInput.addEventListener('change', (e) => handleImageSelect(e, 'back'));
    }
}

// Handle image selection
function handleImageSelect(event, side) {
    const file = event.target.files[0];
    const previewId = side === 'front' ? 'frontImagePreview' : 'backImagePreview';
    const previewElement = document.getElementById(previewId);
    
    if (!file) {
        previewElement.innerHTML = '';
        if (side === 'front') selectedFrontImage = null;
        if (side === 'back') selectedBackImage = null;
        return;
    }
    
    // Check file size
    if (file.size > 102400) { // 100KB
        alert('Image must be smaller than 100KB');
        event.target.value = '';
        previewElement.innerHTML = '';
        return;
    }
    
    // Read and preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (side === 'front') selectedFrontImage = { file, width: img.width, height: img.height };
            if (side === 'back') selectedBackImage = { file, width: img.width, height: img.height };
            
            previewElement.innerHTML = `
                <div>
                    <img src="${e.target.result}" alt="preview">
                    <small>${img.width}x${img.height}px</small>
                    <span class="preview-close" onclick="clearImagePreview('${side}')">✕ Remove</span>
                </div>
            `;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Clear image preview
function clearImagePreview(side) {
    const inputId = side === 'front' ? 'frontImage' : 'backImage';
    const previewId = side === 'front' ? 'frontImagePreview' : 'backImagePreview';
    
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).innerHTML = '';
    
    if (side === 'front') selectedFrontImage = null;
    if (side === 'back') selectedBackImage = null;
}

// Resize image canvas-based
async function resizeImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Check if resize is needed
                if (img.width <= 600 && img.height <= 400) {
                    resolve(file); // No resize needed
                    return;
                }
                
                // Resize using canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions (maintain aspect ratio)
                let width = img.width;
                let height = img.height;
                
                if (width > 600) {
                    height = Math.round((height * 600) / width);
                    width = 600;
                }
                if (height > 400) {
                    width = Math.round((width * 400) / height);
                    height = 400;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Upload image to Supabase storage
async function uploadImage(file, cardId, side) {
    try {
        // Resize if needed
        const processedFile = await resizeImage(file);
        
        // Generate unique filename
        const filename = `${userObject[CONFIG.USER_EMAIL_FIELD]}/${currentSet}/${cardId}_${side}.jpg`;
        
        // Upload to storage
        const { error: uploadError } = await supabaseClient
            .storage
            .from('FlashCard Photos')
            .upload(filename, processedFile, { upsert: true });
        
        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return null;
        }
        
        // Get public URL
        const { data } = supabaseClient
            .storage
            .from('FlashCard Photos')
            .getPublicUrl(filename);
        
        return data?.publicUrl || null;
    } catch (e) {
        console.error('Error processing image:', e);
        return null;
    }
}

// Load all existing sets and display them
async function loadExistingSets() {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        return [];
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('Set_name')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD]);
        
        if (error) {
            console.error('Error loading sets:', error);
            return [];
        }
        
        // Get unique set names
        const uniqueSets = (data || []).map(row => row.Set_name).sort();
        displaySetButtons(uniqueSets);
        return uniqueSets;
    } catch (e) {
        console.error('Error:', e);
        return [];
    }
}

// Display set buttons
function displaySetButtons(sets) {
    const setButtonsContainer = document.getElementById('setButtons');
    setButtonsContainer.innerHTML = '';
    
    sets.forEach(setName => {
        const btn = document.createElement('button');
        btn.className = 'set-btn';
        btn.textContent = setName;
        btn.onclick = () => selectSet(setName);
        setButtonsContainer.appendChild(btn);
    });
}

// Select a set for adding cards
function selectSet(setName) {
    currentSet = setName;
    updateSetDisplay();
    
    // Update button styling
    document.querySelectorAll('.set-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === setName) {
            btn.classList.add('active');
        }
    });
    
    // Show form and hide new set input
    document.getElementById('cardFormContainer').style.display = 'block';
    clearCardForm();
}

// Create a new set
function createNewSet() {
    const newSetName = document.getElementById('newSetName').value.trim();
    
    if (!newSetName) {
        alert('Please enter a set name');
        return;
    }
    
    currentSet = newSetName;
    document.getElementById('newSetName').value = '';
    updateSetDisplay();
    
    // Reload set buttons to include the new one
    loadExistingSets();
    
    // Select the new set button
    document.querySelectorAll('.set-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === newSetName) {
            btn.classList.add('active');
        }
    });
    
    // Show form
    document.getElementById('cardFormContainer').style.display = 'block';
    clearCardForm();
}

// Update the current set display
function updateSetDisplay() {
    const display = document.getElementById('currentSetDisplay');
    if (currentSet) {
        document.getElementById('currentSetName').textContent = currentSet;
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
    }
}

// Clear the card form
function clearCardForm() {
    document.getElementById('frontText').value = '';
    document.getElementById('backText').value = '';
    document.getElementById('frontImage').value = '';
    document.getElementById('backImage').value = '';
    document.getElementById('frontImagePreview').innerHTML = '';
    document.getElementById('backImagePreview').innerHTML = '';
    selectedFrontImage = null;
    selectedBackImage = null;
    document.getElementById('frontText').focus();
}

// Save a new flashcard to Supabase
async function saveFlashcardToDatabase(frontText, backText) {
    if (!frontText.trim() || !backText.trim()) {
        alert('Please fill in both Front and Back fields');
        return false;
    }
    
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        alert(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return false;
    }
    
    if (!currentSet) {
        alert('Please select or create a set first');
        return false;
    }
    
    try {
        // Generate card ID for image storage
        const cardId = generateCardId();
        
        // Upload images if selected
        let frontImageUrl = null;
        let backImageUrl = null;
        
        if (selectedFrontImage) {
            frontImageUrl = await uploadImage(selectedFrontImage.file, cardId, 'front');
        }
        
        if (selectedBackImage) {
            backImageUrl = await uploadImage(selectedBackImage.file, cardId, 'back');
        }
        
        // Create card object
        const newCard = {
            id: cardId,
            front: frontText.trim(),
            back: backText.trim(),
            frontImage: frontImageUrl,
            backImage: backImageUrl
        };
        
        // Check if set exists
        const { data: existingSet, error: fetchError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, Cards')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', currentSet)
            .single();
        
        if (existingSet) {
            // Set exists - append card to the Cards JSONB array
            const existingCards = existingSet.Cards || { cards: [] };
            existingCards.cards.push(newCard);
            
            const { error: updateError } = await supabaseClient
                .from(CONFIG.TABLES.FLASHCARDS)
                .update({ Cards: existingCards })
                .eq('id', existingSet.id);
            
            if (updateError) {
                console.error('Error updating cards:', updateError);
                alert('Failed to save flashcard: ' + updateError.message);
                return false;
            }
        } else {
            // Set doesn't exist - create new row with first card
            const newCards = {
                cards: [newCard]
            };
            
            const { error: insertError } = await supabaseClient
                .from(CONFIG.TABLES.FLASHCARDS)
                .insert({
                    Email: userObject[CONFIG.USER_EMAIL_FIELD],
                    Set_name: currentSet,
                    Cards: newCards,
                    Public: false
                    // UUID will be auto-generated by Supabase
                });
            
            if (insertError) {
                console.error('Error inserting set:', insertError);
                alert('Failed to save flashcard: ' + insertError.message);
                return false;
            }
        }
        
        console.log('Flashcard saved successfully');
        return true;
        
    } catch (e) {
        console.error('Error:', e);
        alert('An error occurred: ' + e.message);
        return false;
    }
}

// Save and finish (save and reload cards)
async function saveAndFinish() {
    const frontText = document.getElementById('frontText').value;
    const backText = document.getElementById('backText').value;
    
    const success = await saveFlashcardToDatabase(frontText, backText);
    if (success) {
        clearCardForm();
        await loadAndDisplayUserCards();
        alert(CONFIG.MESSAGES.SAVE_SUCCESS);
    }
}

// Save and add another (keep the set, clear form only)
async function saveAndAddAnother() {
    const frontText = document.getElementById('frontText').value;
    const backText = document.getElementById('backText').value;
    
    const success = await saveFlashcardToDatabase(frontText, backText);
    if (success) {
        clearCardForm();
        await loadAndDisplayUserCards();
    }
}

// Legacy function for backwards compatibility
async function saveNewCard() {
    await saveAndFinish();
}

// Fetch all flashcards for the logged-in user
async function loadUserCards() {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('Set_name, Cards, Public, UUID')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD]);
        
        if (error) {
            console.error('Error loading flashcards:', error);
            return null;
        }
        
        console.log('Flashcard sets loaded:', data);
        
        // Transform data: group by Set_name and flatten cards
        const groupedBySet = {};
        if (data && Array.isArray(data)) {
            data.forEach(row => {
                const setName = row.Set_name;
                
                if (!groupedBySet[setName]) {
                    groupedBySet[setName] = [];
                }
                
                // Handle Cards data - could be array or object with cards property
                let cardsArray = [];
                if (row.Cards) {
                    if (Array.isArray(row.Cards)) {
                        // Direct array format: [["front", "back"], ...]
                        cardsArray = row.Cards;
                    } else if (row.Cards.cards && Array.isArray(row.Cards.cards)) {
                        // Wrapped format: { cards: [...] }
                        cardsArray = row.Cards.cards;
                    }
                }
                
                // Add cards to the set
                cardsArray.forEach(card => {
                    groupedBySet[setName].push(card);
                });
            });
        }
        
        console.log('Grouped cards:', groupedBySet);
        return groupedBySet;
    } catch (e) {
        console.error('Error in loadUserCards:', e);
        return null;
    }
}

// Debug helper: fetch raw rows from Flashcards table for current user
async function fetchRawUserCards() {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error('User not logged in for fetchRawUserCards');
        return null;
    }

    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, Set_name, Cards, Public, UUID')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD]);

        if (error) {
            console.error('Error fetching raw flashcards:', error);
            return null;
        }

        return data || [];
    } catch (e) {
        console.error('Exception in fetchRawUserCards:', e);
        return null;
    }
}

// Load and display user's flashcards on the page
async function loadAndDisplayUserCards() {
    const cardsContainer = document.getElementById(CONFIG.UI_ELEMENTS.CARDS_CONTAINER);
    cardsContainer.innerHTML = '<p>' + CONFIG.MESSAGES.LOADING + '</p>';
    
    const groupedCards = await loadUserCards();
    
    if (!groupedCards || Object.keys(groupedCards).length === 0) {
        cardsContainer.innerHTML = '<p>' + CONFIG.MESSAGES.NO_CARDS + '</p>';
        return;
    }
    
    let html = '';
    
    // Render each set with management controls
    for (const setName of Object.keys(groupedCards)) {
        const setDetails = await getSetDetails(setName);
        const isPublic = setDetails?.Public || false;
        const shareButton = isPublic ? `<button class="set-control-btn share" 
                                       title="Copy share link"
                                       onclick="copyShareLinkUI('${escapeHtml(setName)}')">
                                    📤
                                </button>` : '';
        
        html += `<div class="set-section">
                    <div class="set-header">
                        <div class="set-title">${escapeHtml(setName)}</div>
                        <div class="set-controls">
                            <button class="set-control-btn ${isPublic ? 'public' : 'private'}" 
                                    title="${isPublic ? 'Public' : 'Private'}"
                                    onclick="toggleSetPublicUI('${escapeHtml(setName)}', ${!isPublic})">
                                ${isPublic ? '🌍' : '🔒'}
                            </button>
                            ${shareButton}
                            <button class="set-control-btn delete" onclick="deleteSetUI('${escapeHtml(setName)}')" title="Delete entire set">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="cards-grid">`;
        
        groupedCards[setName].forEach((card) => {
            // Handle both array format [front, back] and object format {front, back, ...}
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
            
            const frontImageHtml = frontImageUrl ? `<img src="${frontImageUrl}" alt="front" style="width: 100%; height: auto; margin-bottom: 10px; border-radius: 4px;">` : '';
            const backImageHtml = backImageUrl ? `<img src="${backImageUrl}" alt="back" style="width: 100%; height: auto; margin-bottom: 10px; border-radius: 4px;">` : '';
            
            html += `<div class="card-wrapper">
                        <div class="card" onclick="this.classList.toggle('flipped')">
                            <div class="card-set-name">${escapeHtml(setName)}</div>
                            <div class="card-front">
                                ${frontImageHtml}
                                ${escapeHtml(frontText)}
                            </div>
                            <div class="card-back">
                                ${backImageHtml}
                                ${escapeHtml(backText)}
                            </div>
                        </div>
                        <div class="card-controls">
                            <button class="card-control-btn edit" onclick="editCardUI('${escapeHtml(setName)}', '${card.id}')" title="Edit card">
                                ✏️
                            </button>
                            <button class="card-control-btn delete" onclick="deleteCardUI('${escapeHtml(setName)}', '${card.id}')" title="Delete card">
                                🗑️
                            </button>
                        </div>
                    </div>`;
        });
        
        html += `</div></div>`;
    }
    
    cardsContainer.innerHTML = html;
}

// Toggle set public status in UI
async function toggleSetPublicUI(setName, makePublic) {
    try {
        const result = await toggleSetPublic(setName, makePublic);
        if (result.success) {
            const statusText = makePublic ? 'Public' : 'Private';
            alert(`Set "${setName}" is now ${statusText}`);
            await loadAndDisplayUserCards();
        } else {
            alert('Failed to update set status');
        }
    } catch (e) {
        console.error('Error:', e);
        alert('An error occurred');
    }
}

// Delete set with confirmation
async function deleteSetUI(setName) {
    if (confirm(`Are you sure you want to delete the entire set "${setName}"? This cannot be undone.`)) {
        try {
            const result = await deleteFlashcardSet(setName);
            if (result.success) {
                alert(`Set "${setName}" has been deleted`);
                // Remove from set buttons
                const btn = Array.from(document.querySelectorAll('.set-btn')).find(b => b.textContent === setName);
                if (btn) btn.remove();
                await loadAndDisplayUserCards();
            } else {
                alert('Failed to delete set');
            }
        } catch (e) {
            console.error('Error:', e);
            alert('An error occurred');
        }
    }
}

// Delete card with confirmation
async function deleteCardUI(setName, cardId) {
    if (confirm('Are you sure you want to delete this card?')) {
        try {
            const result = await deleteCardFromSet(setName, cardId);
            if (result.success) {
                alert('Card has been deleted');
                await loadAndDisplayUserCards();
            } else {
                alert('Failed to delete card');
            }
        } catch (e) {
            console.error('Error:', e);
            alert('An error occurred');
        }
    }
}

// Edit card modal
let editingCardData = null;

async function editCardUI(setName, cardId) {
    try {
        const setDetails = await getSetDetails(setName);
        if (!setDetails) {
            alert('Set not found');
            return;
        }
        
        const card = setDetails.Cards?.cards?.find(c => c.id === cardId);
        if (!card) {
            alert('Card not found');
            return;
        }
        
        editingCardData = { setName, cardId, setDetails };
        showEditCardModal(setName, card);
    } catch (e) {
        console.error('Error:', e);
        alert('Failed to load card for editing');
    }
}

// Show edit card modal
function showEditCardModal(setName, card) {
    // Extract front/back text from both array and object formats
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
    
    const modal = document.createElement('div');
    modal.id = 'editCardModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Card - ${escapeHtml(setName)}</h2>
                <button class="modal-close" onclick="closeEditCardModal()">✕</button>
            </div>
            <form onsubmit="saveEditedCard(event)">
                <div class="form-group">
                    <label for="editFrontText">Front (Question):</label>
                    <textarea id="editFrontText" required>${escapeHtml(frontText)}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="editBackText">Back (Answer):</label>
                    <textarea id="editBackText" required>${escapeHtml(backText)}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Front Image:</label>
                    ${frontImageUrl ? `<div class="existing-image" style="margin-bottom: 10px;">
                        <img src="${frontImageUrl}" alt="front" style="max-width: 100%; max-height: 200px; border-radius: 4px;">
                        <button type="button" onclick="removeExistingImage('front')" style="margin-top: 5px;">Remove Image</button>
                    </div>` : ''}
                    <input type="file" id="editFrontImage" accept="image/*">
                    <small>Max 100KB. Leave empty to keep current image.</small>
                    <div id="editFrontImagePreview" style="margin-top: 10px;"></div>
                </div>
                
                <div class="form-group">
                    <label>Back Image:</label>
                    ${backImageUrl ? `<div class="existing-image" style="margin-bottom: 10px;">
                        <img src="${backImageUrl}" alt="back" style="max-width: 100%; max-height: 200px; border-radius: 4px;">
                        <button type="button" onclick="removeExistingImage('back')" style="margin-top: 5px;">Remove Image</button>
                    </div>` : ''}
                    <input type="file" id="editBackImage" accept="image/*">
                    <small>Max 100KB. Leave empty to keep current image.</small>
                    <div id="editBackImagePreview" style="margin-top: 10px;"></div>
                </div>
                
                <div class="button-group">
                    <button type="submit" class="btn-save">Save Changes</button>
                    <button type="button" class="btn-cancel" onclick="closeEditCardModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Setup image handlers for modal
    const frontImageInput = document.getElementById('editFrontImage');
    const backImageInput = document.getElementById('editBackImage');
    
    if (frontImageInput) {
        frontImageInput.addEventListener('change', (e) => handleEditImageSelect(e, 'front'));
    }
    if (backImageInput) {
        backImageInput.addEventListener('change', (e) => handleEditImageSelect(e, 'back'));
    }
}

// Handle image selection in edit modal
function handleEditImageSelect(event, side) {
    const file = event.target.files[0];
    const previewId = side === 'front' ? 'editFrontImagePreview' : 'editBackImagePreview';
    const previewElement = document.getElementById(previewId);
    
    if (!file) {
        previewElement.innerHTML = '';
        return;
    }
    
    if (file.size > 102400) {
        alert('Image must be smaller than 100KB');
        event.target.value = '';
        previewElement.innerHTML = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            previewElement.innerHTML = `
                <div>
                    <img src="${e.target.result}" alt="preview" style="max-width: 100%; max-height: 200px; border-radius: 4px;">
                    <small>${img.width}x${img.height}px</small>
                </div>
            `;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Remove existing image option
let removeFrontImageFlag = false;
let removeBackImageFlag = false;

function removeExistingImage(side) {
    if (side === 'front') {
        removeFrontImageFlag = true;
    } else {
        removeBackImageFlag = true;
    }
    const existingImg = document.querySelector(`.existing-image`);
    if (existingImg) existingImg.style.display = 'none';
}

// Close edit modal
function closeEditCardModal() {
    const modal = document.getElementById('editCardModal');
    if (modal) {
        modal.remove();
    }
    removeFrontImageFlag = false;
    removeBackImageFlag = false;
}

// Save edited card
async function saveEditedCard(event) {
    event.preventDefault();
    
    if (!editingCardData) {
        alert('Error: Card data not found');
        return;
    }
    
    const frontText = document.getElementById('editFrontText').value.trim();
    const backText = document.getElementById('editBackText').value.trim();
    
    if (!frontText || !backText) {
        alert('Please fill in both front and back fields');
        return;
    }
    
    try {
        let updatedFrontImage = null;
        let updatedBackImage = null;
        
        // Handle front image
        const frontImageInput = document.getElementById('editFrontImage');
        if (frontImageInput && frontImageInput.files[0]) {
            updatedFrontImage = await uploadImage(frontImageInput.files[0], editingCardData.cardId, 'front');
        } else if (removeFrontImageFlag) {
            updatedFrontImage = null;
        }
        
        // Handle back image
        const backImageInput = document.getElementById('editBackImage');
        if (backImageInput && backImageInput.files[0]) {
            updatedBackImage = await uploadImage(backImageInput.files[0], editingCardData.cardId, 'back');
        } else if (removeBackImageFlag) {
            updatedBackImage = null;
        }
        
        const result = await updateCardInSet(
            editingCardData.setName,
            editingCardData.cardId,
            frontText,
            backText,
            updatedFrontImage,
            updatedBackImage
        );
        
        if (result.success) {
            alert('Card has been updated');
            closeEditCardModal();
            await loadAndDisplayUserCards();
        } else {
            alert('Failed to update card');
        }
    } catch (e) {
        console.error('Error:', e);
        alert('An error occurred while saving');
    }
}

// Copy share link for a public set
async function copyShareLinkUI(setName) {
    try {
        const setDetails = await getSetDetails(setName);
        if (!setDetails) {
            alert('Set not found');
            return;
        }
        
        // Check if set is public
        if (!setDetails.Public) {
            alert('Only public sets can be shared. Make this set public first.');
            return;
        }
        
        // Get the UUID (auto-generated by Supabase)
        const cardUUID = setDetails.UUID;
        if (!cardUUID) {
            alert('This flashcard set does not have a UUID yet. Please refresh the page.');
            return;
        }
        
        // Build share URL - change this to your actual domain
        const siteUrl = 'https://vividmind.onrender.com'; // Change to your actual domain
        const shareUrl = `${siteUrl}/card/${cardUUID}`;
        
        // Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert(`Share link copied to clipboard!\n\n${shareUrl}`);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert(`Share link copied to clipboard!\n\n${shareUrl}`);
        }
    } catch (e) {
        console.error('Error copying share link:', e);
        alert('Failed to copy share link');
    }
}

// Utility function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
