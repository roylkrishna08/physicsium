import { ref, computed } from 'vue'
import { translations } from '../i18n/translations.js'

const currentLang = ref('en')

export function useLanguage() {
    const toggleLanguage = () => {
        currentLang.value = currentLang.value === 'en' ? 'hi' : 'en'
    }

    const setLanguage = (lang) => {
        if (['en', 'hi'].includes(lang)) {
            currentLang.value = lang
        }
    }

    const t = (path, params = {}) => {
        const keys = path.split('.')
        let text = translations[currentLang.value]

        for (const key of keys) {
            if (text && text[key]) {
                text = text[key]
            } else {
                return path // Fallback to key if not found
            }
        }

        // Simple interpolation for {param}
        if (typeof text === 'string') {
            Object.keys(params).forEach(key => {
                text = text.replace(`{${key}}`, params[key])
            })
        }

        return text
    }

    return {
        currentLang,
        toggleLanguage,
        setLanguage,
        t
    }
}
