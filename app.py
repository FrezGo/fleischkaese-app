import logging
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import json
import os

# Flask-App initialisieren
app = Flask(__name__, static_folder='static', template_folder='static')
CORS(app)

# Logging konfigurieren
app.logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)

# --- Datenpersistenz ---
DATA_FILE = 'orders.json'
ACCEPTANCE_DAYS_FILE = 'acceptance_days.json'

def load_data():
    global orders_db, order_id_counter, fleischkaese_leaderboard
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            orders_db = data.get('orders_db', [])
            order_id_counter = data.get('order_id_counter', 1)
            fleischkaese_leaderboard = data.get('fleischkaese_leaderboard', {})
    else:
        orders_db = []
        order_id_counter = 1
        fleischkaese_leaderboard = {}
        save_data()

def save_data():
    with open(DATA_FILE, 'w') as f:
        data = {
            'orders_db': orders_db,
            'order_id_counter': order_id_counter,
            'fleischkaese_leaderboard': fleischkaese_leaderboard
        }
        json.dump(data, f, indent=4)

def load_acceptance_days():
    global acceptance_days
    if os.path.exists(ACCEPTANCE_DAYS_FILE):
        with open(ACCEPTANCE_DAYS_FILE, 'r') as f:
            data = json.load(f)
            acceptance_days = data.get('acceptance_days', [])
    else:
        acceptance_days = []
        save_acceptance_days()

def save_acceptance_days():
    with open(ACCEPTANCE_DAYS_FILE, 'w') as f:
        data = {
            'acceptance_days': acceptance_days
        }
        json.dump(data, f, indent=4)

# --- Globale Variablen ---
orders_db = []
order_id_counter = 1
fleischkaese_leaderboard = {}
acceptance_days = []

# Lade die Daten beim Start der Anwendung
load_data()
load_acceptance_days()

FLEISCHKAESE_PRICE = 1.50

menu_items_data = {
    "Fleischkäse": {"name": "Fleischkäse", "sold_out": False, "price": FLEISCHKAESE_PRICE},
}

# --- Flask-Routen ---

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/dashbord.html')
def serve_kitchen():
    return render_template('dashbord.html')

@app.route('/api/orders', methods=['POST'])
def receive_order():
    global order_id_counter, orders_db, fleischkaese_leaderboard

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    order_data = request.get_json()
    app.logger.info(f"POST /api/orders: Empfangene Daten: {order_data}")

    if not all(key in order_data for key in ['customerName', 'items']):
        return jsonify({"error": "Missing data in order"}), 400

    customer_name = order_data.get('customerName')
    items = order_data.get('items')
    tip = order_data.get('tip', 0)
    timestamp = order_data.get('timestamp', 'N/A')

    total_price = 0
    fleischkaese_quantity = 0
    for item_name, quantity in items.items():
        if item_name.startswith("Fleischkäse"):
            fleischkaese_quantity += quantity
    total_price = fleischkaese_quantity * FLEISCHKAESE_PRICE + tip

    new_order = {
        "id": order_id_counter,
        "customerName": customer_name,
        "items": items,
        "tip": tip,
        "timestamp": timestamp,
        "status": "neu",
        "total_price": total_price
    }
    orders_db.append(new_order)
    order_id_counter += 1

    if customer_name:
        cust_name_str = str(customer_name)
        if cust_name_str not in fleischkaese_leaderboard:
            fleischkaese_leaderboard[cust_name_str] = {'total': 0, 'details': {}}

        for item_name, quantity in items.items():
            if item_name.startswith("Fleischkäse"):
                fleischkaese_leaderboard[cust_name_str]['total'] += quantity
                if item_name not in fleischkaese_leaderboard[cust_name_str]['details']:
                    fleischkaese_leaderboard[cust_name_str]['details'][item_name] = 0
                fleischkaese_leaderboard[cust_name_str]['details'][item_name] += quantity

    save_data()
    app.logger.info(f"Neue Bestellung erhalten: {new_order}")
    return jsonify({"message": "Order received successfully", "orderId": new_order["id"]}), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify(orders_db), 200

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    status_data = request.get_json()
    new_status = status_data.get('status')

    if not new_status:
        return jsonify({"error": "Missing status in request"}), 400

    for order in orders_db:
        if order['id'] == order_id:
            order['status'] = new_status
            save_data()
            return jsonify({"message": f"Order {order_id} status updated to {new_status}"}), 200

    return jsonify({"error": "Order not found"}), 404

