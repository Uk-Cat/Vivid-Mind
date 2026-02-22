// Global Configuration for VividMind
const CONFIG = {
    // Database table names
    TABLES: {
        USERS: 'VividMind',
        FLASHCARDS: 'Flashcards'
    },
    
    // Form element IDs
    FORM_FIELDS: {
        SET_NAME: 'setName',
        FRONT_TEXT: 'frontText',
        BACK_TEXT: 'backText'
    },
    
    // UI element IDs
    UI_ELEMENTS: {
        WELCOME_TITLE: 'welcomeTitle',
        CARDS_CONTAINER: 'cardsContainer',
        LOGOUT_BTN: 'btn-logout'
    },
    
    // LocalStorage keys
    STORAGE_KEYS: {
        USER: 'vividmind_user'
    },
    
    // User object email property
    USER_EMAIL_FIELD: 'email',
    
    // Redirect URLs
    REDIRECTS: {
        LOGIN: 'Login/Login.html',
        INDEX: '../index.html',
        SETTINGS: '../Settings/settings.html'
    },
    
    // Messages
    MESSAGES: {
        FILL_ALL_FIELDS: 'Please fill in all fields: Set Name, Front, and Back',
        USER_NOT_LOGGED_IN: 'User not logged in',
        SAVE_SUCCESS: 'Flashcard saved!',
        NO_CARDS: 'No flashcards yet. Create one above to get started!',
        LOADING: 'Loading flashcards...'
    }
};
