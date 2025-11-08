document.addEventListener('DOMContentLoaded', () => {
    const FLEISCHKAESE_PRICE = 1.50;
    const configurationsContainer = document.getElementById('fleischkaese-configurations');
    const addConfigBtn = document.getElementById('add-config-btn');
    const selectedItemsList = document.getElementById('selected-items');
    const totalPriceElement = document.getElementById('total-price');
    const orderForm = document.getElementById('order-form');
    const customerNameInput = document.getElementById('customer-name');
    const tipInput = document.getElementById('tip');
    const leaderboardList = document.getElementById('leaderboard-list');
    const noLeaderboardDataMessage = document.getElementById('no-leaderboard-data');
    const acceptanceDaysList = document.getElementById('acceptance-days-list');

    async function fetchAndRenderAcceptanceDays() {
        try {
            const response = await fetch('/api/acceptance_days');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const acceptanceDays = await response.json();
            if (acceptanceDays.length === 0) {
                const popup = document.createElement('div');
                popup.classList.add('popup-overlay');
                popup.innerHTML = `
                    <div class="popup-content">
                        <h2>Heute geschlossen</h2>
                        <p>Wir haben heute leider geschlossen. Bitte versuchen Sie es an einem anderen Tag erneut.</p>
                    </div>
                `;
                document.body.appendChild(popup);
            } else {
                const popup = document.querySelector('.popup-overlay');
                if (popup) {
                    popup.remove();
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Annahmetage:', error);
        }
    }


    function updateOrderSummary() {
        selectedItemsList.innerHTML = '';
        let totalPrice = 0;
        let hasItems = false;

        const configContainers = configurationsContainer.querySelectorAll('.fleischkaese-config-container');

        configContainers.forEach((container, index) => {
            const quantityInput = container.querySelector('.quantity-input');
            const quantity = parseInt(quantityInput.value);

            if (quantity > 0) {
                hasItems = true;
                const condiments = [];
                container.querySelectorAll('.condiment-pill.active').forEach(pill => {
                    condiments.push(pill.dataset.condiment);
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
            noItemsMessage.textContent = 'Noch keine Artikel ausgewählt.';
            selectedItemsList.appendChild(noItemsMessage);
        }

        const tip = parseFloat(tipInput.value) || 0;
        totalPrice += tip;

        totalPriceElement.textContent = `${totalPrice.toFixed(2).replace('.', ',')}€`;
    }

    tipInput.addEventListener('input', updateOrderSummary);

    function attachEventListeners(container) {
        const quantityInput = container.querySelector('.quantity-input');
        const checkbox = container.querySelector('input[type="checkbox"][data-name]');

        container.addEventListener('click', (event) => {
            const target = event.target;

            if (target.classList.contains('quantity-button')) {
                const delta = target.classList.contains('plus') ? 1 : -1;
                animateQuantityChange(quantityInput, delta, container);
            }

            if (target.classList.contains('remove-config-btn')) {
                if (configurationsContainer.querySelectorAll('.fleischkaese-config-container').length > 1) {
                    container.remove();
                    updateOrderSummary();
                } else {
                    alert('Die letzte Konfiguration kann nicht entfernt werden.');
                }
            }

            const pill = target.closest('.condiment-pill');
            if (pill) {
                pill.classList.toggle('active');
                updateOrderSummary();
            }
        });

        quantityInput.addEventListener('input', () => {
            let newQuantity = parseInt(quantityInput.value);
            if (isNaN(newQuantity) || newQuantity < 0) {
                newQuantity = 0;
            }
            quantityInput.value = newQuantity;
            checkbox.checked = newQuantity > 0;
            updateOrderSummary();
        });

        checkbox.addEventListener('change', () => {
            if (!checkbox.checked) {
                quantityInput.value = 0;
            } else if (parseInt(quantityInput.value) === 0) {
                quantityInput.value = 1;
            }
            updateOrderSummary();
        });
    }

    /**
     * Animate and change a numeric input value (bouncy)
     * @param {HTMLInputElement} input
     * @param {number} delta
     * @param {HTMLElement} container - config container to update related checkbox
     */
    function animateQuantityChange(input, delta, container) {
        const oldValue = parseInt(input.value) || 0;
        const min = parseInt(input.min) || 0;
        const max = parseInt(input.max) || 99;
        let newValue = oldValue + delta;
        if (newValue < min) newValue = min;
        if (newValue > max) newValue = max;
        if (newValue === oldValue) return;

        const isIncreasing = delta > 0;

        // quick slide out
        input.style.transition = 'all 0.1s ease-in';
        input.style.transform = `translateY(${isIncreasing ? '-10px' : '10px'})`;
        input.style.opacity = '0';

        setTimeout(() => {
            input.value = newValue;
            // bounce back in
            input.style.transition = 'all 0.3s cubic-bezier(.25,1.5,.5,1)';
            input.style.transform = 'translateY(0)';
            input.style.opacity = '1';

            // keep checkbox in sync
            const checkbox = container.querySelector('input[type="checkbox"][data-name]');
            if (checkbox) checkbox.checked = parseInt(input.value) > 0;

            updateOrderSummary();
        }, 100);
    }

    /* Theme toggle: initialize from localStorage or prefers-color-scheme, allow manual override */
    (function initThemeToggle() {
        const themeCheckbox = document.getElementById('theme-toggle-checkbox');
        if (!themeCheckbox) return;

        function applyTheme(theme) {
            if (theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeCheckbox.checked = true;
            } else if (theme === 'light') {
                document.body.removeAttribute('data-theme');
                themeCheckbox.checked = false;
            }
        }

        const saved = localStorage.getItem('theme');
        if (saved) {
            applyTheme(saved);
        } else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        }

        themeCheckbox.addEventListener('change', () => {
            const theme = themeCheckbox.checked ? 'dark' : 'light';
            applyTheme(theme);
            localStorage.setItem('theme', theme);
        });

        // react to OS-level changes only if user hasn't explicitly chosen
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    })();

    function addNewConfiguration() {
        const firstConfig = configurationsContainer.querySelector('.fleischkaese-config-container');
        const newConfig = firstConfig.cloneNode(true);

        const quantityInput = newConfig.querySelector('.quantity-input');
        const checkbox = newConfig.querySelector('input[type="checkbox"][data-name]');
        const condimentPills = newConfig.querySelectorAll('.condiment-pill');

        quantityInput.value = '1';
        checkbox.checked = true;
        condimentPills.forEach(pill => pill.classList.remove('active'));

        attachEventListeners(newConfig);
        configurationsContainer.appendChild(newConfig);
        updateOrderSummary();
    }

    function resetConfigurations() {
        configurationsContainer.innerHTML = ''; // Vorherige Konfigurationen löschen
        const defaultConfig = document.createElement('div');
        defaultConfig.classList.add('fleischkaese-config-container');
        defaultConfig.innerHTML = `
            <div class="config-header">
                <h4>Fleischkäse-Konfiguration</h4>
                <button type="button" class="remove-config-btn">Entfernen</button>
            </div>
            <div class="menu-item" data-name="Fleischkäse">
                <label>
                    <input type="checkbox" data-name="Fleischkäse" checked> Fleischkäse - 1,50€
                </label>
                <div class="item-controls">
                    <div class="quantity-input-container">
                        <button type="button" class="quantity-button minus" data-item="Fleischkäse">-</button>
                        <input type="number" value="1" min="0" class="quantity-input" data-name="Fleischkäse">
                        <button type="button" class="quantity-button plus" data-item="Fleischkäse">+</button>
                    </div>
                </div>
                <div class="condiments">
                    <div class="condiment-pill" data-condiment="Ketchup">
                        <span class="condiment-text">Ketchup</span>
                        <div class="condiment-checkbox"></div>
                    </div>
                    <div class="condiment-pill" data-condiment="Senf">
                        <span class="condiment-text">Senf</span>
                        <div class="condiment-checkbox"></div>
                    </div>
                </div>
                <div class="sold-out-overlay" style="display: none;">
                    <span>Ausverkauft</span>
                </div>
            </div>
        `;
        attachEventListeners(defaultConfig);
        configurationsContainer.appendChild(defaultConfig);
    }
    addConfigBtn.addEventListener('click', addNewConfiguration);

    document.querySelectorAll('.fleischkaese-config-container').forEach(container => {
        attachEventListeners(container);
    });

    async function fetchAndRenderLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard/fleischkaese');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const leaderboardData = await response.json();

            leaderboardList.innerHTML = '';

            if (leaderboardData.length === 0) {
                noLeaderboardDataMessage.style.display = 'block';
            } else {
                noLeaderboardDataMessage.style.display = 'none';
                leaderboardData.forEach((entry, index) => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('leaderboard-entry-card');

                    let detailsBlockHtml = '';
                    if (Object.keys(entry.details).length > 0) {
                        const detailsItemsHtml = Object.entries(entry.details).map(([itemName, quantity]) => `
                            <div class="detail-item">
                                <span class="item-name">${itemName}:</span> <span class="item-quantity">${quantity}</span>
                            </div>
                        `).join('');
                        detailsBlockHtml = `<div class="details-block">${detailsItemsHtml}</div>`;
                    }

                    listItem.innerHTML = `
                        <div class="leaderboard-header">
                            <strong>${index + 1}. ${entry.customerName}</strong>
                            <span class="total-items">${entry.total} Fleischkäse</span>
                        </div>
                        ${detailsBlockHtml}
                    `;
                    leaderboardList.appendChild(listItem);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden des Fleischkäse-Leaderboards:', error);
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
            const quantity = parseInt(container.querySelector('.quantity-input').value);
            if (quantity > 0) {
                hasItems = true;
                const condiments = [];
                container.querySelectorAll('.condiment-pill.active').forEach(pill => {
                    condiments.push(pill.dataset.condiment);
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
            timestamp: new Date().toISOString()
        };

        try {
            orderForm.classList.add('order-submitted');

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            alert('Ihre Bestellung wurde erfolgreich aufgegeben! Bestell-ID: ' + data.orderId);

            orderForm.reset();
            resetConfigurations();
            updateOrderSummary();
            fetchAndRenderLeaderboard();

        } catch (error) {
            console.error('Fehler beim Senden der Bestellung:', error);
            alert('Es gab einen Fehler beim Senden Ihrer Bestellung: ' + error.message + '. Bitte versuchen Sie es erneut.');
        } finally {
            setTimeout(() => {
                orderForm.classList.remove('order-submitted');
            }, 500);
        }
    });

    updateOrderSummary();
    fetchAndRenderLeaderboard();
    fetchAndRenderAcceptanceDays();
});
