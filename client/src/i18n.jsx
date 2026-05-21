import { createContext, useContext, useEffect, useState } from 'react';

// Most UI strings are inline in the components. This file only carries the
// keys still going through t() — the pair-device modal and the install dock.
// When you add a new t() key, remember to add it for all four languages.

const translations = {
  en: {
    add: 'Add',
    cancel: 'Cancel',
    install: 'Install',
    installAppTitle: 'Install OfflineFirst',
    installAppSub: 'Use it like a native app, fully offline.',
    notNow: 'Not now',
    pairDevice: 'Pair device',
    pairTitleSentence: 'Pair devices offline',
    pairBlurb: 'Show this code to another device to share lessons over local WiFi.',
    pairedConfirm: 'Peer added. Sync starting.',
    scanAnotherDevice: 'Scan another device',
    yourDeviceId: 'Your device ID'
  },
  es: {
    add: 'Añadir',
    cancel: 'Cancelar',
    install: 'Instalar',
    installAppTitle: 'Instalar OfflineFirst',
    installAppSub: 'Úsala como una app nativa, sin conexión.',
    notNow: 'Ahora no',
    pairDevice: 'Emparejar dispositivo',
    pairTitleSentence: 'Emparejar dispositivos sin conexión',
    pairBlurb: 'Muestra este código a otro dispositivo para compartir lecciones por WiFi local.',
    pairedConfirm: 'Par añadido. Sincronizando.',
    scanAnotherDevice: 'Escanear otro dispositivo',
    yourDeviceId: 'ID del dispositivo'
  },
  fr: {
    add: 'Ajouter',
    cancel: 'Annuler',
    install: 'Installer',
    installAppTitle: 'Installer OfflineFirst',
    installAppSub: 'Utilise-la comme une appli native, hors ligne.',
    notNow: 'Plus tard',
    pairDevice: 'Appairer un appareil',
    pairTitleSentence: 'Apparier des appareils hors ligne',
    pairBlurb: 'Montre ce code à un autre appareil pour partager les leçons en WiFi local.',
    pairedConfirm: 'Pair ajouté. Synchronisation.',
    scanAnotherDevice: 'Scanner un appareil',
    yourDeviceId: 'ID de l’appareil'
  },
  sw: {
    add: 'Ongeza',
    cancel: 'Ghairi',
    install: 'Sakinisha',
    installAppTitle: 'Sakinisha OfflineFirst',
    installAppSub: 'Itumie kama programu ya kawaida, bila mtandao.',
    notNow: 'Si sasa',
    pairDevice: 'Oanisha kifaa',
    pairTitleSentence: 'Oanisha vifaa bila mtandao',
    pairBlurb: 'Onyesha msimbo huu kwa kifaa kingine kushiriki masomo kupitia WiFi ya ndani.',
    pairedConfirm: 'Mwenza ameongezwa. Inasync.',
    scanAnotherDevice: 'Scan kifaa kingine',
    yourDeviceId: 'ID ya kifaa'
  }
};

export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'sw', label: 'SW', name: 'Kiswahili' }
];

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('offlinefirst_lang') || 'en'
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next) => {
    setLangState(next);
    localStorage.setItem('offlinefirst_lang', next);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] ?? translations.en[key] ?? key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);
