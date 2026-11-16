USE carbonwise_db;

-- 1. Remove Alex User if exists
DELETE FROM products WHERE seller_id IN (SELECT id FROM users WHERE phone = '9876543210');
DELETE FROM orders WHERE buyer_id IN (SELECT id FROM users WHERE phone = '9876543210');
DELETE FROM recycles WHERE user_id IN (SELECT id FROM users WHERE phone = '9876543210') OR recycler_id IN (SELECT id FROM users WHERE phone = '9876543210');
DELETE FROM users WHERE phone = '9876543210';

-- 2. Upsert Samarth (ROLE_USER, phone 7498591622)
INSERT INTO users (id, name, phone, password, role, city, pin_code, carbon_credits, account_health, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Samarth',
    '7498591622',
    '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    'ROLE_USER',
    'Pune',
    '411001',
    75.00,
    100,
    NOW(6),
    NOW(6)
) ON DUPLICATE KEY UPDATE 
    name = 'Samarth',
    password = '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    role = 'ROLE_USER',
    carbon_credits = 75.00;

-- 3. Reset and guarantee passwords for all test accounts (password123)
-- Recycler
INSERT INTO users (id, name, phone, password, role, city, pin_code, carbon_credits, account_health, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'EcoLoop Recycler',
    '9876543211',
    '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    'ROLE_RECYCLER',
    'Pune',
    '411001',
    0.00,
    100,
    NOW(6),
    NOW(6)
) ON DUPLICATE KEY UPDATE 
    password = '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    role = 'ROLE_RECYCLER';

-- Admin
INSERT INTO users (id, name, phone, password, role, city, pin_code, carbon_credits, account_health, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'System Admin',
    '9876543212',
    '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    'ROLE_ADMIN',
    'Pune',
    '411001',
    0.00,
    100,
    NOW(6),
    NOW(6)
) ON DUPLICATE KEY UPDATE 
    password = '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS',
    role = 'ROLE_ADMIN';

-- Shivaji Zore
UPDATE users 
SET password = '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS', role = 'ROLE_USER' 
WHERE phone = '8999903064';

-- Sambhaji
UPDATE users 
SET password = '$2a$10$0MVfApVlW0v2w55kWx6nx.rplZ36.srDfsGdlYSS/Fexl.uzxQexS', role = 'ROLE_USER' 
WHERE phone = '7498591621';

-- 4. Clean up any broken placeholder products
DELETE FROM products WHERE title = 'Analyzing Image...' OR title IS NULL;

-- 5. Insert Multi-User Marketplace Products
-- Samarth's Listings
INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Apple iPhone 13 Pro (128GB - Graphite)',
    48000.0,
    'SMARTPHONE',
    'Battery health 88%, minor scuffs on stainless steel bezel, original OLED screen. Comes with box and fast charging cable.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '7498591622'),
    'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80',
    'Apple A15 Bionic, 6GB RAM, 128GB NVMe, 6.1-inch Super Retina XDR OLED 120Hz',
    'Micro scratches on edge bezel, clean glass',
    'VERIFIED_WORKING',
    49000.0,
    0,
    1,
    'Verified authentic device. Original packaging confirmed. Safe listing.',
    NOW(6),
    NOW(6)
);

INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Sony WH-1000XM4 Wireless ANC Headphones',
    14500.0,
    'AUDIO',
    'Industry-leading active noise cancellation, clean ear cups, 28hr battery life. Includes hard carry case and aux cable.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '7498591622'),
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    '40mm Dome Drivers, LDAC, Multipoint Bluetooth 5.0, 30hr battery',
    'No visible wear, like-new condition',
    'VERIFIED_WORKING',
    15000.0,
    0,
    0,
    'Original accessories and functional condition verified.',
    NOW(6),
    NOW(6)
);

-- Shivaji Zore's Listings
INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'MacBook Air M1 (8GB / 256GB SSD - Space Gray)',
    52000.0,
    'LAPTOP',
    'Apple M1 Silicon, 93% battery health with 110 charge cycles. Clean keyboard and trackpad. Perfect for coding and productivity.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '8999903064'),
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    'Apple M1 (8-core CPU, 7-core GPU), 8GB Unified Memory, 256GB SSD',
    'Zero dents, pristine display',
    'VERIFIED_WORKING',
    53000.0,
    0,
    1,
    'Device serial and genuine Apple battery cycle count verified.',
    NOW(6),
    NOW(6)
);

INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Apple iPad Air 4th Gen (64GB Wi-Fi - Sky Blue)',
    28500.0,
    'TABLET',
    'Liquid Retina display with Apple Pencil 2 support. Slight cosmetic scratch on rear corner, zero dead pixels.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '8999903064'),
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
    'Apple A14 Bionic, 10.9-inch Liquid Retina Display, Touch ID on top button',
    'Single 2mm surface scratch near speaker grill',
    'VERIFIED_WORKING',
    30000.0,
    0,
    1,
    'Screen integrity verified without cracks or light bleed.',
    NOW(6),
    NOW(6)
);

INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'NVIDIA GeForce RTX 3070 Founders Edition (8GB)',
    26000.0,
    'PC_COMPONENT',
    'Clean card used strictly for gaming, fresh Arctic MX-4 thermal paste applied, runs under 68°C under FurMark stress test.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '8999903064'),
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
    '8GB GDDR6, 256-bit, PCIe 4.0, 5888 CUDA Cores, HDMI 2.1 + 3x DisplayPort 1.4a',
    'Minor dust on fin stack, all fan blades intact',
    'VERIFIED_WORKING',
    27000.0,
    0,
    2,
    'Thermal benchmark logs and power draw confirmed normal.',
    NOW(6),
    NOW(6)
);

-- Sambhaji's Listings
INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Samsung Galaxy S22 Ultra 5G (256GB - Phantom Black)',
    44000.0,
    'SMARTPHONE',
    'Dynamic AMOLED 2X 120Hz display with built-in S-Pen. Pristine condition with tempered glass protector installed from day 1.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '7498591621'),
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80',
    'Snapdragon 8 Gen 1, 12GB RAM, 256GB Storage, 108MP Quad Camera, 5000mAh Battery',
    'No dents or scratches, flawless screen',
    'VERIFIED_WORKING',
    46000.0,
    0,
    1,
    'Valid IMEI, knox warranty status intact (0x0). Safe listing.',
    NOW(6),
    NOW(6)
);

INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Dell UltraSharp 27" 4K USB-C Hub Monitor (U2720Q)',
    22000.0,
    'PC_COMPONENT',
    '90W USB-C Power Delivery, factory-calibrated 99% sRGB / 95% DCI-P3 gamut. Stand supports tilt, swivel, pivot, and height adjust.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '7498591621'),
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
    '3840 x 2160 at 60Hz, IPS Panel, HDR 400, USB-C 90W PD, DisplayPort 1.4, HDMI 2.0',
    'Zero dead pixels, minor scuff on base stand',
    'VERIFIED_WORKING',
    23000.0,
    0,
    0,
    'Uniform backlight with zero dead pixels verified.',
    NOW(6),
    NOW(6)
);

INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Apple Watch Series 7 (45mm GPS - Midnight Aluminum)',
    17000.0,
    'SMARTWATCH',
    'Always-On Retina display, ECG & blood oxygen sensor fully functional. Comes with Midnight Sport Band and original magnetic charger.',
    'ACTIVE',
    (SELECT id FROM users WHERE phone = '7498591621'),
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    'Apple S7 SiP, 45mm OLED, 32GB Storage, 50m water resistant, 89% battery health',
    'Light surface hairline mark on edge of sapphire glass',
    'VERIFIED_WORKING',
    18000.0,
    0,
    1,
    'iCloud unlocked and paired reset verified.',
    NOW(6),
    NOW(6)
);

-- 6. Insert 1 Flagged Listing for Admin Review Console
INSERT INTO products (id, title, price, category, description, status, seller_id, image_url, hardware_specs, cosmetic_defects, functional_status, estimated_price_inr, is_stock_photo_or_fake, scam_probability1_to10, ai_fraud_reasoning, created_at, updated_at)
VALUES (
    UUID_TO_BIN(UUID()),
    'Brand New iPhone 15 Pro Max 1TB - Sealed Box Only Rs 15000',
    15000.0,
    'SMARTPHONE',
    'Brand new urgent sale factory sealed pack. Pay advance to book.',
    'PENDING_ADMIN_REVIEW',
    (SELECT id FROM users WHERE phone = '7498591622'),
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    'Unknown specs',
    'Unverified packaging',
    'UNVERIFIABLE',
    150000.0,
    1,
    9,
    'High Risk Flag: Price is 90% below standard refurbished market value. Demands advance payment off-escrow. Stock photo detected.',
    NOW(6),
    NOW(6)
);

-- 7. Insert 2 Sample Recycling Tasks for Recycler Kanban Console
INSERT INTO recycles (id, user_id, product_name, weight_kg, device_type, status, image_url, created_at)
VALUES (
    UUID_TO_BIN(UUID()),
    (SELECT id FROM users WHERE phone = '7498591622'),
    'Broken Dell OptiPlex PC & CRT Monitor',
    14.2,
    'PC_COMPONENT',
    'PENDING',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80',
    NOW(6)
);

INSERT INTO recycles (id, user_id, product_name, weight_kg, device_type, status, image_url, created_at)
VALUES (
    UUID_TO_BIN(UUID()),
    (SELECT id FROM users WHERE phone = '8999903064'),
    'Dead HP LaserJet All-in-One Printer',
    8.5,
    'UNSUPPORTED',
    'PENDING',
    'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&q=80',
    NOW(6)
);
