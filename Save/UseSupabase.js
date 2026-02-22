// Initialize Supabase
// Note: CONFIG should be loaded before this file
const SUPABASE_URL = 'https://newsivpyvfnkthnxiyxk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ld3NpdnB5dmZua3RobnhpeXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjY2MzEsImV4cCI6MjA4NjQwMjYzMX0.ytNvFv1AaT_9-K3l2_LdynlvYs9OieLdqpQyd3PMCEU';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Save user to Supabase
async function saveUserToSupabase(userObject) {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabaseClient
        .from(CONFIG.TABLES.USERS)
        .select('*')
        .eq('Email', userObject.email)
        .single();

    let error = null;
    
    if (existingUser) {
        // User exists, do nothing or update if needed
        console.log('User already exists:', existingUser);
    } else {
        // User doesn't exist, insert new user
        const { data, error: insertError } = await supabaseClient
            .from(CONFIG.TABLES.USERS)
            .insert({
                Email: userObject.email,
                Name: userObject.name,
                Google_ID: userObject.sub
            });
        error = insertError;
    }

    if (error) {
        console.error('Error saving to Supabase:', error);
        return { success: false, error: error };
    } else {
        console.log('User processed successfully');
        return { success: true };
    }
}

// Toggle Public status for a flashcard set
async function toggleSetPublic(setName, makePublic) {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        const { error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .update({ Public: makePublic })
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName);
        
        if (error) {
            console.error('Error toggling public status:', error);
            return { success: false, error };
        }
        
        return { success: true };
    } catch (e) {
        console.error('Error:', e);
        return { success: false, error: e };
    }
}

// Delete an entire flashcard set
async function deleteFlashcardSet(setName) {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        // First, get the set to find images to delete
        const { data: setData, error: fetchError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('Cards')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName)
            .single();
        
        if (setData && setData.Cards && setData.Cards.cards) {
            // Delete associated images
            for (const card of setData.Cards.cards) {
                if (card.frontImage) {
                    const frontPath = card.frontImage.split('/').pop();
                    await supabaseClient.storage.from('FlashCard Photos').remove([`${userObject[CONFIG.USER_EMAIL_FIELD]}/${setName}/${frontPath}`]);
                }
                if (card.backImage) {
                    const backPath = card.backImage.split('/').pop();
                    await supabaseClient.storage.from('FlashCard Photos').remove([`${userObject[CONFIG.USER_EMAIL_FIELD]}/${setName}/${backPath}`]);
                }
            }
        }
        
        // Delete the set
        const { error: deleteError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .delete()
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName);
        
        if (deleteError) {
            console.error('Error deleting set:', deleteError);
            return { success: false, error: deleteError };
        }
        
        return { success: true };
    } catch (e) {
        console.error('Error:', e);
        return { success: false, error: e };
    }
}

