import json
import os

SETTINGS_FILE = os.path.join(os.path.dirname(__file__), 'store_settings.json')

DEFAULT_SETTINGS = {
    'store_name': 'Guaw & Miaw',
    'phone': '555-0123',
    'address': 'Av. Principal #123, Colonia Centro',
    'email': '',
    'rfc': '',
    'instagram': '',
}

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r', encoding='utf-8') as f:
            return {**DEFAULT_SETTINGS, **json.load(f)}
    return DEFAULT_SETTINGS.copy()

def save_settings(data):
    current = load_settings()
    current.update({k: v for k, v in data.items() if k in DEFAULT_SETTINGS})
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(current, f, ensure_ascii=False, indent=2)
    return current
