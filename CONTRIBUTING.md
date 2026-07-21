# 🤝 Contributing to Guaw & Miaw V3

## 1. Regla de Oro
La **única fuente de verdad** sobre el diseño, arquitectura y lógica de negocio está en `PROJECT_ARCHITECTURE.md`. Si dudas sobre alguna implementación (ej. manejo de bultos a granel o la paleta de colores Midnight Rose), revisa ese archivo.

## 2. Desarrollo Frontend (React/Vite)
- Utiliza **TailwindCSS** para los estilos, respetando la paleta "Midnight Rose" (Tonos de rosa pastel y blanco-crema).
- El estado global está manejado con **Zustand**.
- Para animaciones, prioriza el uso de **Framer Motion**.

## 3. Desarrollo Backend (Flask)
- La base de datos vive en **Supabase** (PostgreSQL). No utilizamos SQLite.
- Asegúrate de devolver respuestas en formato JSON estándar para que el cliente (React) pueda consumirlas de forma predecible.
- Protege los endpoints usando JWT (`flask_jwt_extended`).

## 4. Prompt Base para IA
Si inicias una nueva sesión con una IA, copia y pega esto:
> "Hola. Estamos trabajando en el proyecto Guaw & Miaw V3. Por favor, lee detalladamente `PROJECT_ARCHITECTURE.md`. Mi prioridad es mantener la arquitectura de Supabase (DB) + React (Frontend), y aplicar la estética Midnight Rose."
