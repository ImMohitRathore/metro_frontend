# Internationalization (i18n) Setup

This project uses `react-i18next` and `i18next` for internationalization support.

## Supported Languages

- **English (en)** - Default language
- **Hindi (hi)** - हिंदी

## File Structure

```
locales/
├── en/
│   └── common.json    # English translations
├── hi/
│   └── common.json    # Hindi translations
└── README.md         # This file
```

## Usage in Components

### Basic Usage

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### Change Language

```tsx
import { useTranslation } from '@/hooks/useTranslation';

export default function MyComponent() {
  const { changeLanguage, currentLanguage } = useTranslation();
  
  return (
    <div>
      <p>Current language: {currentLanguage}</p>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('hi')}>हिंदी</button>
    </div>
  );
}
```

## Translation Keys Structure

Translation keys are organized by feature:

- `common.*` - Common UI elements (buttons, labels, etc.)
- `auth.*` - Authentication related
- `chat.*` - Chat/messaging features
- `profile.*` - User profiles
- `notifications.*` - Notifications
- `navbar.*` - Navigation bar

## Adding New Translations

1. Add the key-value pair to both `en/common.json` and `hi/common.json`
2. Use the key in your component with `t('namespace.key')`

Example:
```json
// locales/en/common.json
{
  "common": {
    "myNewKey": "My New Text"
  }
}

// locales/hi/common.json
{
  "common": {
    "myNewKey": "मेरा नया टेक्स्ट"
  }
}
```

Then use it:
```tsx
{t('common.myNewKey')}
```

## Language Switcher

The `LanguageSwitcher` component is already added to the Navbar. It allows users to switch between English and Hindi.

## Language Persistence

The selected language is automatically saved to `localStorage` and will be restored on page reload.