// Delete a specific card from a set
async function deleteCardFromSet(setName, cardId) {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        // Get the set
        const { data: setData, error: fetchError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, Cards')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName)
            .single();
        
        if (!setData) {
            return { success: false, error: 'Set not found' };
        }
        
        // Find the card and delete its images
        const cardsData = setData.Cards || { cards: [] };
        const cardToDelete = cardsData.cards.find(c => c.id === cardId);
        
        if (cardToDelete) {
            if (cardToDelete.frontImage) {
                const frontPath = cardToDelete.frontImage.split('/').pop();
                await supabaseClient.storage.from('FlashCard Photos').remove([`${userObject[CONFIG.USER_EMAIL_FIELD]}/${setName}/${frontPath}`]);
            }
            if (cardToDelete.backImage) {
                const backPath = cardToDelete.backImage.split('/').pop();
                await supabaseClient.storage.from('FlashCard Photos').remove([`${userObject[CONFIG.USER_EMAIL_FIELD]}/${setName}/${backPath}`]);
            }
        }
        
        // Remove card from array
        cardsData.cards = cardsData.cards.filter(c => c.id !== cardId);
        
        // Update the set
        const { error: updateError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .update({ Cards: cardsData })
            .eq('id', setData.id);
        
        if (updateError) {
            console.error('Error deleting card:', updateError);
            return { success: false, error: updateError };
        }
        
        return { success: true };
    } catch (e) {
        console.error('Error:', e);
        return { success: false, error: e };
    }
}

// Update a specific card in a set
async function updateCardInSet(setName, cardId, updatedFrontText, updatedBackText, updatedFrontImage, updatedBackImage) {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return { success: false, error: 'Not logged in' };
    }
    
    try {
        // Get the set
        const { data: setData, error: fetchError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, Cards')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName)
            .single();
        
        if (!setData) {
            return { success: false, error: 'Set not found' };
        }
        
        // Update the card in the array
        const cardsData = setData.Cards || { cards: [] };
        const cardIndex = cardsData.cards.findIndex(c => c.id === cardId);
        
        if (cardIndex === -1) {
            return { success: false, error: 'Card not found' };
        }
        
        cardsData.cards[cardIndex].front = updatedFrontText;
        cardsData.cards[cardIndex].back = updatedBackText;
        
        if (updatedFrontImage) {
            cardsData.cards[cardIndex].frontImage = updatedFrontImage;
        }
        
        if (updatedBackImage) {
            cardsData.cards[cardIndex].backImage = updatedBackImage;
        }
        
        // Update the set
        const { error: updateError } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .update({ Cards: cardsData })
            .eq('id', setData.id);
        
        if (updateError) {
            console.error('Error updating card:', updateError);
            return { success: false, error: updateError };
        }
        
        return { success: true };
    } catch (e) {
        console.error('Error:', e);
        return { success: false, error: e };
    }
}

// Get set details including Public status
async function getSetDetails(setName) {
    if (!userObject || !userObject[CONFIG.USER_EMAIL_FIELD]) {
        console.error(CONFIG.MESSAGES.USER_NOT_LOGGED_IN);
        return null;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, UUID, Set_name, Cards, Public')
            .eq('Email', userObject[CONFIG.USER_EMAIL_FIELD])
            .eq('Set_name', setName)
            .single();
        
        if (error) {
            console.error('Error fetching set details:', error);
            return null;
        }
        
        return data;
    } catch (e) {
        console.error('Error:', e);
        return null;
    }
}

// ============================================
// USER SETTINGS & PROFILE MANAGEMENT
// ============================================

// Debug utilities for schema cache errors
const SupabaseDebug = {
    logError: (functionName, error) => {
        console.group(`🔴 Supabase Error in ${functionName}`);
        console.error('Error Message:', error?.message || error);
        console.error('Error Code:', error?.code);
        console.error('Error Status:', error?.status);
        console.error('Full Error:', error);
        console.groupEnd();
    },
    
    logSuccess: (functionName, data) => {
        console.group(`🟢 Success: ${functionName}`);
        console.log('Data returned:', data);
        console.groupEnd();
    },
    
    checkTableAccess: async () => {
        console.group('🔍 Checking Supabase Table Access');
        try {
            const { data: vividmindData, error: vividmindError } = await supabaseClient
                .from('VividMind')
                .select('*')
                .limit(1);
            
            if (vividmindError) {
                console.error('❌ VividMind table ERROR:', vividmindError.message);
                console.error('   Code:', vividmindError.code);
                console.error('   Status:', vividmindError.status);
            } else {
                console.log('✅ VividMind table is accessible');
                console.log('   Sample data:', vividmindData);
            }
        } catch (e) {
            console.error('❌ Exception checking VividMind table:', e.message);
        }
        console.groupEnd();
    }
};

// Save or update user settings/profile
async function saveUserSettings(email, preferredName) {
    const functionName = 'saveUserSettings';
    
    if (!email || !preferredName) {
        console.error(`${functionName}: Missing required parameters (email, preferredName)`);
        return {
            success: false,
            error: 'Missing required parameters',
            message: 'Email and preferred name are required'
        };
    }
    
    try {
        console.log(`${functionName}: Starting save for email=${email}`);
        
        // First, try to fetch existing profile
        console.log(`${functionName}: Checking if profile exists...`);
        const { data: existingProfile, error: fetchError } = await supabaseClient
            .from('VividMind')
            .select('*')
            .eq('Email', email)
            .maybeSingle(); // Using maybeSingle to avoid error if no rows exist
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine
            SupabaseDebug.logError(functionName, fetchError);
            
            // If it's a schema cache error, provide helpful info
            if (fetchError.message?.includes('schema cache') || fetchError.code === 'PGRST301') {
                return {
                    success: false,
                    error: 'Table not found in database',
                    message: 'The VividMind table does not exist or is not accessible in your Supabase database. Please verify the table exists and RLS policies are configured.',
                    code: 'SCHEMA_CACHE_ERROR',
                    debugInfo: {
                        message: fetchError.message,
                        code: fetchError.code,
                        status: fetchError.status
                    }
                };
            }
            
            return {
                success: false,
                error: fetchError.message,
                message: 'Failed to check if profile exists',
                debugInfo: fetchError
            };
        }
        
        let result;
        
        if (existingProfile) {
            // Profile exists - UPDATE
            console.log(`${functionName}: Profile exists, updating...`);
            result = await supabaseClient
                .from('VividMind')
                .update({ 
                    "Prefered Name": preferredName
                })
                .eq('Email', email)
                .select()
                .single();
        } else {
            // Profile doesn't exist - INSERT
            console.log(`${functionName}: Profile doesn't exist, creating...`);
            result = await supabaseClient
                .from('VividMind')
                .insert({
                    Email: email,
                    "Prefered Name": preferredName
                })
                .select()
                .single();
        }
        
        if (result.error) {
            SupabaseDebug.logError(functionName, result.error);
            
            // Handle schema cache or permission errors
            if (result.error.message?.includes('schema cache') || result.error.code === 'PGRST301') {
                return {
                    success: false,
                    error: 'Database access error',
                    message: 'Could not access VividMind table. Please ensure the table is created and RLS policies are configured.',
                    code: 'SCHEMA_CACHE_ERROR',
                    debugInfo: {
                        message: result.error.message,
                        code: result.error.code,
                        status: result.error.status
                    }
                };
            }
            
            // Permission denied usually means RLS policy issue
            if (result.error.message?.includes('permission denied')) {
                return {
                    success: false,
                    error: 'Permission denied',
                    message: 'RLS policy is blocking access. Verify that policies are configured correctly for anon users.',
                    code: 'RLS_ERROR',
                    debugInfo: {
                        message: result.error.message,
                        code: result.error.code,
                        status: result.error.status
                    }
                };
            }
            
            return {
                success: false,
                error: result.error.message,
                message: 'Failed to save profile',
                debugInfo: result.error
            };
        }
        
        SupabaseDebug.logSuccess(functionName, result.data);
        
        return {
            success: true,
            message: 'Profile saved successfully',
            data: result.data
        };
        
    } catch (e) {
        console.error(`${functionName}: Unexpected error:`, e);
        return {
            success: false,
            error: e.message,
            message: 'An unexpected error occurred while saving profile',
            debugInfo: {
                message: e.message,
                stack: e.stack
            }
        };
    }
}

