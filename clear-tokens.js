// Run this in your browser console to clear old authentication tokens
// This will fix the JWT signature errors

console.log('🔧 Clearing authentication tokens...');

// Clear localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');

// Clear sessionStorage as well (just in case)
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');

// Clear axios default headers
if (typeof axios !== 'undefined' && axios.defaults && axios.defaults.headers) {
  delete axios.defaults.headers.common['Authorization'];
}

console.log('✅ Tokens cleared! Please refresh the page and log in again.');
console.log('🔄 You can now close this console and refresh your browser.');

// Auto refresh after 2 seconds
setTimeout(() => {
  window.location.reload();
}, 2000);
