import type { Terminology } from '../config/schema.js'

export type UiLocale = 'eng' | 'fra' | 'zho' | 'spa' | 'ara' | 'rus'

export const SUPPORTED_UI_LOCALES: readonly UiLocale[] = ['eng', 'fra', 'zho', 'spa', 'ara', 'rus']

export const LOCALE_LABELS: Readonly<Record<UiLocale, string>> = {
  eng: 'English',
  fra: 'Français',
  zho: '中文',
  spa: 'Español',
  ara: 'العربية',
  rus: 'Русский',
}

export const RTL_LOCALES: readonly string[] = ['ara']

const STRINGS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  eng: {
    'nav.home': 'Home',
    'nav.decisions': 'Resolutions',
    'nav.meetings': 'Meetings',
    'nav.about': 'About',

    'page.home.heroLabel': 'Resolutions Archive',
    'page.home.stats.decisions': 'Decisions on record',
    'page.home.stats.meetings': 'Meetings documented',
    'page.home.stats.recent': 'Most recent',
    'page.home.latestDecisions': 'Latest Decisions',
    'page.home.viewAll': 'View all',
    'page.home.recentMeetings': 'Recent Meetings',

    'label.body': 'Body',
    'label.kind': 'Kind',
    'label.date': 'Date',
    'label.urn': 'URN',
    'label.venue': 'Venue',
    'label.adopted': 'Adopted',
    'label.effective': 'Effective',
    'label.meeting': 'Meeting',
    'label.acclamation': 'Acclamation',

    'section.when': 'When',
    'section.venue': 'Venue',
    'section.officers': 'Officers',
    'section.schedule': 'Schedule',
    'section.agenda': 'Agenda',
    'section.deadlines': 'Deadlines',
    'section.minutes': 'Minutes',
    'section.subject': 'Subject',
    'section.considering': 'Considering',
    'section.considerations': 'Considerations',
    'section.actions': 'Actions',
    'section.approvals': 'Approvals',
    'section.dates': 'Dates',
    'section.referenceDocs': 'Reference documents',
    'section.adoptedAt': 'Adopted at',
    'section.adoptedDecisions': 'Resolutions',
    'section.sourceDocs': 'Source documents',
    'section.declarations': 'Declarations',
    'section.committee': 'Committee',
    'section.hosts': 'Hosts',
    'section.note': 'Note',
    'section.categories': 'Categories',
    'section.related': 'Related decisions',
    'section.overview': 'Overview',
    'section.identifiers': 'Identifiers',
    'page.home.stats.span': 'Year span',

    'label.scheduled': 'Scheduled',
    'label.occurred': 'Occurred',

    'decisions.empty': 'No decisions.',
    'meetings.empty': 'No meetings.',
    'search.empty': 'No matches found.',
    'search.placeholder': 'Search…',
    'search.allBodies': 'All bodies',
    'search.allKinds': 'All kinds',
    'search.ariaLabel': 'Search decisions',
    'search.ariaLabelMeetings': 'Search meetings',
    'search.dateFrom': 'From',
    'search.dateTo': 'To',
    'search.showMore': 'Show more',

    'nav.prev': '← Previous',
    'nav.next': 'Next →',

    'decade.browseLabel': 'Browse by decade',
    'about.title': 'About',
    'about.format': 'Edoxen format',
    'about.formatBody': 'This site renders meeting and decision data using the Edoxen information model — a YAML-based schema for formal proceedings of standards bodies.',
    'about.actionTypes': 'Action types',
    'about.actionTypesBody': 'Every decision is composed of typed actions that categorize what the committee decided to do. This semantic typing allows for advanced filtering and analysis.',
    'about.using': 'Using this site',
    'about.usingDecisions': 'Decisions — browse the resolutions archive.',
    'about.usingMeetings': 'Meetings — see meetings and their agendas, minutes, and adopted decisions.',
    'about.usingUrns': 'URNs — every entity has a stable URN for citation.',
    'about.stats.decisions': 'Decisions',
    'about.stats.meetings': 'Meetings',
  },

  fra: {
    'nav.home': 'Accueil',
    'nav.decisions': 'Résolutions',
    'nav.meetings': 'Réunions',
    'nav.about': 'À propos',

    'page.home.heroLabel': 'Archive des résolutions',
    'page.home.stats.decisions': 'Décisions enregistrées',
    'page.home.stats.meetings': 'Réunions documentées',
    'page.home.stats.recent': 'Plus récentes',
    'page.home.latestDecisions': 'Dernières décisions',
    'page.home.viewAll': 'Voir tout',
    'page.home.recentMeetings': 'Réunions récentes',

    'label.body': 'Organe',
    'label.kind': 'Type',
    'label.date': 'Date',
    'label.urn': 'URN',
    'label.venue': 'Lieu',
    'label.adopted': 'Adoptée',
    'label.effective': 'En vigueur',
    'label.meeting': 'Réunion',
    'label.acclamation': 'Acclamation',

    'section.when': 'Quand',
    'section.venue': 'Lieu',
    'section.officers': 'Bureau',
    'section.schedule': 'Programme',
    'section.agenda': 'Ordre du jour',
    'section.deadlines': 'Échéances',
    'section.minutes': 'Procès-verbaux',
    'section.subject': 'Sujet',
    'section.considering': 'Considérant',
    'section.considerations': 'Considérations',
    'section.actions': 'Actions',
    'section.approvals': 'Approbations',
    'section.dates': 'Dates',
    'section.referenceDocs': 'Documents de référence',
    'section.adoptedAt': 'Adoptée à',
    'section.adoptedDecisions': 'Résolutions',
    'section.sourceDocs': 'Documents sources',
    'section.declarations': 'Déclarations',
    'section.committee': 'Comité',
    'section.hosts': 'Hôtes',
    'section.note': 'Note',
    'section.categories': 'Catégories',
    'section.related': 'Décisions liées',
    'section.overview': 'Aperçu',
    'section.identifiers': 'Identifiants',
    'page.home.stats.span': 'Années couvertes',

    'label.scheduled': 'Prévu',
    'label.occurred': 'Tenu',

    'decisions.empty': 'Aucune décision.',
    'meetings.empty': 'Aucune réunion.',
    'search.empty': 'Aucun résultat trouvé.',
    'search.placeholder': 'Rechercher…',
    'search.allBodies': 'Tous les organes',
    'search.allKinds': 'Tous les types',
    'search.ariaLabel': 'Rechercher dans les décisions',
    'search.ariaLabelMeetings': 'Rechercher dans les réunions',
    'search.dateFrom': 'De',
    'search.dateTo': 'À',
    'search.showMore': 'Afficher plus',

    'nav.prev': '← Précédent',
    'nav.next': 'Suivant →',

    'decade.browseLabel': 'Parcourir par décennie',
    'about.title': 'À propos',
    'about.format': 'Format Edoxen',
    'about.formatBody': 'Ce site affiche les données de réunions et de décisions selon le modèle d\'information Edoxen — un schéma YAML pour les actes officiels des organismes de normalisation.',
    'about.actionTypes': "Types d'actions",
    'about.actionTypesBody': 'Chaque décision est composée d\'actions typées qui catégorisent ce que le comité a décidé de faire.',
    'about.using': 'Utilisation du site',
    'about.usingDecisions': 'Décisions — consulter l\'archive des résolutions.',
    'about.usingMeetings': 'Réunions — voir les réunions et leurs ordres du jour, procès-verbaux et décisions adoptées.',
    'about.usingUrns': 'URN — chaque entité possède une URN stable pour la citation.',
    'about.stats.decisions': 'Décisions',
    'about.stats.meetings': 'Réunions',
  },

  zho: {
    'nav.home': '首页',
    'nav.decisions': '决议',
    'nav.meetings': '会议',
    'nav.about': '关于',

    'page.home.heroLabel': '决议档案',
    'page.home.stats.decisions': '在册决定',
    'page.home.stats.meetings': '已记录会议',
    'page.home.stats.recent': '最新',
    'page.home.latestDecisions': '最新决定',
    'page.home.viewAll': '查看全部',
    'page.home.recentMeetings': '近期会议',

    'label.body': '机构',
    'label.kind': '类型',
    'label.date': '日期',
    'label.urn': 'URN',
    'label.venue': '地点',
    'label.adopted': '通过',
    'label.effective': '生效',
    'label.meeting': '会议',
    'label.acclamation': '鼓掌通过',

    'section.when': '时间',
    'section.venue': '地点',
    'section.officers': '主席团',
    'section.schedule': '日程',
    'section.agenda': '议程',
    'section.deadlines': '截止日期',
    'section.minutes': '会议纪要',
    'section.subject': '主题',
    'section.considering': '考虑到',
    'section.considerations': '审议事项',
    'section.actions': '行动',
    'section.approvals': '表决',
    'section.dates': '日期',
    'section.referenceDocs': '参考文件',
    'section.adoptedAt': '通过地点',
    'section.adoptedDecisions': '决议',
    'section.sourceDocs': '来源文件',
    'section.declarations': '声明',
    'section.committee': '委员会',
    'section.hosts': '主办方',
    'section.note': '备注',
    'section.categories': '类别',
    'section.related': '相关决议',
    'section.overview': '概览',
    'section.identifiers': '标识符',
    'page.home.stats.span': '年份跨度',

    'label.scheduled': '计划',
    'label.occurred': '实际',

    'decisions.empty': '暂无决定。',
    'meetings.empty': '暂无会议。',
    'search.empty': '未找到结果。',
    'search.placeholder': '搜索…',
    'search.allBodies': '全部机构',
    'search.allKinds': '全部类型',
    'search.ariaLabel': '搜索决定',
    'search.ariaLabelMeetings': '搜索会议',
    'search.dateFrom': '从',
    'search.dateTo': '至',
    'search.showMore': '显示更多',

    'nav.prev': '← 上一条',
    'nav.next': '下一条 →',

    'decade.browseLabel': '按年代浏览',
    'about.title': '关于',
    'about.format': 'Edoxen 格式',
    'about.formatBody': '本网站使用 Edoxen 信息模型呈现会议和决定数据——一个用于标准化机构正式记录的 YAML 架构。',
    'about.using': '使用本站',
    'about.usingDecisions': '决定 — 浏览决议档案。',
    'about.usingMeetings': '会议 — 查看会议及其议程、纪要和通过的决议。',
    'about.usingUrns': 'URN — 每个实体都有一个稳定的 URN 用于引用。',
    'about.stats.decisions': '决定',
    'about.stats.meetings': '会议',
  },

  spa: {
    'nav.home': 'Inicio',
    'nav.decisions': 'Resoluciones',
    'nav.meetings': 'Reuniones',
    'nav.about': 'Acerca de',

    'page.home.heroLabel': 'Archivo de resoluciones',
    'page.home.stats.decisions': 'Decisiones registradas',
    'page.home.stats.meetings': 'Reuniones documentadas',
    'page.home.stats.recent': 'Más recientes',
    'page.home.latestDecisions': 'Últimas decisiones',
    'page.home.viewAll': 'Ver todo',
    'page.home.recentMeetings': 'Reuniones recientes',

    'label.body': 'Órgano',
    'label.kind': 'Tipo',
    'label.date': 'Fecha',
    'label.urn': 'URN',
    'label.venue': 'Lugar',
    'label.adopted': 'Adoptada',
    'label.effective': 'Vigente',
    'label.meeting': 'Reunión',
    'label.acclamation': 'Aclamación',

    'section.when': 'Cuándo',
    'section.venue': 'Lugar',
    'section.officers': 'Oficiales',
    'section.schedule': 'Programa',
    'section.agenda': 'Orden del día',
    'section.deadlines': 'Plazos',
    'section.minutes': 'Actas',
    'section.subject': 'Asunto',
    'section.considering': 'Considerando',
    'section.considerations': 'Consideraciones',
    'section.actions': 'Acciones',
    'section.approvals': 'Aprobaciones',
    'section.dates': 'Fechas',
    'section.referenceDocs': 'Documentos de referencia',
    'section.adoptedAt': 'Adoptada en',
    'section.adoptedDecisions': 'Resoluciones',
    'section.sourceDocs': 'Documentos fuente',
    'section.declarations': 'Declaraciones',
    'section.committee': 'Comité',
    'section.hosts': 'Anfitriones',
    'section.note': 'Nota',
    'section.categories': 'Categorías',
    'section.related': 'Decisiones relacionadas',
    'section.overview': 'Resumen',
    'section.identifiers': 'Identificadores',
    'page.home.stats.span': 'Años cubiertos',

    'label.scheduled': 'Programada',
    'label.occurred': 'Celebrada',

    'decisions.empty': 'Sin decisiones.',
    'meetings.empty': 'Sin reuniones.',
    'search.empty': 'No se encontraron resultados.',
    'search.placeholder': 'Buscar…',
    'search.allBodies': 'Todos los órganos',
    'search.allKinds': 'Todos los tipos',
    'search.ariaLabel': 'Buscar decisiones',
    'search.ariaLabelMeetings': 'Buscar reuniones',
    'search.dateFrom': 'Desde',
    'search.dateTo': 'Hasta',
    'search.showMore': 'Mostrar más',

    'nav.prev': '← Anterior',
    'nav.next': 'Siguiente →',

    'decade.browseLabel': 'Explorar por década',
    'about.title': 'Acerca de',
    'about.format': 'Formato Edoxen',
    'about.formatBody': 'Este sitio presenta los datos de reuniones y decisiones utilizando el modelo de información Edoxen — un esquema YAML para las actas oficiales de los organismos de normalización.',
    'about.using': 'Uso del sitio',
    'about.usingDecisions': 'Decisiones — explorar el archivo de resoluciones.',
    'about.usingMeetings': 'Reuniones — ver reuniones y sus órdenes del día, actas y decisiones adoptadas.',
    'about.usingUrns': 'URN — cada entidad tiene una URN estable para citación.',
    'about.stats.decisions': 'Decisiones',
    'about.stats.meetings': 'Reuniones',
  },

  ara: {
    'nav.home': 'الرئيسية',
    'nav.decisions': 'القرارات',
    'nav.meetings': 'الاجتماعات',
    'nav.about': 'حول',

    'page.home.heroLabel': 'أرشيف القرارات',
    'page.home.stats.decisions': 'القرارات المسجلة',
    'page.home.stats.meetings': 'الاجتماعات الموثقة',
    'page.home.stats.recent': 'الأحدث',
    'page.home.latestDecisions': 'أحدث القرارات',
    'page.home.viewAll': 'عرض الكل',
    'page.home.recentMeetings': 'الاجتماعات الأخيرة',

    'label.body': 'الهيئة',
    'label.kind': 'النوع',
    'label.date': 'التاريخ',
    'label.urn': 'URN',
    'label.venue': 'المكان',
    'label.adopted': 'اعتُمدت',
    'label.effective': 'سارٍ',
    'label.meeting': 'الاجتماع',
    'label.acclamation': 'بالتصفيق',

    'section.when': 'متى',
    'section.venue': 'المكان',
    'section.officers': 'المسؤولون',
    'section.schedule': 'الجدول',
    'section.agenda': 'جدول الأعمال',
    'section.deadlines': 'المواعيد النهائية',
    'section.minutes': 'محاضر الاجتماع',
    'section.subject': 'الموضوع',
    'section.considering': 'إذ يراعي',
    'section.considerations': 'الاعتبارات',
    'section.actions': 'الإجراءات',
    'section.approvals': 'الموافقات',
    'section.dates': 'التواريخ',
    'section.referenceDocs': 'الوثائق المرجعية',
    'section.adoptedAt': 'اعتُمد في',
    'section.adoptedDecisions': 'القرارات',
    'section.sourceDocs': 'الوثائق المصدر',
    'section.declarations': 'الإعلانات',
    'section.committee': 'اللجنة',
    'section.hosts': 'المضيفون',
    'section.note': 'ملاحظة',
    'section.categories': 'الفئات',
    'section.related': 'قرارات ذات صلة',
    'section.overview': 'نظرة عامة',
    'section.identifiers': 'المعرفات',
    'page.home.stats.span': 'نطاق السنوات',

    'label.scheduled': 'مجدولة',
    'label.occurred': 'عُقدت',

    'decisions.empty': 'لا توجد قرارات.',
    'meetings.empty': 'لا توجد اجتماعات.',
    'search.empty': 'لم يتم العثور على نتائج.',
    'search.placeholder': 'بحث…',
    'search.allBodies': 'جميع الهيئات',
    'search.allKinds': 'جميع الأنواع',
    'search.ariaLabel': 'البحث في القرارات',
    'search.ariaLabelMeetings': 'البحث في الاجتماعات',
    'search.dateFrom': 'من',
    'search.dateTo': 'إلى',
    'search.showMore': 'عرض المزيد',

    'nav.prev': '→ السابق',
    'nav.next': 'التالي ←',

    'decade.browseLabel': 'تصفح حسب العقد',
    'about.title': 'حول',
    'about.format': 'صيغة Edoxen',
    'about.formatBody': 'يعرض هذا الموقع بيانات الاجتماعات والقرارات باستخدام نموذج معلومات Edoxen — مخطط YAML للسجلات الرسمية لهيئات المعايير.',
    'about.using': 'استخدام الموقع',
    'about.usingDecisions': 'القرارات — تصفح أرشيف القرارات.',
    'about.usingMeetings': 'الاجتماعات — شاهد الاجتماعات وجداول أعمالها ومحاضرها وقراراتها المعتمدة.',
    'about.usingUrns': 'URN — لكل كيان URN مستقر للاستشهاد.',
    'about.stats.decisions': 'القرارات',
    'about.stats.meetings': 'الاجتماعات',
  },

  rus: {
    'nav.home': 'Главная',
    'nav.decisions': 'Резолюции',
    'nav.meetings': 'Заседания',
    'nav.about': 'О сайте',

    'page.home.heroLabel': 'Архив резолюций',
    'page.home.stats.decisions': 'Решений в реестре',
    'page.home.stats.meetings': 'Заседаний задокументировано',
    'page.home.stats.recent': 'Последние',
    'page.home.latestDecisions': 'Последние решения',
    'page.home.viewAll': 'Показать все',
    'page.home.recentMeetings': 'Недавние заседания',

    'label.body': 'Орган',
    'label.kind': 'Тип',
    'label.date': 'Дата',
    'label.urn': 'URN',
    'label.venue': 'Место',
    'label.adopted': 'Принято',
    'label.effective': 'Вступило в силу',
    'label.meeting': 'Заседание',
    'label.acclamation': 'Акламация',

    'section.when': 'Когда',
    'section.venue': 'Место',
    'section.officers': 'Должностные лица',
    'section.schedule': 'Программа',
    'section.agenda': 'Повестка',
    'section.deadlines': 'Сроки',
    'section.minutes': 'Протоколы',
    'section.subject': 'Предмет',
    'section.considering': 'Принимая во внимание',
    'section.considerations': 'Соображения',
    'section.actions': 'Действия',
    'section.approvals': 'Утверждения',
    'section.dates': 'Даты',
    'section.referenceDocs': 'Справочные документы',
    'section.adoptedAt': 'Принято на',
    'section.adoptedDecisions': 'Резолюции',
    'section.sourceDocs': 'Исходные документы',
    'section.declarations': 'Декларации',
    'section.committee': 'Комитет',
    'section.hosts': 'Организаторы',
    'section.note': 'Примечание',
    'section.categories': 'Категории',
    'section.related': 'Связанные решения',
    'section.overview': 'Обзор',
    'section.identifiers': 'Идентификаторы',
    'page.home.stats.span': 'Охват лет',

    'label.scheduled': 'Запланировано',
    'label.occurred': 'Состоялось',

    'decisions.empty': 'Нет решений.',
    'meetings.empty': 'Нет заседаний.',
    'search.empty': 'Результаты не найдены.',
    'search.placeholder': 'Поиск…',
    'search.allBodies': 'Все органы',
    'search.allKinds': 'Все типы',
    'search.ariaLabel': 'Поиск решений',
    'search.ariaLabelMeetings': 'Поиск заседаний',
    'search.dateFrom': 'С',
    'search.dateTo': 'По',
    'search.showMore': 'Показать ещё',

    'nav.prev': '← Предыдущее',
    'nav.next': 'Следующее →',

    'decade.browseLabel': 'Просмотр по десятилетиям',
    'about.title': 'О сайте',
    'about.format': 'Формат Edoxen',
    'about.formatBody': 'Этот сайт отображает данные заседаний и решений с использованием информационной модели Edoxen — схемы YAML для официальных документов органов по стандартизации.',
    'about.using': 'Использование сайта',
    'about.usingDecisions': 'Решения — просмотр архива резолюций.',
    'about.usingMeetings': 'Заседания — просмотр заседаний, их повесток, протоколов и принятых решений.',
    'about.usingUrns': 'URN — каждый объект имеет стабильный URN для цитирования.',
    'about.stats.decisions': 'Решения',
    'about.stats.meetings': 'Заседания',
  },
}

