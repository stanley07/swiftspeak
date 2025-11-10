export function getUserId() {
    // Check if we're on the server
    if (typeof window === 'undefined') {
      return 'server_user'; // Return a placeholder
    }
  
    // Check if a user ID is already in localStorage
    let userId = localStorage.getItem('swiftspeak_userId');
    
    // If not, create a new one
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('swiftspeak_userId', userId);
    }
    
    return userId;
  }