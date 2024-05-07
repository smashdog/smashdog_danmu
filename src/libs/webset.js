export function webset() {
  document.addEventListener('contextmenu', function(event) {
      event.preventDefault()
  })
  document.addEventListener('keydown', function(event) {
    // Prevent F5 or Ctrl+R (Windows/Linux) and Command+R (Mac) from refreshing the page
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
      event.preventDefault()
    }
  })
}