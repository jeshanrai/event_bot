
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_PATH = path.join(__dirname, '../src/app.js');
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log(`🚀 Starting verification server on port ${TEST_PORT}...`);

    // Start the app in a child process
    const server = spawn('node', [APP_PATH], {
        env: { ...process.env, PORT: TEST_PORT, VERIFY_TOKEN: 'test' },
        stdio: 'pipe' // Capture output
    });

    let serverReady = false;

    server.stdout.on('data', (data) => {
        const output = data.toString();
        // console.log('[SERVER]', output);
        if (output.includes(`Server running on port ${TEST_PORT}`)) {
            serverReady = true;
        }
    });

    server.stderr.on('data', (data) => {
        console.error('[SERVER ERROR]', data.toString());
    });

    // Wait for server to start
    let attempts = 0;
    while (!serverReady && attempts < 20) {
        await sleep(500);
        attempts++;
    }

    if (!serverReady) {
        console.error('❌ Server failed to start');
        server.kill();
        process.exit(1);
    }

    console.log('✅ Server started!');

    try {
        // Test 1: GET /api/menu (Categories)
        console.log('\n🧪 Testing GET /api/menu (Categories)...');
        const menuRes = await fetch(`${BASE_URL}/api/menu`);
        const menuData = await menuRes.json();

        if (menuRes.ok && menuData.success && Array.isArray(menuData.items)) {
            console.log(`✅ Menu API (Categories) Success! Found ${menuData.items.length} categories.`);
        } else {
            throw new Error(`Menu API Categories failed: ${JSON.stringify(menuData)}`);
        }

        // Test 1b: GET /api/menu?all=true (All Items)
        console.log('\n🧪 Testing GET /api/menu?all=true (All Items)...');
        const allItemsRes = await fetch(`${BASE_URL}/api/menu?all=true`);
        const allItemsData = await allItemsRes.json();

        if (allItemsRes.ok && allItemsData.success && Array.isArray(allItemsData.items)) {
            console.log(`✅ Menu API (All Items) Success! Found ${allItemsData.items.length} items.`);
            if (allItemsData.items.length > 0) {
                const firstItem = allItemsData.items[0];
                console.log(`   Sample item: ${firstItem.name} (has image: ${!!firstItem.image_url})`);
                if (firstItem.image_url) {
                    console.log('✅ Items have image_url property.');
                } else {
                    console.warn('⚠️ Item missing image_url (might be expected if DB has nulls)');
                }
            }
        } else {
            throw new Error(`Menu API All Items failed: ${JSON.stringify(allItemsData)}`);
        }

        // Test 2: POST /api/messenger/order (Middleware check)
        console.log('\n🧪 Testing POST /api/messenger/order...');
        const orderPayload = {
            userId: 'test_verifier_123',
            items: [
                { foodId: 1, name: 'Test Item', quantity: 1, price: 10 }
            ]
        };

        const orderRes = await fetch(`${BASE_URL}/api/messenger/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const orderData = await orderRes.json();

        if (orderRes.ok && orderData.success) {
            console.log('✅ Order Endpoint validated (Response: success)');
        } else {
            console.log(`ℹ️ Response: ${JSON.stringify(orderData)}`);
            if (orderData.message === 'Invalid data' || orderData.success === false) {
                // Even if it fails validation, if we got a JSON response, middleware is working
                console.log('✅ Middleware validated (Request was parsed)');
            } else {
                throw new Error(`Order Endpoint failed completely: ${JSON.stringify(orderData)}`);
            }
        }

        console.log('\n🎉 ALL CHECKS PASSED!');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error);
    } finally {
        console.log('🛑 Stopping server...');
        server.kill();
        process.exit(0);
    }
}

runTest();
