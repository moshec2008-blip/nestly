import type { AppLanguage } from "@/i18n/config";
import { brand } from "@/lib/branding";

export type CommonDictionary = {
  appName: string;
  tagline: string;
  workspaceLabel: string;
  home: string;
  nav: Record<
    | "home"
    | "finance"
    | "tasks"
    | "dashboard"
    | "health"
    | "documents"
    | "vehicles"
    | "family"
    | "birthdays"
    | "shopping"
    | "permissions"
    | "settings",
    string
  >;
  hero: {
    badge: string;
    description: string;
    dailyReview: string;
    tasks: string;
    finance: string;
    stats: {
      activeModules: string;
      localStorage: string;
      systemStatus: string;
      active: string;
      healthy: string;
    };
  };
  dashboard: {
    modules: string;
    workspaceAreas: string;
    whatCanDo: string;
  };
  searchPlaceholder: string;
  searchLabel: string;
  noSearchResults: string;
  notifications: string;
  noNotifications: string;
  openMenu: string;
  closeMenu: string;
  expandSidebar: string;
  collapseSidebar: string;
  language: string;
  currentLanguage: string;
  comingSoon: string;
};

export const dictionaries: Record<AppLanguage, CommonDictionary> = {
  he: {
    appName: brand.productName,
    tagline: brand.taglineHe,
    workspaceLabel: "מרחב משפחתי",
    home: "בית",
    nav: {
      home: "בית",
      finance: "כספים",
      tasks: "משימות",
      dashboard: "סקירה",
      health: "בריאות",
      documents: "מסמכים",
      vehicles: "רכבים",
      family: "משפחה",
      birthdays: "ימי הולדת",
      shopping: "קניות",
      permissions: "הרשאות",
      settings: "הגדרות",
    },
    hero: {
      badge: brand.taglineHe,
      description: `מרחב משפחתי: ${brand.workspaceName}. כספים, משימות, מסמכים, בריאות, רכבים וניהול משפחתי במקום אחד שקט, ברור ומוכן לשימוש יומיומי.`,
      dailyReview: "סקירה יומית",
      tasks: "משימות",
      finance: "כספים",
      stats: {
        activeModules: "מודולים פעילים",
        localStorage: "שמירה מקומית",
        systemStatus: "מצב מערכת",
        active: "פעילה",
        healthy: "תקין",
      },
    },
    dashboard: {
      modules: "מודולים",
      workspaceAreas: "אזורי עבודה",
      whatCanDo: "מה אפשר לעשות עכשיו",
    },
    searchPlaceholder: "חיפוש בכל הבית",
    searchLabel: "חיפוש גלובלי",
    noSearchResults: "לא נמצאו תוצאות",
    notifications: "התראות",
    noNotifications: "אין התראות חדשות כרגע",
    openMenu: "פתח תפריט",
    closeMenu: "סגור תפריט",
    expandSidebar: "הרחב תפריט צד",
    collapseSidebar: "כווץ תפריט צד",
    language: "שפה",
    currentLanguage: "שפה נוכחית",
    comingSoon: "בקרוב",
  },
  en: {
    appName: brand.productName,
    tagline: brand.taglineEn,
    workspaceLabel: "Family workspace",
    home: "Home",
    nav: {
      home: "Home",
      finance: "Finance",
      tasks: "Tasks",
      dashboard: "Overview",
      health: "Health",
      documents: "Documents",
      vehicles: "Vehicles",
      family: "Family",
      birthdays: "Birthdays",
      shopping: "Shopping",
      permissions: "Sharing",
      settings: "Settings",
    },
    hero: {
      badge: brand.taglineEn,
      description: `Family workspace: ${brand.workspaceName}. Finance, tasks, documents, health, vehicles and everyday family management in one calm place.`,
      dailyReview: "Daily review",
      tasks: "Tasks",
      finance: "Finance",
      stats: {
        activeModules: "Active modules",
        localStorage: "Local storage",
        systemStatus: "System status",
        active: "Active",
        healthy: "Healthy",
      },
    },
    dashboard: {
      modules: "Modules",
      workspaceAreas: "Work areas",
      whatCanDo: "What can we do now",
    },
    searchPlaceholder: "Search the family system",
    searchLabel: "Global search",
    noSearchResults: "No results found",
    notifications: "Notifications",
    noNotifications: "No new notifications right now",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    language: "Language",
    currentLanguage: "Current language",
    comingSoon: "Coming soon",
  },
  fr: {
    appName: brand.productName,
    tagline: "Toute la famille. Au même endroit.",
    workspaceLabel: "Espace familial",
    home: "Accueil",
    nav: {
      home: "Accueil",
      finance: "Finances",
      tasks: "Tâches",
      dashboard: "Vue d’ensemble",
      health: "Santé",
      documents: "Documents",
      vehicles: "Véhicules",
      family: "Famille",
      birthdays: "Anniversaires",
      shopping: "Courses",
      permissions: "Partage",
      settings: "Réglages",
    },
    hero: {
      badge: "Toute la famille. Au même endroit.",
      description: `Espace familial : ${brand.workspaceName}. Finances, tâches, documents, santé, véhicules et gestion familiale au même endroit.`,
      dailyReview: "Revue du jour",
      tasks: "Tâches",
      finance: "Finances",
      stats: {
        activeModules: "Modules actifs",
        localStorage: "Stockage local",
        systemStatus: "État du système",
        active: "Actif",
        healthy: "Opérationnel",
      },
    },
    dashboard: {
      modules: "modules",
      workspaceAreas: "Espaces de travail",
      whatCanDo: "Que peut-on faire maintenant",
    },
    searchPlaceholder: "Rechercher",
    searchLabel: "Recherche globale",
    noSearchResults: "Aucun résultat",
    notifications: "Notifications",
    noNotifications: "Aucune nouvelle notification",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    expandSidebar: "Agrandir la barre latérale",
    collapseSidebar: "Réduire la barre latérale",
    language: "Langue",
    currentLanguage: "Langue actuelle",
    comingSoon: "Bientôt",
  },
  ru: {
    appName: brand.productName,
    tagline: "Вся семья. В одном месте.",
    workspaceLabel: "Семейное пространство",
    home: "Главная",
    nav: {
      home: "Главная",
      finance: "Финансы",
      tasks: "Задачи",
      dashboard: "Обзор",
      health: "Здоровье",
      documents: "Документы",
      vehicles: "Авто",
      family: "Семья",
      birthdays: "Дни рождения",
      shopping: "Покупки",
      permissions: "Доступ",
      settings: "Настройки",
    },
    hero: {
      badge: "Вся семья. В одном месте.",
      description: `Семейное пространство: ${brand.workspaceName}. Финансы, задачи, документы, здоровье, автомобили и семейные дела в одном спокойном месте.`,
      dailyReview: "Обзор дня",
      tasks: "Задачи",
      finance: "Финансы",
      stats: {
        activeModules: "Активные модули",
        localStorage: "Локальное хранение",
        systemStatus: "Состояние системы",
        active: "Активно",
        healthy: "В норме",
      },
    },
    dashboard: {
      modules: "модулей",
      workspaceAreas: "Рабочие зоны",
      whatCanDo: "Что можно сделать сейчас",
    },
    searchPlaceholder: "Поиск",
    searchLabel: "Глобальный поиск",
    noSearchResults: "Ничего не найдено",
    notifications: "Уведомления",
    noNotifications: "Новых уведомлений нет",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    expandSidebar: "Развернуть боковое меню",
    collapseSidebar: "Свернуть боковое меню",
    language: "Язык",
    currentLanguage: "Текущий язык",
    comingSoon: "Скоро",
  },
  yi: {
    appName: brand.productName,
    tagline: "די גאנצע משפּחה. אויף איין אָרט.",
    workspaceLabel: "משפּחה־פּלאַץ",
    home: "היים",
    nav: {
      home: "היים",
      finance: "געלט",
      tasks: "אויפגאבן",
      dashboard: "איבערבליק",
      health: "געזונט",
      documents: "דאָקומענטן",
      vehicles: "קאַרס",
      family: "משפּחה",
      birthdays: "געבורטסטעג",
      shopping: "איינקויפן",
      permissions: "צוטריט",
      settings: "איינשטעלונגען",
    },
    hero: {
      badge: "די גאנצע משפּחה. אויף איין אָרט.",
      description: `משפּחה־פּלאַץ: ${brand.workspaceName}. געלט, אויפגאבן, דאָקומענטן, געזונט און משפּחה־ניהול אויף איין רואיקן אָרט.`,
      dailyReview: "טעגלעכער איבערבליק",
      tasks: "אויפגאבן",
      finance: "געלט",
      stats: {
        activeModules: "אַקטיווע מאָדולן",
        localStorage: "לאקאלע שמירה",
        systemStatus: "סיסטעם מצב",
        active: "אַקטיוו",
        healthy: "אין סדר",
      },
    },
    dashboard: {
      modules: "מאָדולן",
      workspaceAreas: "ארבעט־געביטן",
      whatCanDo: "וואָס קען מען יעצט טאָן",
    },
    searchPlaceholder: "זוכן",
    searchLabel: "אלגעמיינע זוך",
    noSearchResults: "קיין רעזולטאטן",
    notifications: "מעלדונגען",
    noNotifications: "קיין נייע מעלדונגען",
    openMenu: "עפענען מעניו",
    closeMenu: "פארמאכן מעניו",
    expandSidebar: "פארברייטערן זייט־מעניו",
    collapseSidebar: "צוזאמקוועטשן זייט־מעניו",
    language: "שפּראַך",
    currentLanguage: "יעצטיגע שפּראַך",
    comingSoon: "קומט באַלד",
  },
  it: {
    appName: brand.productName,
    tagline: "Tutta la famiglia. In un solo posto.",
    workspaceLabel: "Spazio famiglia",
    home: "Home",
    nav: {
      home: "Home",
      finance: "Finanze",
      tasks: "Attività",
      dashboard: "Panoramica",
      health: "Salute",
      documents: "Documenti",
      vehicles: "Veicoli",
      family: "Famiglia",
      birthdays: "Compleanni",
      shopping: "Spesa",
      permissions: "Condivisione",
      settings: "Impostazioni",
    },
    hero: {
      badge: "Tutta la famiglia. In un solo posto.",
      description: `Spazio famiglia: ${brand.workspaceName}. Finanze, attività, documenti, salute, veicoli e gestione familiare in un unico luogo tranquillo.`,
      dailyReview: "Riepilogo giornaliero",
      tasks: "Attività",
      finance: "Finanze",
      stats: {
        activeModules: "Moduli attivi",
        localStorage: "Salvataggio locale",
        systemStatus: "Stato sistema",
        active: "Attivo",
        healthy: "Regolare",
      },
    },
    dashboard: {
      modules: "moduli",
      workspaceAreas: "Aree di lavoro",
      whatCanDo: "Cosa possiamo fare ora",
    },
    searchPlaceholder: "Cerca",
    searchLabel: "Ricerca globale",
    noSearchResults: "Nessun risultato",
    notifications: "Notifiche",
    noNotifications: "Nessuna nuova notifica",
    openMenu: "Apri menu",
    closeMenu: "Chiudi menu",
    expandSidebar: "Espandi barra laterale",
    collapseSidebar: "Comprimi barra laterale",
    language: "Lingua",
    currentLanguage: "Lingua corrente",
    comingSoon: "Presto",
  },
  es: {
    appName: brand.productName,
    tagline: "Toda la familia. En un solo lugar.",
    workspaceLabel: "Espacio familiar",
    home: "Inicio",
    nav: {
      home: "Inicio",
      finance: "Finanzas",
      tasks: "Tareas",
      dashboard: "Resumen",
      health: "Salud",
      documents: "Documentos",
      vehicles: "Vehículos",
      family: "Familia",
      birthdays: "Cumpleaños",
      shopping: "Compras",
      permissions: "Permisos",
      settings: "Ajustes",
    },
    hero: {
      badge: "Toda la familia. En un solo lugar.",
      description: `Espacio familiar: ${brand.workspaceName}. Finanzas, tareas, documentos, salud, vehículos y gestión familiar en un lugar tranquilo.`,
      dailyReview: "Resumen diario",
      tasks: "Tareas",
      finance: "Finanzas",
      stats: {
        activeModules: "Módulos activos",
        localStorage: "Guardado local",
        systemStatus: "Estado del sistema",
        active: "Activo",
        healthy: "Correcto",
      },
    },
    dashboard: {
      modules: "módulos",
      workspaceAreas: "Áreas de trabajo",
      whatCanDo: "Qué podemos hacer ahora",
    },
    searchPlaceholder: "Buscar",
    searchLabel: "Búsqueda global",
    noSearchResults: "No se encontraron resultados",
    notifications: "Notificaciones",
    noNotifications: "No hay notificaciones nuevas",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    expandSidebar: "Expandir barra lateral",
    collapseSidebar: "Contraer barra lateral",
    language: "Idioma",
    currentLanguage: "Idioma actual",
    comingSoon: "Próximamente",
  },
};

export function getDictionary(language: AppLanguage) {
  return dictionaries[language] ?? dictionaries.he;
}