export type UiStrings = Readonly<Record<string, string>>
export type CustomUiStrings = Readonly<Record<string, UiStrings>>

const TWO_TO_THREE: Readonly<Record<string, string>> = {
  en: 'eng', fr: 'fra', zh: 'zho', es: 'spa', ar: 'ara', ru: 'rus',
  de: 'deu', ja: 'jpn', ko: 'kor', pt: 'por', it: 'ita', nl: 'nld',
}

function toThreeChar(locale: string): string {
  const lower = locale.toLowerCase()
  if (lower.length === 3) return lower
  return TWO_TO_THREE[lower] ?? lower.slice(0, 3)
}

export function normalizeUiLocale(locale: string): string {
  return toThreeChar(locale)
}

export function isRtl(locale: string, extraRtlLocales: readonly string[] = []): boolean {
  const code = normalizeUiLocale(locale)
  return RTL_LOCALES.includes(code) || extraRtlLocales.includes(code) || extraRtlLocales.includes(locale.toLowerCase())
}

export const DEFAULT_TERMINOLOGY: Terminology = {
  decision: 'decision',
  decisions: 'decisions',
  meeting: 'meeting',
  meetings: 'meetings',
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Preserve the first-letter case of the replaced word: a lowercase
// mid-sentence 'decisions' takes the terminology in lowercase, a
// capitalized 'Decisions' takes it capitalized.
function matchCase(original: string, replacement: string): string {
  return original.charAt(0) === original.charAt(0).toUpperCase()
    ? capitalize(replacement)
    : replacement.charAt(0).toLowerCase() + replacement.slice(1)
}

const TERMINOLOGY_WORD_RE = /\bdecisions\b|\bDecisions\b|\bdecision\b|\bDecision\b|\bmeetings\b|\bMeetings\b|\bmeeting\b|\bMeeting\b/g

// Single-pass whole-word substitution, so replacement values that
// themselves contain 'meeting'/'decision' are never re-processed.
export function applyTerminology(text: string, term: Terminology): string {
  return text.replace(TERMINOLOGY_WORD_RE, (word) => {
    switch (word) {
      case 'decisions': return matchCase(word, term.decisions)
      case 'Decisions': return matchCase(word, term.decisions)
      case 'decision': return matchCase(word, term.decision)
      case 'Decision': return matchCase(word, term.decision)
      case 'meetings': return matchCase(word, term.meetings)
      case 'Meetings': return matchCase(word, term.meetings)
      case 'meeting': return matchCase(word, term.meeting)
      case 'Meeting': return matchCase(word, term.meeting)
      default: return word
    }
  })
}

// Keys that are pure record-name labels. Their built-in English values
// carry no 'decision'/'meeting' word to substitute ('nav.decisions' is
// 'Resolutions'), so they map onto the terminology directly — but only
// when the consumer actually renamed the record, otherwise the richer
// built-in wording keeps its say.
function terminologyLabel(key: string, term: Terminology): string | null {
  switch (key) {
    case 'nav.decisions':
    case 'section.adoptedDecisions':
    case 'about.stats.decisions':
      return term.decisions !== DEFAULT_TERMINOLOGY.decisions ? capitalize(term.decisions) : null
    case 'nav.meetings':
    case 'about.stats.meetings':
      return term.meetings !== DEFAULT_TERMINOLOGY.meetings ? capitalize(term.meetings) : null
    case 'label.meeting':
      return term.meeting !== DEFAULT_TERMINOLOGY.meeting ? capitalize(term.meeting) : null
    default:
      return null
  }
}

// Resolution order: uiStrings[locale][key] → terminology override →
// built-in locale table. Terminology shapes English rendering only —
// other locales keep their built-in translations unless the consumer
// overrides them per-locale via uiStrings.
export function t(
  key: string,
  locale: string,
  customStrings?: CustomUiStrings,
  terminology?: Partial<Terminology>,
): string {
  const code = normalizeUiLocale(locale)
  const custom = customStrings?.[code]?.[key]
  if (custom) return custom
  const builtIn = STRINGS[code]?.[key]
  if (builtIn && code !== 'eng') return builtIn
  const english = builtIn ?? STRINGS.eng?.[key]
  if (!english) return key
  if (!terminology) return english
  const term = { ...DEFAULT_TERMINOLOGY, ...terminology }
  return terminologyLabel(key, term) ?? applyTerminology(english, term)
}

export function availableUiLocales(configuredLocales: readonly { code: string }[]): string[] {
  return configuredLocales.map((l) => normalizeUiLocale(l.code))
}