// Load user profile settings
async function loadUserSettings(email) {
    const functionName = 'loadUserSettings';
    
    if (!email) {
        console.error(`${functionName}: Missing required parameter (email)`);
        return { success: false, error: 'Email is required' };
    }
    
    try {
        console.log(`${functionName}: Loading profile for email=${email}`);
        
        const { data, error } = await supabaseClient
            .from('VividMind')
            .select('*')
            .eq('Email', email)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            SupabaseDebug.logError(functionName, error);
            
            if (error.message?.includes('schema cache') || error.code === 'PGRST301') {
                return {
                    success: false,
                    error: 'Table not found',
                    message: 'The VividMind table does not exist or is not accessible. Please verify your Supabase configuration.'
                };
            }
            
            return { success: false, error: error.message };
        }
        
        if (data) {
            SupabaseDebug.logSuccess(functionName, data);
            return {
                success: true,
                data: data
            };
        }
        
        // No profile found - return empty/default
        return {
            success: true,
            data: null,
            message: 'No profile found, profile will be created on first save'
        };
        
    } catch (e) {
        console.error(`${functionName}: Unexpected error:`, e);
        return {
            success: false,
            error: e.message,
            debugInfo: e
        };
    }
}

// Load a shared card by UUID
async function loadSharedCard(cardUUID) {
    try {
        const { data, error } = await supabaseClient
            .from(CONFIG.TABLES.FLASHCARDS)
            .select('id, UUID, Set_name, Cards, Public, Email')
            .eq('UUID', cardUUID)
            .single();
        
        if (error || !data) {
            console.error('Error loading shared card:', error);
            displaySharedCardError('Flashcard not found or has been removed.');
            return null;
        }
        
        // Check if the set is public
        if (!data.Public) {
            displaySharedCardError('This flashcard set is private and cannot be shared.');
            return null;
        }
        
        // Display the shared card
        displaySharedCard(data);
        return data;
    } catch (e) {
        console.error('Error loading shared card:', e);
        displaySharedCardError('Failed to load flashcard. Please try again.');
        return null;
    }
}

