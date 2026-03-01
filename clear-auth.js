// Clear authentication script
// Open browser console and run this script to fix JWT issues

console.log('🔧 Clearing authentication data...');

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

console.log('✅ All authentication data cleared!');
console.log('🔄 Refreshing page...');

// Refresh the page
window.location.reload();
