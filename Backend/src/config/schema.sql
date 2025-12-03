-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'customer',
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MENU ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  type VARCHAR(50) DEFAULT 'food',
  availability BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CARTS + CART ITEMS
-- ==========================================
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cart_id, item_id)
);

-- ==========================================
-- RESTAURANT TABLES (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id SERIAL PRIMARY KEY,
  table_number INT UNIQUE NOT NULL,
  seats INT DEFAULT 4,
  is_occupied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDERS TABLE (UPDATED WITH table_id)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_id INT REFERENCES restaurant_tables(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'pending',  -- removed FK
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, item_id)
);

-- ==========================================
-- PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CHAT TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DEMO DATA
-- ==========================================

-- USERS
INSERT INTO users (name, email, phone, role, password) VALUES
('Admin User', 'admin@example.com', '1112223333', 'admin', 'adminpass'),
('Customer One', 'customer1@example.com', '4445556666', 'customer', 'custpass1'),
('Customer Two', 'customer2@example.com', '7778889999', 'customer', 'custpass2'),
('Support Bot', 'bot@example.com', NULL, 'bot', 'botpass');

-- MENU ITEMS
INSERT INTO menu_items (name, price, description, category, type, availability, image_url) VALUES
('Burger', 12.50, 'Classic beef burger with cheese and fries', 'Main Course', 'food', TRUE, '/images/burger.jpg'),
('Pizza Margherita', 15.00, 'Tomato, mozzarella, basil', 'Main Course', 'food', TRUE, '/images/pizza.jpg'),
('Caesar Salad', 9.75, 'Fresh salad with Caesar dressing', 'Appetizer', 'food', TRUE, '/images/salad.jpg'),
('Coca-Cola', 2.50, 'Refreshing soda', 'Beverage', 'drink', TRUE, '/images/coke.jpg'),
('Cheesecake', 6.00, 'New York style cheesecake', 'Dessert', 'food', TRUE, '/images/cheesecake.jpg');

-- RESTAURANT TABLES
INSERT INTO restaurant_tables (table_number, seats, is_occupied)
VALUES
(1, 4, FALSE),
(2, 4, FALSE),
(3, 2, FALSE),
(4, 6, FALSE),
(5, 4, FALSE),
(6, 2, FALSE),
(7, 8, FALSE),
(8, 4, FALSE);

-- ORDERS
INSERT INTO orders (user_id, table_id, total_amount, payment_method, status)
VALUES
(2, 1, 28.25, 'cash', 'pending'),
(3, 3, 15.00, 'card', 'accepted'),
(2, 5, 9.75, 'cash', 'preparing'),
(3, 2, 18.50, 'online', 'delivered'),
(2, 4, 6.00, 'cash', 'ready');

-- ORDER ITEMS (SAFE UPSERT)
INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (1, 1, 1, 12.50)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (1, 4, 1, 2.50)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (1, 3, 1, 9.75)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (2, 2, 1, 15.00)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (3, 3, 1, 9.75)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (4, 1, 1, 12.50)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (4, 4, 2, 2.50)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;

INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (5, 5, 1, 6.00)
ON CONFLICT (order_id, item_id) DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity;
