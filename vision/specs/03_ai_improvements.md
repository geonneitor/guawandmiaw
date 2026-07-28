# 03 AI Assistant Improvements

This spec outlines the structural changes to the AI assistant to give it a better memory, more tools, and screen awareness.

## 1. Tool Amnesia Fix (Full Message History)
**GIVEN** an active conversation with Fígaro
**WHEN** Fígaro executes a tool (like `check_inventory`)
**THEN** the backend must return the entire history of internal tool calls and responses, and the frontend must append them to its state so that subsequent calls to the Groq API retain the context of *how* Fígaro got the data.

## 2. Screen and Context Awareness
**GIVEN** the AI Widget
**WHEN** the user opens it and sends a message
**THEN** the frontend payload must include `context: { path: string, cart: array }`. The backend will inject this into the `system_prompt` so the AI knows exactly what the user is looking at and what's in their cart.

## 3. Expanded Capabilities
**GIVEN** the Groq tools definition
**WHEN** the user asks to register an expense, clear the cart, or get a quick sales summary
**THEN** the AI can invoke the new `register_expense`, `clear_cart`, and `query_sales` tools. `clear_cart` will emit a frontend action `CLEAR_CART` which `useCartStore` will process.

## 4. Improved Inventory Search
**GIVEN** the `check_inventory` tool
**WHEN** the user asks for a product with slight typos
**THEN** the backend will split the query by words and perform a more flexible `ilike` search to return better matches.

---
*Status: Approved for implementation.*
