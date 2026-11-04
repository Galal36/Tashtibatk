/** Arabic-first UI labels for the admin dashboard (RTL). */
export const t = {
  brand: "لوحة التحكم",
  // nav
  dashboard: "الرئيسية",
  articles: "المقالات",
  categories: "التصنيفات",
  media: "مكتبة الوسائط",
  users: "المستخدمون",
  viewSite: "عرض الموقع",
  logout: "تسجيل الخروج",
  // auth
  signIn: "تسجيل الدخول",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  invalidCreds: "بيانات الدخول غير صحيحة",
  signingIn: "جارٍ الدخول…",
  noAccess: "لا تملك صلاحية الوصول إلى لوحة التحكم.",
  // dashboard stats
  totalArticles: "إجمالي المقالات",
  totalCategories: "التصنيفات",
  published: "منشورة",
  drafts: "مسودات",
  scheduled: "مجدولة",
  recentlyPublished: "أحدث المقالات المنشورة",
  quickActions: "إجراءات سريعة",
  newArticle: "مقال جديد",
  manageCategories: "إدارة التصنيفات",
  mediaLibrary: "مكتبة الوسائط",
  // article list
  searchArticles: "ابحث في المقالات…",
  allCategories: "كل التصنيفات",
  allStatuses: "كل الحالات",
  allLanguages: "كل اللغات",
  title: "العنوان",
  category: "التصنيف",
  status: "الحالة",
  language: "اللغة",
  author: "الكاتب",
  date: "التاريخ",
  actions: "إجراءات",
  edit: "تعديل",
  delete: "حذف",
  publish: "نشر",
  unpublish: "إلغاء النشر",
  selected: "محدد",
  bulkPublish: "نشر المحدد",
  bulkUnpublish: "إلغاء نشر المحدد",
  bulkDelete: "حذف المحدد",
  noArticles: "لا توجد مقالات.",
  confirmDelete: "هل أنت متأكد من الحذف؟ لا يمكن التراجع.",
  confirm: "تأكيد",
  cancel: "إلغاء",
  loading: "جارٍ التحميل…",
  // statuses
  st_draft: "مسودة",
  st_published: "منشورة",
  st_scheduled: "مجدولة",
  st_archived: "مؤرشفة",
  // languages
  lang_ar: "العربية",
  lang_en: "الإنجليزية",
  lang_ur: "الأردية",
} as const;

export const STATUS_LABEL: Record<string, string> = {
  draft: t.st_draft,
  published: t.st_published,
  scheduled: t.st_scheduled,
  archived: t.st_archived,
};

export const LANG_LABEL: Record<string, string> = {
  ar: t.lang_ar,
  en: t.lang_en,
  ur: t.lang_ur,
};
