const i18n = {
    use: () => i18n,
    init: () => i18n,
    t: (key: string) => key,
    language: 'en',
    changeLanguage: () => { },
    on: () => { },
    off: () => { },
    addResourceBundle: () => { },
    addResources: () => { },
    hasResourceBundle: () => true,
    getResource: () => ({}),
    getResourceBundle: () => ({}),
    removeResourceBundle: () => { },
    loadNamespaces: () => Promise.resolve(),
    loadLanguages: () => Promise.resolve(),
    reloadResources: () => Promise.resolve(),
    setDefaultNamespace: () => { },
    dir: () => 'ltr',
    createInstance: () => i18n,
    cloneInstance: () => i18n,
    getDataByLanguage: () => ({}),
    store: {
        data: {},
        options: {},
        on: () => { },
        off: () => { },
        emit: () => { },
    },
    services: {
        resourceStore: {
            data: {},
        },
        languageUtils: {
            toResolveHierarchy: () => ['en'],
        },
        pluralResolver: {},
        backendConnector: {},
        languageDetector: {},
        interpolator: {},
        formatter: {},
        logger: {},
    },
    isInitialized: true,
    options: {
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        detection: undefined,
        resources: { en: { translation: {} } },
    },
    resolvedLanguage: 'en',
    modules: {
        external: [],
    },
    emitter: {
        on: () => { },
        off: () => { },
        emit: () => { },
    },
    format: (value: unknown) => String(value),
}

export default i18n
export { i18n }