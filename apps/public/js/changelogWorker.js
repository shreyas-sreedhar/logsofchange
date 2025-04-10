// changelogWorker.js
self.onmessage = function (event) {
    const { type, data } = event.data;

    switch (type) {
        case 'PROCESS_CHANGELOGS':
            processChangelogs(data);
            break;
        case 'FILTER_CHANGELOGS':
            filterChangelogs(data);
            break;
        case 'SORT_CHANGELOGS':
            sortChangelogs(data);
            break;
        default:
            self.postMessage({ error: 'Unknown message type' });
    }
};

function processChangelogs(changelogs) {
    try {
        // Process and transform changelog data
        const processedChangelogs = changelogs.map(changelog => ({
            ...changelog,
            formattedDate: new Date(changelog.created_at).toLocaleDateString(),
            status: determineStatus(changelog),
            // Add any other processing you need
        }));

        self.postMessage({
            type: 'PROCESSED_CHANGELOGS',
            data: processedChangelogs
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
}

function filterChangelogs({ changelogs, filters }) {
    try {
        const filteredChangelogs = changelogs.filter(changelog => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                return changelog[key] === value;
            });
        });

        self.postMessage({
            type: 'FILTERED_CHANGELOGS',
            data: filteredChangelogs
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
}

function sortChangelogs({ changelogs, sortBy, sortOrder }) {
    try {
        const sortedChangelogs = [...changelogs].sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        self.postMessage({
            type: 'SORTED_CHANGELOGS',
            data: sortedChangelogs
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
}

function determineStatus(changelog) {
    // Add your status determination logic here
    if (changelog.status === 'processing') return 'Processing';
    if (changelog.status === 'completed') return 'Completed';
    if (changelog.status === 'failed') return 'Failed';
    return 'Unknown';
} 