// Display a shared card in the shared view container
function displaySharedCard(cardData) {
    const sharedCardView = document.getElementById('sharedCardView');
    const sharedCardDiv = document.getElementById('sharedCard');
    const sharedSetName = document.getElementById('sharedSetName');
    
    if (!sharedCardView || !sharedCardDiv) {
        console.error('Shared card container not found');
        return;
    }
    
    // Update set name
    if (sharedSetName) {
        sharedSetName.textContent = `Flashcard Set: ${escapeHtml(cardData.Set_name)}`;
    }
    
    // Extract cards array from the Cards JSONB object
    let cardsArray = [];
    if (cardData.Cards) {
        // Cards might be stored as { cards: [...] } or directly as array
        cardsArray = Array.isArray(cardData.Cards) ? cardData.Cards : (cardData.Cards.cards || []);
    }
    
    // Display the cards
    if (cardsArray && cardsArray.length > 0) {
        // Display as a list
        let cardsHTML = '<div class="shared-cards-list">';
        
        cardsArray.forEach((card, index) => {
            let frontText = 'Question';
            let backText = 'Answer';
            let frontImageSrc = '';
            
            if (Array.isArray(card)) {
                // Array format: ["front", "back"]
                frontText = card[0] || 'Question';
                backText = card[1] || 'Answer';
            } else if (typeof card === 'object' && card !== null) {
                // Object format - try multiple property names
                frontText = card.front || card.question || 'Question';
                backText = card.back || card.answer || 'Answer';
                frontImageSrc = card.frontImage || card.image || '';
            }
            
            cardsHTML += `
                <div class="shared-card-item" data-index="${index}">
                    <div class="card-front">
                        <h3>${escapeHtml(frontText)}</h3>
                        ${frontImageSrc ? `<img src="${escapeHtml(frontImageSrc)}" alt="Card front" class="shared-card-image">` : ''}
                    </div>
                    <div class="card-back">
                        <p>${escapeHtml(backText)}</p>
                    </div>
                </div>
            `;
        });
        
        cardsHTML += '</div>';
        sharedCardDiv.innerHTML = cardsHTML;
    } else {
        sharedCardDiv.innerHTML = '<p class="error-message">No cards found in this set.</p>';
    }
    
    // Show the shared card view
    sharedCardView.style.display = 'flex';
    
    // Hide dashboard elements
    const container = document.querySelector('.container');
    const sidebar = document.getElementById('sidebar');
    if (container) container.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
}

// Display error message in shared card view
function displaySharedCardError(message) {
    const sharedCardView = document.getElementById('sharedCardView');
    const sharedCardDiv = document.getElementById('sharedCard');
    
    if (!sharedCardView || !sharedCardDiv) {
        console.error('Shared card container not found');
        return;
    }
    
    sharedCardDiv.innerHTML = `
        <div class="error-message">
            <h2>Access Denied</h2>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    
    sharedCardView.style.display = 'flex';
    
    // Hide dashboard elements
    const container = document.querySelector('.container');
    const sidebar = document.getElementById('sidebar');
    if (container) container.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
}

// Utility function to trigger debug checks
async function debugSupabaseConnection() {
    console.clear();
    console.log('%c🚀 VividMind Supabase Debug Report', 'font-size: 16px; font-weight: bold; color: #4255FF;');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Client:', supabaseClient ? '✅ Initialized' : '❌ Not initialized');
    
    await SupabaseDebug.checkTableAccess();
}