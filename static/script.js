document.addEventListener('DOMContentLoaded', () => {
    const FLEISCHKAESE_PRICE = 1.50;
    const DELIVERY_FEE = 0.50;
    const configurationsContainer = document.getElementById('fleischkaese-configurations');
    const addConfigBtn = document.getElementById('add-config-btn');
    const selectedItemsList = document.getElementById('selected-items');
    const totalPriceElement = document.getElementById('total-price');
    const itemCountElement = document.getElementById('item-count');
    const tipDisplayElement = document.getElementById('tip-display');
    const deliveryFeeElement = document.getElementById('delivery-fee');
    const orderForm = document.getElementById('order-form');
    const customerNameInput = document.getElementById('customer-name');
    const tipInput = document.getElementById('tip');
    const leaderboardList = document.getElementById('leaderboard-list');
    const noLeaderboardDataMessage = document.getElementById('no-leaderboard-data');
    
    let configCounter = 0;

    // Create configuration card HTML
    function createConfigCard(id, index) {
        return `
            <div class="fleischkaese-config-container" data-config-id="${id}">
                <div class="config-header">
                    <h3>
                        <span class="config-index">#${index + 1}</span>
                        Konfiguration
                    </h3>
                    <button type="button" class="remove-config-btn" title="Entfernen">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                <div class="quantity-section">
                    <label>Anzahl</label>
                    <div class="quantity-container">
                        <button type="button" class="quantity-button minus">−</button>
                        <input type="number" value="1" min="0" class="quantity-input" data-name="Fleischkäse">
                        <button type="button" class="quantity-button plus">+</button>
                    </div>
                </div>

                <div class="sauce-section">
                    <label>Saucen wählen</label>
                    <div class="sauces-container">
                        <label class="sauce-label">
                            <input type="checkbox" class="sauce-checkbox" data-condiment="Ketchup">
                            Ketchup
                        </label>
                        <label class="sauce-label">
                            <input type="checkbox" class="sauce-checkbox" data-condiment="Senf">
                            Senf
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    function updateOrderSummary() {
        selectedItemsList.innerHTML = '';
        let totalPrice = 0;
        let hasItems = false;

        const configContainers = configurationsContainer.querySelectorAll('.fleischkaese-config-container');

        configContainers.forEach((container, index) => {
            const quantityInput = container.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value) || 0;

            if (quantity > 0) {
                hasItems = true;
                const condiments = [];
                container.querySelectorAll('.sauce-checkbox:checked').forEach(cb => {
                    condiments.push(cb.dataset.condiment);
                });

                let condimentsText = condiments.length > 0 ? ` (${condiments.join(', ')})` : '';
                const listItem = document.createElement('li');
                listItem.textContent = `Fleischkäse #${index + 1}${condimentsText} x ${quantity}`;
                selectedItemsList.appendChild(listItem);

                totalPrice += quantity * FLEISCHKAESE_PRICE;
            }
        });

        if (!hasItems) {
            const noItemsMessage = document.createElement('li');
            noItemsMessage.className = 'text-muted';
            noItemsMessage.textContent = 'Noch keine Artikel ausgewählt.';
            selectedItemsList.appendChild(noItemsMessage);
        }

        const tip = parseFloat(tipInput.value) || 0;
        const finalTotal = totalPrice + tip + DELIVERY_FEE;

        itemCountElement.textContent = `${totalPrice.toFixed(2).replace('.', ',')}€`;
        tipDisplayElement.textContent = `${tip.toFixed(2).replace('.', ',')}€`;
        deliveryFeeElement.textContent = `${DELIVERY_FEE.toFixed(2).replace('.', ',')}€`;
        totalPriceElement.textContent = `${finalTotal.toFixed(2).replace('.', ',')}€`;
    }

    tipInput.addEventListener('input', updateOrderSummary);

    function attachEventListeners(container) {
        const quantityInput = container.querySelector('.quantity-input');
        const minusBtn = container.querySelector('.quantity-button.minus');
        const plusBtn = container.querySelector('.quantity-button.plus');
        const removeBtn = container.querySelector('.remove-config-btn');
        const sauceCheckboxes = container.querySelectorAll('.sauce-checkbox');

        minusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let val = parseInt(quantityInput.value) || 0;
            if (val > 0) quantityInput.value = val - 1;
            updateOrderSummary();
        });

        plusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let val = parseInt(quantityInput.value) || 0;
            quantityInput.value = val + 1;
            updateOrderSummary();
        });

        quantityInput.addEventListener('change', updateOrderSummary);
        quantityInput.addEventListener('input', updateOrderSummary);

        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (configurationsContainer.querySelectorAll('.fleischkaese-config-container').length > 1) {
                container.remove();
                updateOrderSummary();
            } else {
                alert('Die letzte Konfiguration kann nicht entfernt werden.');
            }
        });

        sauceCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateOrderSummary);
        });
    }

    function addNewConfiguration() {
        const newId = `config-${configCounter++}`;
        const index = configurationsContainer.querySelectorAll('.fleischkaese-config-container').length;
        const html = createConfigCard(newId, index);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newContainer = tempDiv.firstElementChild;
        configurationsContainer.appendChild(newContainer);
        attachEventListeners(newContainer);
        updateOrderSummary();
    }

    addConfigBtn.addEventListener('click', addNewConfiguration);

    // Initialize first configuration
    const initialId = `config-${configCounter++}`;
    const initialHtml = createConfigCard(initialId, 0);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = initialHtml;
    const initialContainer = tempDiv.firstElementChild;
    configurationsContainer.appendChild(initialContainer);
    attachEventListeners(initialContainer);

    // Leaderboard
    async function fetchAndRenderLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard/fleischkaese');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const leaderboardData = await response.json();

            leaderboardList.innerHTML = '';

            if (leaderboardData.length === 0) {
                noLeaderboardDataMessage.style.display = 'block';
            } else {
                noLeaderboardDataMessage.style.display = 'none';
                leaderboardData.forEach((entry, index) => {
                    const listItem = document.createElement('li');
                    
                    let medal = '🥇';
                    if (index === 1) medal = '🥈';
                    if (index === 2) medal = '🥉';
                    if (index > 2) medal = '⭐';
                    
                    const innerDiv = document.createElement('div');
                    innerDiv.innerHTML = `
                        <span class="medal">${medal}</span>
                        <strong>${entry.customerName}</strong>
                        <span style="font-size: 0.9rem; color: #64748b; margin-left: 0.5rem;">${entry.total} Fleischkäse</span>
                    `;
                    
                    const rankSpan = document.createElement('span');
                    rankSpan.className = 'leaderboard-rank';
                    rankSpan.textContent = `#${index + 1}`;
                    
                    listItem.appendChild(innerDiv);
                    listItem.appendChild(rankSpan);
                    leaderboardList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden des Leaderboards:', error);
            noLeaderboardDataMessage.textContent = 'Fehler beim Laden des Leaderboards.';
            noLeaderboardDataMessage.style.display = 'block';
        }
    }

    orderForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert('Bitte geben Sie Ihren Namen ein!');
            return;
        }

        const itemsToOrder = {};
        let hasItems = false;
        const configContainers = configurationsContainer.querySelectorAll('.fleischkaese-config-container');

        configContainers.forEach((container, index) => {
            const quantity = parseInt(container.querySelector('.quantity-input').value) || 0;
            if (quantity > 0) {
                hasItems = true;
                const condiments = [];
                container.querySelectorAll('.sauce-checkbox:checked').forEach(cb => {
                    condiments.push(cb.dataset.condiment);
                });
                let itemName = `Fleischkäse #${index + 1}`;
                if (condiments.length > 0) {
                    itemName += ` (${condiments.join(', ')})`;
                }
                itemsToOrder[itemName] = quantity;
            }
        });

        if (!hasItems) {
            alert('Bitte wählen Sie mindestens einen Artikel aus!');
            return;
        }

        const orderData = {
            customerName: customerName,
            items: itemsToOrder,
            tip: parseFloat(tipInput.value) || 0,
            deliveryFee: DELIVERY_FEE,
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            alert('Ihre Bestellung wurde erfolgreich aufgegeben! Bestell-ID: ' + data.orderId);

            orderForm.reset();
            configurationsContainer.innerHTML = '';
            configCounter = 0;
            addNewConfiguration();
            updateOrderSummary();
            fetchAndRenderLeaderboard();

        } catch (error) {
            console.error('Fehler beim Senden der Bestellung:', error);
            alert('Es gab einen Fehler beim Senden Ihrer Bestellung: ' + error.message);
        }
    });

    // Theme toggle
    const themeCheckbox = document.getElementById('check-5');
    if (themeCheckbox) {
        function applyTheme(theme) {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeCheckbox.checked = true;
            } else {
                document.documentElement.removeAttribute('data-theme');
                themeCheckbox.checked = false;
            }
        }

        const saved = localStorage.getItem('theme');
        if (saved) {
            applyTheme(saved);
        }

        themeCheckbox.addEventListener('change', () => {
            const theme = themeCheckbox.checked ? 'dark' : 'light';
            applyTheme(theme);
            localStorage.setItem('theme', theme);
        });
    }

    updateOrderSummary();
    fetchAndRenderLeaderboard();
});
