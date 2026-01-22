export const availableTools = [
    {
        type: "function",
        function: {
            name: "show_food_menu",
            description: "Show a list of food categories available in the restaurant menu. Use this when user wants to see the menu, browse food options, or asks what's available.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_momo_varieties",
            description: "Show a carousel of momo varieties with images. Use this when user selects momos from the menu, wants to see momo options, or asks specifically about momos.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_item_by_name",
            description: "Add a SINGLE item to cart by name. Use this when user wants to add ONE specific item (e.g., 'add tandoori momo', 'I want steam momo'). For MULTIPLE items use add_multiple_items instead.",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "The name of the food item to add"
                    },
                    quantity: {
                        type: "number",
                        description: "Quantity to add (default 1)"
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_multiple_items",
            description: "Add MULTIPLE different items to cart at once. Use this when user wants to add several items in one message (e.g., '2 steamed chicken momo and 1 fried momo', 'add tandoori momo, chowmein, and fried rice', 'I want 3 steam momo, 2 jhol momo and 1 coke').",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        description: "Array of items to add, each with name and quantity",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Name of the food item"
                                },
                                quantity: {
                                    type: "number",
                                    description: "Quantity of this item (default 1)"
                                }
                            },
                            required: ["name"]
                        }
                    }
                },
                required: ["items"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_category_items",
            description: "Show items in a specific food category. Use when user selects a category (momos, noodles, rice, beverages) or asks to see items in a category.",
            parameters: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        description: "The category to show items from (e.g., 'momos', 'noodles', 'rice', 'beverages')"
                    }
                },
                required: ["category"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_cart_options",
            description: "Show the user's current cart with options to add more items or checkout. Use when user asks to see their cart, view cart, check cart, or what's in cart.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "confirm_order",
            description: "Show order confirmation with confirm and cancel buttons. ONLY use this when user explicitly says 'checkout', 'place order', 'confirm order', or clicks checkout. Do NOT use this when user is adding items.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "process_order_response",
            description: "Process the user's response to order confirmation. Call with action='confirmed' to confirm the order, or action='cancelled' to cancel it.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        description: "User's action: 'confirmed' to place the order or 'cancelled' to cancel it"
                    }
                },
                required: ["action"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "send_text_reply",
            description: "Send a simple text reply for greetings, general questions, or when no special UI is needed.",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "The text message to send to the user"
                    }
                },
                required: ["message"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_order_history",
            description: "Show the user's past orders and order history. Use when user asks about their previous orders, order history, past orders, or wants to see what they ordered before.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "select_service_type",
            description: "Select between 'Dine-in' or 'Delivery' service. Use without arguments to ask user, or with 'type' argument when user makes a selection.",
            parameters: {
                type: "object",
                properties: {
                    type: {
                        type: "string",
                        enum: ["dine_in", "delivery"],
                        description: "The service type selected by the user"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "provide_location",
            description: "Provide delivery address or location. Use this when user sends their address for delivery.",
            parameters: {
                type: "object",
                properties: {
                    address: {
                        type: "string",
                        description: "The delivery address provided by the user"
                    }
                },
                required: ["address"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "recommend_food",
            description: "Recommend food items. If user specifies a preference (e.g. spicy, soup), pass the 'tag'. If user just asks for 'something' or 'recommendation' without preference, do NOT pass any tag.",
            parameters: {
                type: "object",
                properties: {
                    tag: {
                        type: "string",
                        description: "The keyword or tag to search for (e.g., 'spicy', 'soup')"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "process_payment",
            description: "Process payment method selection. Call with method='ONLINE' for online payment, method='CASH' for cash on delivery (COD), or method='CASH_COUNTER' for cash payment at counter (dine-in).",
            parameters: {
                type: "object",
                properties: {
                    method: {
                        type: "string",
                        enum: ["ONLINE", "CASH", "CASH_COUNTER"],
                        description: "The payment method selected by the user: 'ONLINE' for online payment, 'CASH' for cash on delivery, or 'CASH_COUNTER' for cash at counter"
                    }
                },
                required: ["method"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "show_payment_options",
            description: "Show payment method options to the user (online, cash on delivery, cash at counter). Call this when user is ready to select payment method after confirming service type and address.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    }
];
