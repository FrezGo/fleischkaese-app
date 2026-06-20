document.addEventListener('DOMContentLoaded', () => {
    const FLEISCHKAESE_PRICE = 1.50;
    const configurationsContainer = document.getElementById('fleischkaese-configurations');
    const addConfigBtn = document.getElementById('add-config-btn');
    const selectedItemsList = document.getElementById('selected-items');
    const totalPriceElement = document.getElementById('total-price');
    const itemCountElement = document.getElementById('item-count');
    const tipDisplayElement = document.getElementById('tip-display');
    const orderForm = document.getElementById('order-form');
    const customerNameInput = document.getElementById('customer-name');
    const tipInput = document.getElementById('tip');
    const leaderboardList = document.getElementById('leaderboard-list');
    const noLeaderboardDataMessage = document.getElementById('no-leaderboard-data');
    
    let configCounter = 0;

    // Create configuration card HTML
    function createConfigCard(id, index) {
        return `
            <div class="fleischkaese-config-container bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transition-all duration-300 hover:shadow-2xl" data-config-id="${id}">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span class="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-md">#${index + 1}</span>
                        Konfiguration
                    </h3>
                    <button type="button" class="remove-config-btn p-2 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Entfernen">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>

                <div class="space-y-6">
                    <!-- Quantity Selector -->
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Anzahl</label>
                        <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 w-fit">
                            <button type="button" class="quantity-button minus w-10 h-10 rounded-lg flex items-center justify-center bg-white text-slate-600 hover:bg-slate-100 transition-colors font-bold text-lg">−</button>
                            <input type="number" value="1" min="0" class="quantity-input w-8 text-center font-bold text-xl text-slate-800 border-none bg-transparent" data-name="Fleischkäse">
                            <button type="button" class="quantity-button plus w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-tr from-emerald-400 to-teal-500 text-white hover:shadow-md transition-all font-bold text-lg">+</button>
                        </div>
                    </div>

                    <!-- Sauce Selection -->
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Saucen wählen</label>
                        <div class="flex flex-wrap gap-3">
                            <label class="relative cursor-pointer group flex items-center">
                                <input type="checkbox" class="peer sr-only condiment-checkbox" data-condiment="Ketchup">
                                <div class="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-medium transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 peer-checked:bg-red-500 peer-checked:border-red-500 peer-checked:text-white peer-checked:shadow-lg">
                                    <div class="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center peer-checked:border-white peer-checked:bg-white/20 transition-colors">
                                        <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    Ketchup
                                </div>
                            </label>
                            
                            <label class="relative cursor-pointer group flex items-center">
                                <input type="checkbox" class="peer sr-only condiment-checkbox" data-condiment="Senf">
                                <div class="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-medium transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 peer-checked:bg-amber-400 peer-checked:border-amber-400 peer-checked:text-white peer-checked:shadow-lg">
                                    <div class="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center peer-checked:border-white peer-checked:bg-white/20 transition-colors">
                                        <svg class="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    Senf
                                </div>
                            </label>
                        </div>
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
                container.querySelectorAll('.condiment-checkbox:checked').forEach(cb => {
                    condiments.push(cb.dataset.condiment);
                });

                let condimentsText = condiments.length > 0 ? ` (${condiments.join(', ')})` : '';
                const listItem = document.createElement('li');
                listItem.className = 'text-slate-700 font-medium text-sm';
                listItem.textContent = `Fleischkäse #${index + 1}${condimentsText} x ${quantity}`;
                selectedItemsList.appendChild(listItem);

                totalPrice += quantity * FLEISCHKAESE_PRICE;
            }
        });

        if (!hasItems) {
            const noItemsMessage = document.createElement('li');
            noItemsMessage.className = 'text-slate-500';
            noItemsMessage.textContent = 'Noch keine Artikel ausgewählt.';
            selectedItemsList.appendChild(noItemsMessage);
        }

        const tip = parseFloat(tipInput.value) || 0;
        const finalTotal = totalPrice + tip;

        itemCountElement.textContent = `${totalPrice.toFixed(2).replace('.', ',')}€`;
        tipDisplayElement.textContent = `${tip.toFixed(2).replace('.', ',')}€`;
        totalPriceElement.textContent = `${finalTotal.toFixed(2).replace('.', ',')}€`;
    }

    tipInput.addEventListener('input', updateOrderSummary);

    function attachEventListeners(container) {
        const quantityInput = container.querySelector('.quantity-input');
        const minusBtn = container.querySelector('.quantity-button.minus');
        const plusBtn = container.querySelector('.quantity-button.plus');
        const removeBtn = container.querySelector('.remove-config-btn');
        const condimentCheckboxes = container.querySelectorAll('.condiment-checkbox');

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

        condimentCheckboxes.forEach(cb => {
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
                    listItem.className = 'bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/30 flex justify-between items-center';
                    
                    let medal = '🥇';
                    if (index === 1) medal = '🥈';
                    if (index === 2) medal = '🥉';
                    if (index > 2) medal = '⭐';
                    
                    listItem.innerHTML = `
                        <div>
                            <span class="text-xl font-bold mr-2">${medal}</span>
                            <strong class="text-slate-800">${entry.customerName}</strong>
                            <span class="text-slate-600 text-sm ml-2">${entry.total} Fleischkäse</span>
                        </div>
                        <span class="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-semibold">#${index + 1}</span>
                    `;
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
                container.querySelectorAll('.condiment-checkbox:checked').forEach(cb => {
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
                document.body.setAttribute('data-theme', 'dark');
                themeCheckbox.checked = true;
            } else {
                document.body.setAttribute('data-theme', 'light');
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
