async function handleCredentialResponse(response) {
    console.log("JWT Token: " + response.credential);
    
    const userObject = parseJwt(response.credential);
    console.log("User data:", userObject);
    
    // Save to Supabase
    const result = await saveUserToSupabase(userObject);
    if (result.success) {
        // Save user to localStorage to remember login
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(userObject));
        console.log("User logged in: " + userObject.name);
        // Redirect to main page immediately after localStorage is set
        window.location.href = CONFIG.REDIRECTS.INDEX;
    } else {
        // Do not redirect if Supabase save fails
        alert("Login failed: " + result.error.message);
    }
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}