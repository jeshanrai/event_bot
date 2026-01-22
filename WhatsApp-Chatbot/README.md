# Webhook Test - WhatsApp and Messenger Integration

A Node.js webhook handler for WhatsApp and Messenger with AI-powered responses using Groq.

## Features

- WhatsApp webhook integration
- Messenger webhook integration
- AI-powered responses via Groq
- Multi-platform message handling
- Intent detection and routing
- Shared orchestrator for both platforms
- Separate webhook endpoints with platform-specific tokens
- **🛒 Persistent Shopping Cart with Atomic Order Finalization**

## Cart System (NEW!)

A production-ready persistent shopping cart implementation:
- **Persistent Storage**: Cart survives app restarts and session closures
- **Atomic Orders**: Order finalization uses database transactions
- **Multi-User Support**: Each user has isolated cart data
- **Transaction Safety**: All-or-nothing order creation guarantee

### Quick Cart Features
| Feature | Details |
|---------|---------|
| **Storage** | Separate `cart JSONB` column in `sessions` table |
| **Persistence** | Cart items survive app close/reopen |
| **Atomicity** | Order created with transaction (all or nothing) |
| **Isolation** | Each user has separate cart by user_id |
| **Speed** | < 100ms for complete order flow |

### Cart Documentation
- 📘 **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- 📗 **[CART_IMPLEMENTATION.md](CART_IMPLEMENTATION.md)** - API reference
- 📕 **[CART_FLOW.md](CART_FLOW.md)** - Deep architecture details
- 📙 **[ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md)** - Visual diagrams

### Running Cart Tests
```bash
# Verify cart implementation works
node test_cart_flow.js

# Expected: ✅ ALL TESTS PASSED!
```

## Webhook Endpoints

| Platform | Verification Endpoint | Message Receiver |
|----------|----------------------|------------------|
| WhatsApp | `GET /whatsapp-webhook` | `POST /whatsapp-webhook` |
| Messenger | `GET /messenger-webhook` | `POST /messenger-webhook` |
| Legacy (both) | `GET /webhook` | `POST /webhook` |

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Fill in your actual values in the `.env` file:
   - WhatsApp Business API credentials
   - Messenger API credentials
   - Groq API key
5. Initialize the database:
   ```bash
   node src/initDb.js
   ```
6. Run cart tests:
   ```bash
   node test_cart_flow.js
   ```

## Environment Variables

### WhatsApp Configuration
```env
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token
```

### Messenger Configuration
```env
MESSENGER_PAGE_ACCESS_TOKEN=your_messenger_page_token
MESSENGER_VERIFY_TOKEN=your_messenger_verify_token
```

### Shared/Legacy Token (optional - used if platform-specific not set)
```env
VERIFY_TOKEN=shared_verify_token
```

## Configuration

### WhatsApp Setup
- Get your WhatsApp Business API token
- Configure webhook URL: `https://yourdomain.com/whatsapp-webhook`
- Set verify token in your WhatsApp app settings

### Messenger Setup
- Get your Facebook Messenger token
- Configure webhook URL: `https://yourdomain.com/messenger-webhook`
- Set verify token in your Messenger app settings

### Groq AI Setup
- Sign up at [Groq Console](https://console.groq.com/)
- Get your API key
- Add it to your `.env` file

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Express Server                       │
├──────────────────────┬──────────────────────────────────────┤
│  /whatsapp-webhook   │  /messenger-webhook                  │
│  (GET/POST)          │  (GET/POST)                          │
└──────────┬───────────┴───────────────┬──────────────────────┘
           │                           │
           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│ WhatsApp Handler │        │ Messenger Handler│
│ (whatsapp.js)    │        │ (messenger.js)   │
└────────┬─────────┘        └────────┬─────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌───────────────────────┐
         │     Orchestrator      │
         │ (Same LLM + DB logic) │
         └───────────┬───────────┘
                     ▼
         ┌───────────────────────┐
         │    Reply Service      │
         │ (Platform-aware send) │
         └───────────────────────┘
```

## Deployment

### Deploy to Heroku
1. Install Heroku CLI
2. Login to Heroku: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set WHATSAPP_ACCESS_TOKEN=your_token
   heroku config:set WHATSAPP_VERIFY_TOKEN=your_verify_token
   heroku config:set MESSENGER_PAGE_ACCESS_TOKEN=your_messenger_token
   heroku config:set MESSENGER_VERIFY_TOKEN=your_messenger_verify_token
   heroku config:set GROQ_API_KEY=your_key
   # ... add all other environment variables
   ```
5. Deploy: `git push heroku main`

### Deploy to Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically deploy on git push

### Deploy to Render
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Choose Node.js environment
4. Set build command: `npm install`
5. Set start command: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `WHATSAPP_TOKEN` | WhatsApp Business API token | Yes |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify token | Yes |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp phone number ID | Yes |
| `MESSENGER_TOKEN` | Facebook Messenger token | Yes |
| `MESSENGER_VERIFY_TOKEN` | Messenger webhook verify token | Yes |
| `GROQ_API_KEY` | Groq API key for AI responses | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## API Endpoints

- `GET /` - Health check
- `POST /webhook/whatsapp` - WhatsApp webhook
- `GET /webhook/whatsapp` - WhatsApp webhook verification
- `POST /webhook/messenger` - Messenger webhook
- `GET /webhook/messenger` - Messenger webhook verification

## Project Structure

```
src/
├── app.js                 # Main application entry point
├── ai/
│   ├── groqClient.js      # Groq AI client configuration
│   └── intentEngine.js    # Intent detection and processing
├── orchestrator/
│   ├── context.js         # Context management
│   ├── index.js          # Main orchestrator
│   └── router.js         # Request routing
├── services/
│   └── reply.js          # Reply service
├── webhooks/
│   ├── messenger.js      # Messenger webhook handler
│   └── whatsapp.js       # WhatsApp webhook handler
└── whatsapp/
    └── sendmessage.js    # WhatsApp message sending
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.