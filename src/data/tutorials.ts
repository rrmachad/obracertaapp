export interface Tutorial {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  steps: string[];
  note?: string;
}

export interface TutorialCategory {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

export const categories: TutorialCategory[] = [
  {
    id: 'primeiros-passos',
    icon: '🏁',
    titleKey: 'helpCenter.categories.gettingStarted',
    descriptionKey: 'helpCenter.categories.gettingStartedDesc',
  },
  {
    id: 'gestao-obras',
    icon: '🏗️',
    titleKey: 'helpCenter.categories.workManagement',
    descriptionKey: 'helpCenter.categories.workManagementDesc',
  },
  {
    id: 'estoque-materiais',
    icon: '🧱',
    titleKey: 'helpCenter.categories.stockMaterials',
    descriptionKey: 'helpCenter.categories.stockMaterialsDesc',
  },
  {
    id: 'financeiro-medicoes',
    icon: '💰',
    titleKey: 'helpCenter.categories.financialMeasurements',
    descriptionKey: 'helpCenter.categories.financialMeasurementsDesc',
  },
  {
    id: 'equipe-acessos',
    icon: '👥',
    titleKey: 'helpCenter.categories.teamAccess',
    descriptionKey: 'helpCenter.categories.teamAccessDesc',
  },
];

export const tutorials: Tutorial[] = [
  {
    id: 'acesso-admin',
    category: 'primeiros-passos',
    categoryIcon: '🏁',
    title: 'helpCenter.tutorials.adminAccess.title',
    steps: [
      'helpCenter.tutorials.adminAccess.step1',
      'helpCenter.tutorials.adminAccess.step2',
      'helpCenter.tutorials.adminAccess.step3',
    ],
    note: 'helpCenter.tutorials.adminAccess.note',
  },
  {
    id: 'acesso-pin',
    category: 'primeiros-passos',
    categoryIcon: '🏁',
    title: 'helpCenter.tutorials.pinAccess.title',
    steps: [
      'helpCenter.tutorials.pinAccess.step1',
      'helpCenter.tutorials.pinAccess.step2',
      'helpCenter.tutorials.pinAccess.step3',
      'helpCenter.tutorials.pinAccess.step4',
      'helpCenter.tutorials.pinAccess.step5',
    ],
  },
];
