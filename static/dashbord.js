document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.querySelector('.orders-container');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const menuItemsStatusContainer = document.getElementById('menu-items-status-container');
    const noMenuItemsMessage = document.getElementById('no-menu-items-message');
    const acceptanceDaysForm = document.getElementById('acceptance-days-form');

    async function fetchAndRenderOrders() {
        try {
            const response = await fetch('/api/orders');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const orders = await response.json();

            orders.sort((a, b) => {
                const statusOrder = { 'neu': 1, 'in Bearbeitung': 2, 'fertig': 3, 'abgeschlossen': 4 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return new Date(a.timestamp) - new Date(b.timestamp);
            });

            ordersContainer.innerHTML = '';

            const openOrders = orders.filter(order => order.status !== 'abgeschlossen');

            if (openOrders.length === 0) {
                noOrdersMessage.style.display = 'block';
            } else {
                noOrdersMessage.style.display = 'none';
                openOrders.forEach(order => {
                    renderOrderCard(order);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der Bestellungen:', error);
            noOrdersMessage.textContent = 'Fehler beim Laden der Bestellungen. Server nicht erreichbar oder falsche API-URL?';
            noOrdersMessage.style.display = 'block';
        }
    }

    function renderOrderCard(order) {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        orderCard.dataset.orderId = order.id;

        orderCard.classList.add(`status-${order.status.replace(/\s+/g, '-')}`);

        const orderTime = new Date(order.timestamp);
        const timeString = orderTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        const itemsListHtml = Object.entries(order.items).map(([name, quantity]) => {
            const match = name.match(/^(.*?)\s*\((.*?)\)$/);
            let itemName = name;
            let condiments = '';

            if (match) {
                itemName = match[1];
                condiments = match[2];
            }

            return `
                <li>
                    <span>${itemName}</span>
                    <span>x ${quantity}</span>
                    ${condiments ? `<small class="condiments-list">(${condiments})</small>` : ''}
                </li>
            `;
        }).join('');

        const totalPrice = order.total_price || 0;
        const tip = order.tip || 0;
        const basePrice = totalPrice - tip;

        orderCard.innerHTML = `
            <h3>${order.customerName}</h3>
            <p>Bestellt um: ${timeString}</p>
            <p class="order-price">Preis: <strong>${basePrice.toFixed(2).replace('.', ',')}€</strong></p>
            <p class="order-tip">Trinkgeld: <strong>${tip.toFixed(2).replace('.', ',')}€</strong></p>
            <p class="order-total-price">Zu zahlen: <strong>${totalPrice.toFixed(2).replace('.', ',')}€</strong></p>
            <ul>
                ${itemsListHtml}
            </ul>
            <div class="order-actions">
                <button class="status-button status-button-new" data-status="neu" ${order.status === 'neu' ? 'disabled' : ''}>Neu</button>
                <button class="status-button status-button-in-progress" data-status="in Bearbeitung" ${order.status === 'in Bearbeitung' ? 'disabled' : ''}>In Bearbeitung</button>
                <button class="status-button status-button-ready" data-status="fertig" ${order.status === 'fertig' ? 'disabled' : ''}>Fertig</button>
                <button class="status-button status-button-complete" data-status="abgeschlossen">Abhaken</button>
                <button class="edit-price-button">Preis anpassen</button>
            </div>
            <p style="font-size: 0.9em; text-align: right; margin-top: 10px; color: #666;">Status: ${order.status}</p>
        `;

        ordersContainer.appendChild(orderCard);

        orderCard.querySelectorAll('.status-button').forEach(button => {
            button.addEventListener('click', async () => {
                const newStatus = button.dataset.status;
                const orderId = orderCard.dataset.orderId;

                try {
                    const response = await fetch(`/api/orders/${orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: newStatus })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }));
                        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                    }

                    fetchAndRenderOrders();
                } catch (error) {
                    console.error('Fehler beim Aktualisieren des Status:', error);
                    alert('Fehler beim Aktualisieren des Status: ' + error.message + '. Bitte versuchen Sie es erneut.');
                }
            });
        });

        orderCard.querySelector('.edit-price-button').addEventListener('click', async () => {
            const orderId = orderCard.dataset.orderId;
            const currentPrice = order.total_price;
            const newPriceString = prompt(`Neuen Gesamtpreis für Bestellung #${orderId} eingeben:`, currentPrice.toFixed(2));

            if (newPriceString) {
                const newPrice = parseFloat(newPriceString.replace(',', '.'));
                if (!isNaN(newPrice)) {
                    try {
                        const response = await fetch(`/api/orders/${orderId}/price`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ total_price: newPrice })
                        });

                        if (!response.ok) {
                            throw new Error('Preis-Update fehlgeschlagen');
                        }

                        fetchAndRenderOrders(); // Refresh orders to show the new price
                    } catch (error) {
                        console.error('Fehler beim Anpassen des Preises:', error);
                        alert('Preis konnte nicht angepasst werden.');
                    }
                }
            }
        });
    }

    async function fetchAndRenderLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard/fleischkaese');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const leaderboard = await response.json();

            leaderboardContainer.innerHTML = '';

            if (leaderboard.length === 0) {
                leaderboardContainer.innerHTML = '<p>Das Leaderboard ist noch leer.</p>';
            } else {
                const table = document.createElement('table');
                table.classList.add('leaderboard-table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Anzahl</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                `;
                const tbody = table.querySelector('tbody');

                leaderboard.forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${entry.customerName}</td>
                        <td>${entry.total}</td>
                        <td class="leaderboard-actions">
                            <button class="edit-leaderboard-btn" data-customer="${entry.customerName}" data-total="${entry.total}">Bearbeiten</button>
                            <button class="delete-leaderboard-btn" data-customer="${entry.customerName}">Löschen</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });

                leaderboardContainer.appendChild(table);

                // Event Listeners for edit and delete buttons
                document.querySelectorAll('.edit-leaderboard-btn').forEach(button => {
                    button.addEventListener('click', handleEditLeaderboardEntry);
                });

                document.querySelectorAll('.delete-leaderboard-btn').forEach(button => {
                    button.addEventListener('click', handleDeleteLeaderboardEntry);
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden des Leaderboards:', error);
            leaderboardContainer.innerHTML = '<p>Fehler beim Laden des Leaderboards.</p>';
        }
    }

    async function handleEditLeaderboardEntry(event) {
        const customerName = event.target.dataset.customer;
        const currentTotal = event.target.dataset.total;
        const newTotal = prompt(`Ändere die Anzahl für ${customerName}:`, currentTotal);

        if (newTotal !== null && newTotal.trim() !== '' && !isNaN(newTotal)) {
            try {
                const response = await fetch(`/api/leaderboard/fleischkaese/${customerName}`,
                 {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ total: parseInt(newTotal, 10) })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                fetchAndRenderLeaderboard();
            } catch (error) {
                console.error('Fehler beim Bearbeiten des Leaderboard-Eintrags:', error);
                alert('Fehler beim Bearbeiten des Eintrags.');
            }
        }
    }

    async function handleDeleteLeaderboardEntry(event) {
        const customerName = event.target.dataset.customer;
        if (confirm(`Möchtest du den Eintrag für ${customerName} wirklich löschen?`)) {
            try {
                const response = await fetch(`/api/leaderboard/fleischkaese/${customerName}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                fetchAndRenderLeaderboard();
            } catch (error) {
                console.error('Fehler beim Löschen des Leaderboard-Eintrags:', error);
                alert('Fehler beim Löschen des Eintrags.');
            }
        }
    }

    async function fetchAndRenderMenuItemsStatus() {
        try {
            const response = await fetch('/api/menu_items');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const menuItems = await response.json();

            menuItemsStatusContainer.innerHTML = '';

            if (menuItems.length === 0) {
                noMenuItemsMessage.style.display = 'block';
            } else {
                noMenuItemsMessage.style.display = 'none';
                menuItems.forEach(item => {
                    const itemCard = document.createElement('div');
                    itemCard.classList.add('order-card');
                    itemCard.classList.add('menu-item-card');
                    itemCard.dataset.itemName = item.name;

                    itemCard.innerHTML = `
                        <h3>${item.name}</h3>
                        <p>Status: <span class="item-status-text ${item.sold_out ? 'sold-out' : 'available'}">${item.sold_out ? 'Ausverkauft' : 'Verfügbar'}</span></p>
                        <div class="item-status-actions">
                            <button class="toggle-sold-out-button" data-status="${item.sold_out ? 'true' : 'false'}">
                                ${item.sold_out ? 'Als verfügbar markieren' : 'Als ausverkauft markieren'}
                            </button>
                        </div>
                    `;
                    menuItemsStatusContainer.appendChild(itemCard);

                    itemCard.querySelector('.toggle-sold-out-button').addEventListener('click', async (event) => {
                        const currentStatus = event.target.dataset.status === 'true';
                        const newItemStatus = !currentStatus;
                        const itemName = itemCard.dataset.itemName;

                        try {
                            const updateResponse = await fetch(`/api/menu_items/${itemName}/sold_out`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sold_out: newItemStatus })
                            });

                            if (!updateResponse.ok) {
                                const errorData = await updateResponse.json().catch(() => ({ error: 'Unbekannter Fehler' }));
                                throw new Error(errorData.error || `HTTP error! Status: ${updateResponse.status}`);
                            }

                            alert(`Status für ${itemName} erfolgreich auf ${newItemStatus ? 'Ausverkauft' : 'Verfügbar'} aktualisiert.`);
                            fetchAndRenderMenuItemsStatus();

                        } catch (error) {
                            console.error(`Fehler beim Aktualisieren des Status für ${itemName}:`, error);
                            alert(`Fehler beim Aktualisieren des Status für ${itemName}: ${error.message}`);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden der Menüartikel für die Verwaltung:', error);
            noMenuItemsMessage.textContent = 'Fehler beim Laden der Menüartikel.';
            noMenuItemsMessage.style.display = 'block';
        }
    }

    async function fetchAndRenderAcceptanceDays() {
        try {
            const response = await fetch('/api/acceptance_days');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const acceptanceDays = await response.json();
            const checkboxes = document.querySelectorAll('input[name="acceptance-day"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = acceptanceDays.includes(checkbox.value);
            });
        } catch (error) {
            console.error('Fehler beim Laden der Annahmetage:', error);
        }
    }

    async function handleAcceptanceDaysSubmit(event) {
        event.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="acceptance-day"]:checked');
        const acceptanceDays = Array.from(checkboxes).map(checkbox => checkbox.value);

        try {
            const response = await fetch('/api/acceptance_days', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acceptance_days: acceptanceDays })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Annahmetage erfolgreich gespeichert!');
            fetchAndRenderAcceptanceDays();
        } catch (error) {
            console.error('Fehler beim Speichern der Annahmetage:', error);
            alert('Fehler beim Speichern der Annahmetage.');
        }
    }

    acceptanceDaysForm.addEventListener('submit', handleAcceptanceDaysSubmit);

    setInterval(fetchAndRenderOrders, 5000);
    setInterval(fetchAndRenderMenuItemsStatus, 10000);
    setInterval(fetchAndRenderLeaderboard, 5000);
    setInterval(fetchAndRenderAcceptanceDays, 10000);

    fetchAndRenderOrders();
    fetchAndRenderMenuItemsStatus();
    fetchAndRenderLeaderboard();
    fetchAndRenderAcceptanceDays();
});