// Global variables
let booksData = [];
let currentCountry = '';
let currentFilter = '';
let lastGenreOrTopicPage = '';
let currentBookIndex = -1;

// Helper function to strip emoji prefix (emoji + space)
function stripEmoji(text) {
    return text.substring(2);
}

// Load books data from the global BOOKS_DATA variable
function loadBooksData() {
    try {
        // Check if BOOKS_DATA is available (loaded from books-data.js)
        if (typeof BOOKS_DATA !== 'undefined' && Array.isArray(BOOKS_DATA)) {
            booksData = BOOKS_DATA;
            console.log('Books data loaded:', booksData.length, 'books');
            return Promise.resolve();
        } else {
            throw new Error('BOOKS_DATA not found. Make sure books-data.js is loaded.');
        }
    } catch (error) {
        console.error('Error loading books data:', error);
        return Promise.reject(error);
    }
}

// Show specific page
function showPage(pageId, updateHash = true) {
    $('.page').removeClass('active');
    $('#' + pageId).addClass('active');

    if (updateHash) {
        updateUrlHash(pageId);
    }
}

// Update URL hash based on current page and state
function updateUrlHash(pageId) {
    let hash = '';

    switch (pageId) {
        case 'page-main':
            hash = '#home';
            break;
        case 'page-selection':
            hash = `#selection/${encodeURIComponent(currentCountry)}`;
            break;
        case 'page-genres':
            hash = `#genres/${encodeURIComponent(currentCountry)}`;
            break;
        case 'page-topics':
            hash = `#topics/${encodeURIComponent(currentCountry)}`;
            break;
        case 'page-books':
            hash = `#books/${encodeURIComponent(currentCountry)}/${encodeURIComponent(currentFilter)}`;
            break;
        case 'page-book-detail':
            hash = `#book/${currentBookIndex}`;
            break;
    }

    if (window.location.hash !== hash) {
        window.history.pushState(null, null, hash);
    }
}

// Parse URL hash and navigate to appropriate page
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Remove #
    const parts = hash.split('/');

    if (!hash || hash === 'home') {
        showPage('page-main', false);
        return;
    }

    switch (parts[0]) {
        case 'selection':
            if (parts[1]) {
                currentCountry = decodeURIComponent(parts[1]);
                showPage('page-selection', false);
            }
            break;
        case 'genres':
            if (parts[1]) {
                currentCountry = decodeURIComponent(parts[1]);
                lastGenreOrTopicPage = 'page-genres';
                populateGenres();
                showPage('page-genres', false);
            }
            break;
        case 'topics':
            if (parts[1]) {
                currentCountry = decodeURIComponent(parts[1]);
                lastGenreOrTopicPage = 'page-topics';
                populateTopics();
                showPage('page-topics', false);
            }
            break;
        case 'books':
            if (parts[1] && parts[2]) {
                currentCountry = decodeURIComponent(parts[1]);
                currentFilter = decodeURIComponent(parts[2]);

                // Determine if it's a genre or topic and show appropriate books
                const genreBooks = booksData.filter(book =>
                    book.country === currentCountry && book.genre === currentFilter
                );
                const topicBooks = booksData.filter(book =>
                    book.country === currentCountry && book.topic === currentFilter
                );

                if (genreBooks.length > 0) {
                    displayBooks(genreBooks, `Žánr: ${currentFilter}`, false);
                } else if (topicBooks.length > 0) {
                    displayBooks(topicBooks, `Téma: ${currentFilter}`, false);
                }
            }
            break;
        case 'book':
            if (parts[1] && !isNaN(parts[1])) {
                currentBookIndex = parseInt(parts[1]);
                if (currentBookIndex >= 0 && currentBookIndex < booksData.length) {
                    showBookDetail(currentBookIndex, false);
                }
            }
            break;
    }
}

// Show country selection page
function showCountrySelection(country) {
    currentCountry = country;
    showPage('page-selection');
}

// Show genres page
function showGenres() {
    lastGenreOrTopicPage = 'page-genres';
    populateGenres();
    showPage('page-genres');
}

// Show topics page
function showTopics() {
    lastGenreOrTopicPage = 'page-topics';
    populateTopics();
    showPage('page-topics');
}

// Populate genres
function populateGenres() {
    const genres = [...new Set(booksData
        .filter(book => book.country === currentCountry && book.genre)
        .map(book => book.genre))]
        .sort((a, b) => stripEmoji(a).localeCompare(stripEmoji(b), 'cs'));

    const container = $('#genres-container');
    container.empty();

    genres.forEach(genre => {
        const btn = $(`<button class="btn genre-btn" onclick="showBooksByGenre('${genre}')">${genre}</button>`);
        container.append(btn);
    });
}

