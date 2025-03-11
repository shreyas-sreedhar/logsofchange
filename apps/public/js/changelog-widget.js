(function () {
    // Get the script tag that loaded this script
    const script = document.currentScript;
    const changelogId = script.getAttribute('data-id');

    // Find the container element
    const containers = document.querySelectorAll('[id="changelog-container"]');
    if (containers.length === 0) return;

    // We'll use the first container found
    const container = containers[0];

    // Get the base URL from the script src
    const scriptSrc = script.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.indexOf('/js/changelog-widget.js'));

    // Set loading state
    container.innerHTML = '<p>Loading changelog...</p>';

    // Fetch the changelog
    fetch(`${baseUrl}/api/changelog/${changelogId}/public?format=html`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load changelog');
            return response.text();
        })
        .then(html => {
            // Create a DOM parser to extract just the content
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.getElementById('changelog-content');

            if (content) {
                container.innerHTML = '';
                container.appendChild(content);
            } else {
                container.innerHTML = html;
            }

            // Add some basic styling
            const style = document.createElement('style');
            style.textContent = `
        #changelog-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
        }
        #changelog-container h1 { font-size: 1.8em; margin-top: 1em; margin-bottom: 0.5em; }
        #changelog-container h2 { font-size: 1.5em; margin-top: 1em; margin-bottom: 0.5em; }
        #changelog-container h3 { font-size: 1.2em; margin-top: 1em; margin-bottom: 0.5em; }
        #changelog-container ul { padding-left: 1.5em; margin-bottom: 1em; }
        #changelog-container p { margin-bottom: 1em; }
      `;
            document.head.appendChild(style);
        })
        .catch(error => {
            container.innerHTML = `<p style="color: red;">Error loading changelog: ${error.message}</p>`;
        });
})(); 