@app.route('/api/orders/<int:order_id>/price', methods=['PUT'])
def update_order_price(order_id):
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    price_data = request.get_json()
    new_price = price_data.get('total_price')

    if new_price is None:
        return jsonify({"error": "Missing total_price in request"}), 400

    for order in orders_db:
        if order['id'] == order_id:
            order['total_price'] = new_price
            save_data()
            return jsonify({"message": f"Order {order_id} price updated to {new_price}"}), 200

    return jsonify({"error": "Order not found"}), 404

@app.route('/api/leaderboard/fleischkaese', methods=['GET'])
def get_fleischkaese_leaderboard():
    sorted_leaderboard = sorted(fleischkaese_leaderboard.items(), key=lambda item: item[1]['total'], reverse=True)

    leaderboard_data = []
    for customer, data in sorted_leaderboard:
        leaderboard_data.append({
            "customerName": customer,
            "total": data['total'],
            "details": data['details']
        })

    return jsonify(leaderboard_data), 200

@app.route('/api/leaderboard/fleischkaese/<string:customer_name>', methods=['DELETE'])
def delete_leaderboard_entry(customer_name):
    global fleischkaese_leaderboard
    if customer_name in fleischkaese_leaderboard:
        del fleischkaese_leaderboard[customer_name]
        save_data()
        return jsonify({"message": f"Entry for {customer_name} deleted"}), 200
    return jsonify({"error": "Customer not found"}), 404

@app.route('/api/leaderboard/fleischkaese/<string:customer_name>', methods=['PUT'])
def update_leaderboard_entry(customer_name):
    global fleischkaese_leaderboard
    if customer_name in fleischkaese_leaderboard:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        data = request.get_json()
        new_total = data.get('total')
        if new_total is not None and isinstance(new_total, int):
            fleischkaese_leaderboard[customer_name]['total'] = new_total
            save_data()
            return jsonify({"message": f"Entry for {customer_name} updated"}), 200
        return jsonify({"error": "Invalid data"}), 400
    return jsonify({"error": "Customer not found"}), 404

@app.route('/api/menu_items', methods=['GET'])
def get_menu_items():
    return jsonify(list(menu_items_data.values())), 200

@app.route('/api/menu_items/<string:item_name>/sold_out', methods=['PUT'])
def update_item_sold_out_status(item_name):
    global menu_items_data

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    status_data = request.get_json()
    new_sold_out_status = status_data.get('sold_out')

    if new_sold_out_status is None or not isinstance(new_sold_out_status, bool):
        return jsonify({"error": "Missing or invalid 'sold_out' status"}), 400

    if item_name in menu_items_data:
        menu_items_data[item_name]['sold_out'] = new_sold_out_status
        return jsonify({"message": f"Status von '{item_name}' auf 'ausverkauft': {new_sold_out_status} aktualisiert."}), 200
    else:
        return jsonify({"error": "Artikel nicht gefunden"}), 404

@app.route('/api/acceptance_days', methods=['GET'])
def get_acceptance_days():
    return jsonify(acceptance_days), 200

@app.route('/api/acceptance_days', methods=['POST'])
def update_acceptance_days():
    global acceptance_days
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    new_acceptance_days = data.get('acceptance_days')

    if new_acceptance_days is None or not isinstance(new_acceptance_days, list):
        return jsonify({"error": "Missing or invalid 'acceptance_days' data"}), 400

    acceptance_days = new_acceptance_days
    save_acceptance_days()

    return jsonify({"message": "Acceptance days updated successfully"}), 200

@app.route('/api/total-earnings', methods=['GET'])
def get_total_earnings():
    total_earnings = 0
    for order in orders_db:
        total_earnings += order.get('total_price', 0)
    return jsonify({"total_earnings": total_earnings}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)