// Books functionality

// Load featured books on homepage
async function loadFeaturedBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books/get-books.php?featured=true`);
        const data = await response.json();
        
        if (data.success && data.books.length > 0) {
            const container = document.getElementById('books-container');
            container.innerHTML = data.books.map(book => createBookCard(book)).join('');
        } else {
            document.getElementById('books-container').innerHTML = `
                <div class="no-books">
                    <p>No featured books available at the moment.</p>
                </div>
            `;
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Load all books on books page
async function loadAllBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/books/get-books.php`);
        const data = await response.json();
        
        if (data.success && data.books.length > 0) {
            const container = document.getElementById('books-list');
            container.innerHTML = data.books.map(book => createBookCard(book, false)).join('');
        } else {
            document.getElementById('books-list').innerHTML = `
                <div class="no-books" style="text-align: center; padding: 40px;">
                    <i class="fas fa-book" style="font-size: 48px; color: var(--color-gray);"></i>
                    <h3>No Books Available</h3>
                    <p>Check back soon for new arrivals!</p>
                </div>
            `;
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Create book card HTML
function createBookCard(book, isFeatured = true) {
    return `
        <div class="book-card">
            <div class="book-image-container">
                <img src="${book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}" 
                     alt="${book.title}" 
                     class="book-image"
                     onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'">
                ${book.is_featured ? '<span class="featured-badge">Featured</span>' : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <p class="book-description">${book.description ? (book.description.length > 100 ? book.description.substring(0, 100) + '...' : book.description) : 'No description available.'}</p>
                <div class="book-footer">
                    <span class="book-price">${formatCurrency(book.price)}</span>
                    ${isFeatured ? '' : `<button class="btn btn-primary" onclick="viewBookDetails(${book.id})">View Details</button>`}
                </div>
            </div>
        </div>
    `;
}

// View book details
async function viewBookDetails(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/get-book.php?id=${bookId}`);
        const data = await response.json();
        
        if (data.success) {
            const book = data.book;
            const modal = createBookModal(book);
            
            // Create modal container
            const modalContainer = document.createElement('div');
            modalContainer.className = 'modal-container';
            modalContainer.innerHTML = modal;
            document.body.appendChild(modalContainer);
            
            // Show modal
            setTimeout(() => {
                modalContainer.classList.add('show');
            }, 10);
            
            // Close modal on button click
            modalContainer.querySelector('.close-modal').addEventListener('click', () => {
                modalContainer.classList.remove('show');
                setTimeout(() => modalContainer.remove(), 300);
            });
            
            // Close modal on background click
            modalContainer.addEventListener('click', (e) => {
                if (e.target === modalContainer) {
                    modalContainer.classList.remove('show');
                    setTimeout(() => modalContainer.remove(), 300);
                }
            });
        }
    } catch (error) {
        handleApiError(error);
    }
}

// Create book modal HTML
function createBookModal(book) {
    return `
        <div class="modal-content" style="
            background: white;
            border-radius: 8px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <button class="close-modal" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: var(--color-dark);
                z-index: 1;
            ">&times;</button>
            
            <div class="modal-body" style="padding: 30px;">
                <div class="book-detail-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 30px;">
                    <div class="book-image-section">
                        <img src="${book.image_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w-400&q=80'}" 
                             alt="${book.title}"
                             style="width: 100%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    </div>
                    <div class="book-info-section">
                        <h2 style="color: var(--color-dark); margin-bottom: 10px;">${book.title}</h2>
                        <h3 style="color: var(--color-secondary); margin-bottom: 20px;">by ${book.author}</h3>
                        
                        <div class="book-meta" style="margin-bottom: 20px;">
                            <span class="book-price" style="font-size: 1.8rem; color: var(--color-primary); font-weight: bold;">
                                ${formatCurrency(book.price)}
                            </span>
                            <span class="book-category" style="
                                background: var(--color-gray);
                                padding: 5px 15px;
                                border-radius: 20px;
                                margin-left: 15px;
                            ">${book.category || 'General'}</span>
                        </div>
                        
                        <div class="book-description" style="margin-bottom: 30px;">
                            <h4 style="margin-bottom: 10px;">Description</h4>
                            <p style="line-height: 1.8;">${book.description || 'No description available.'}</p>
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="addToCart(${book.id})">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="btn btn-outline" onclick="window.location.href='contact.html?book=${book.id}'">
                                <i class="fas fa-question-circle"></i> Inquire About This Book
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Add book to cart
function addToCart(bookId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if book already in cart
    if (!cart.includes(bookId)) {
        cart.push(bookId);
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Book added to cart!');
    } else {
        showNotification('Book is already in your cart', 'error');
    }
}

// Modal styles
const modalStyles = `
    .modal-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .modal-container.show {
        opacity: 1;
        visibility: visible;
    }
    
    .modal-container .modal-content {
        transform: translateY(-20px);
        transition: transform 0.3s ease;
    }
    
    .modal-container.show .modal-content {
        transform: translateY(0);
    }
    
    .featured-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: var(--color-primary);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    }
`;

// Add modal styles to document
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = modalStyles;
    document.head.appendChild(style);
});