// Populate topics
function populateTopics() {
    const topics = [...new Set(booksData
        .filter(book => book.country === currentCountry && book.topic)
        .map(book => book.topic))]
        .sort((a, b) => stripEmoji(a).localeCompare(stripEmoji(b), 'cs'));

    const container = $('#topics-container');
    container.empty();

    topics.forEach(topic => {
        const btn = $(`<button class="btn topic-btn" onclick="showBooksByTopic('${topic}')">${topic}</button>`);
        container.append(btn);
    });
}

// Show books by genre
function showBooksByGenre(genre) {
    currentFilter = genre;
    const filteredBooks = booksData.filter(book =>
        book.country === currentCountry && book.genre === genre
    );
    displayBooks(filteredBooks, `Žánr: ${genre}`);
}

// Show books by topic
function showBooksByTopic(topic) {
    currentFilter = topic;
    const filteredBooks = booksData.filter(book =>
        book.country === currentCountry && book.topic === topic
    );
    displayBooks(filteredBooks, `Téma: ${topic}`);
}

// Get display info for book based on current context
function getDisplayInfo(book) {
    // If we're showing books by genre, display the topic with label
    if (currentFilter && booksData.some(b => b.genre === currentFilter)) {
        return book.topic ? `Téma: ${book.topic}` : '';
    }
    // If we're showing books by topic, display the genre with label
    if (currentFilter && booksData.some(b => b.topic === currentFilter)) {
        return book.genre ? `Žánr: ${book.genre}` : '';
    }
    // Fallback to original behavior
    return book.genre || book.topic || '';
}

// Display books
function displayBooks(books, heading, updateHash = true) {
    $('#books-heading').text(heading);
    const container = $('#books-container');
    container.empty();

    // Seřadit knihy podle názvu
    const sortedBooks = [...books].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    sortedBooks.forEach((book, index) => {
        const coverPath = `covers/${book.author} - ${book.name}.jpg`;
        const bookCard = $(`
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="book-card h-100" onclick="showBookDetail(${booksData.indexOf(book)})">
                    <div class="row g-0">
                        <div class="col-4">
                            <div class="book-cover">
                                <img src="${coverPath}" alt="Obal knihy ${book.name}" class="img-fluid" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="cover-placeholder" style="display: none;">
                                    Obal knihy
                                </div>
                            </div>
                        </div>
                        <div class="col-8">
                            <h5 class="card-title">${book.name}</h5>
                            <p class="card-text"><strong>Autor:</strong> ${book.author}</p>
                            ${book.year ? `<p class="card-text"><strong>Rok:</strong> ${book.year}</p>` : ''}
                            <p class="card-text"><small class="text-muted">
                                ${getDisplayInfo(book)}
                            </small></p>
                        </div>
                    </div>
                </div>
            </div>
        `);
        container.append(bookCard);
    });

    showPage('page-books', updateHash);
}

// Show book detail
function showBookDetail(bookIndex, updateHash = true) {
    currentBookIndex = bookIndex;
    const book = booksData[bookIndex];
    const detailContent = $('#book-detail-content');
    const coverPath = `covers/${book.author} - ${book.name}.jpg`;

    detailContent.html(`
        <div class="row">
            <div class="col-md-4">
                <div class="book-cover mx-auto" style="width: 200px; height: 280px;">
                    <img src="${coverPath}" alt="Obal knihy ${book.name}" class="img-fluid" 
                         style="max-width: 100%; height: auto; max-height: 280px;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="cover-placeholder" style="display: none; background: #f8f9fa; border: 1px solid #dee2e6; height: 280px; align-items: center; justify-content: center;">
                        Obal knihy
                    </div>
                </div>
            </div>
            <div class="col-md-8">
                <h2>${book.name}</h2>
                <p><strong>Autor:</strong> ${book.author}</p>
                ${book.year ? `<p><strong>Rok vydání:</strong> ${book.year}</p>` : ''}
                ${book.genre ? `<p><strong>Žánr:</strong> ${book.genre}</p>` : ''}
                ${book.topic ? `<p><strong>Téma:</strong> ${book.topic}</p>` : ''}
                <hr>
                <h4>Popis</h4>
                <div class="book-description">
                    ${(book.description || `Zde bude základní popis knihy "${book.name}" od autora ${book.author}.`).replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
    `);

    showPage('page-book-detail', updateHash);
}

// Go back from books page
function goBackFromBooks() {
    if (lastGenreOrTopicPage) {
        showPage(lastGenreOrTopicPage);
    } else {
        // Fallback to main page if no previous genre/topic page
        showPage('page-main');
    }
}

// Initialize the application
$(document).ready(function () {
    loadBooksData().then(() => {
        // Handle initial page load based on hash
        if (!window.location.hash) {
            showPage('page-main', false);
        } else {
            handleHashChange();
        }

        // Listen for hash changes (browser back/forward)
        $(window).on('hashchange', handleHashChange);
    }).catch(() => {
        // If data loading fails, at least show the main page
        showPage('page-main', false);
    });
});
