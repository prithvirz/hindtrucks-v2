import { LANGUAGES } from '../../../i18n/languages'
import { CHATBOT_TTS_LANGUAGES } from './ttsLanguages'

describe('chatbot TTS languages', () => {
    it('has one configured TTS language for every app language', () => {
        const appLanguages = LANGUAGES.map((language) => language.code)

        expect(CHATBOT_TTS_LANGUAGES).toEqual(appLanguages)
    })
})
