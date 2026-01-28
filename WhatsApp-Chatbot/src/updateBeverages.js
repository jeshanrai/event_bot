
import db from './db.js';

const seedData = \`
INSERT INTO foods (restaurant_id, name, description, price, category, image_url, available) VALUES
(1, 'Flat White', 'Classic Australian coffee with velvety microfoam and rich espresso.', 4.50, 'Beverages', 'images/flat_white.jpg', true),
(1, 'Long Black', 'Hot water topped with a double shot of espresso for a strong flavor.', 4.00, 'Beverages', 'images/long_black.jpg', true),
(1, 'Cappuccino', 'Espresso with steamed milk and a thick layer of foam, dusted with cocoa.', 4.80, 'Beverages', 'images/cappuccino.jpg', true),
(1, 'Iced Coffee (Aussie Style)', 'Chilled coffee served with milk, ice cream, and whipped cream.', 6.50, 'Beverages', 'images/iced_coffee.jpg', true),
(1, 'Milo Drink', 'Hot chocolate malt drink loved across Australia.', 3.50, 'Beverages', 'images/milo.jpg', true),
(1, 'Lemon Lime Bitters', 'Refreshing mix of lemon squash, lime cordial, and bitters.', 4.20, 'Beverages', 'images/lemon_lime_bitters.jpg', true),
(1, 'Bundaberg Ginger Beer', 'Famous Australian brewed ginger beer, non-alcoholic.', 3.80, 'Beverages', 'images/ginger_beer.jpg', true),
(1, 'Chai Latte', 'Spiced tea latte with steamed milk and cinnamon aroma.', 4.60, 'Beverages', 'images/chai_latte.jpg', true),
(1, 'Iced Chocolate', 'Cold chocolate drink topped with whipped cream and chocolate syrup.', 5.80, 'Beverages', 'images/iced_chocolate.jpg', true),
(1, 'Affogato', 'Vanilla ice cream topped with a shot of hot espresso.', 5.20, 'Beverages', 'images/affogato.jpg', true);
\`;

async function updateBeverages() {
    console.log('🚀 Updating Beverages...');
    try {
        // Delete existing beverages
        console.log('🗑️ Removing old beverages...');
        await db.query("DELETE FROM foods WHERE category = 'Beverages' OR category = 'beverages'");
        
        // Insert new ones
        console.log('🌱 Inserting new Australian beverages...');
        await db.query(seedData);
        
        console.log('✅ Beverages updated successfully!');
        
        const res = await db.query("SELECT name, price FROM foods WHERE category = 'Beverages'");
        console.table(res.rows);
        
    } catch (error) {
        console.error('❌ Error updating beverages:', error);
    } finally {
        await db.end();
    }
}

updateBeverages();
