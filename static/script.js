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
                container.querySelectorAll('input[name="condiment"]:checked').forEach(checkbox => {
                    condiments.push(checkbox.value);
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
            if (event.target.classList.contains('quantity-button')) {
                let currentQuantity = parseInt(quantityInput.value);
                if (event.target.classList.contains('plus')) {
                    currentQuantity++;
                } else if (event.target.classList.contains('minus')) {
                    if (currentQuantity > 0) {
                        currentQuantity--;
                    }
                }
                quantityInput.value = currentQuantity;
                checkbox.checked = currentQuantity > 0;
                updateOrderSummary();
            }

            if (event.target.classList.contains('remove-config-btn')) {
                if (configurationsContainer.querySelectorAll('.fleischkaese-config-container').length > 1) {
                    container.remove();
                    updateOrderSummary();
                } else {
                    alert('Die letzte Konfiguration kann nicht entfernt werden.');
                }
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

        container.querySelectorAll('input[name="condiment"]').forEach(condimentCheckbox => {
            condimentCheckbox.addEventListener('change', () => {
                updateOrderSummary();
            });
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

    function addNewConfiguration() {
        const firstConfig = configurationsContainer.querySelector('.fleischkaese-config-container');
        const newConfig = firstConfig.cloneNode(true);

        const quantityInput = newConfig.querySelector('.quantity-input');
        const checkbox = newConfig.querySelector('input[type="checkbox"][data-name]');
        const condimentCheckboxes = newConfig.querySelectorAll('input[name="condiment"]');

        quantityInput.value = '1';
        checkbox.checked = true;
        condimentCheckboxes.forEach(cb => cb.checked = false);

        attachEventListeners(newConfig);
        configurationsContainer.appendChild(newConfig);
        updateOrderSummary();
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
                container.querySelectorAll('input[name="condiment"]:checked').forEach(checkbox => {
                    condiments.push(checkbox.value);
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
            configurationsContainer.innerHTML = '';
            addNewConfiguration();
            updateOrderSummary();
            fetchAndRenderLeaderboard();

        } catch (error) {
            console.error('Fehler beim Senden der Bestellung:', error);
            alert('Es gab einen Fehler beim Senden Ihrer Bestellung: ' + error.message + '. Bitte versuchen Sie es erneut.');
        }
    });

    updateOrderSummary();
    fetchAndRenderLeaderboard();
});
