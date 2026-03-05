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
  {
    id: 'cadastrar-obra',
    category: 'gestao-obras',
    categoryIcon: '🏗️',
    title: 'helpCenter.tutorials.createWork.title',
    steps: [
      'helpCenter.tutorials.createWork.step1',
      'helpCenter.tutorials.createWork.step2',
      'helpCenter.tutorials.createWork.step3',
      'helpCenter.tutorials.createWork.step4',
      'helpCenter.tutorials.createWork.step5',
      'helpCenter.tutorials.createWork.step6',
      'helpCenter.tutorials.createWork.step7',
    ],
    note: 'helpCenter.tutorials.createWork.note',
  },
  {
    id: 'adicionar-material',
    category: 'estoque-materiais',
    categoryIcon: '🧱',
    title: 'helpCenter.tutorials.addMaterial.title',
    steps: [
      'helpCenter.tutorials.addMaterial.step1',
      'helpCenter.tutorials.addMaterial.step2',
      'helpCenter.tutorials.addMaterial.step3',
      'helpCenter.tutorials.addMaterial.step4',
      'helpCenter.tutorials.addMaterial.step5',
      'helpCenter.tutorials.addMaterial.step6',
      'helpCenter.tutorials.addMaterial.step7',
    ],
    note: 'helpCenter.tutorials.addMaterial.note',
  },
  {
    id: 'medicoes-vales-retencao',
    category: 'financeiro-medicoes',
    categoryIcon: '💰',
    title: 'helpCenter.tutorials.financialMeasurements.title',
    steps: [
      'helpCenter.tutorials.financialMeasurements.step1',
      'helpCenter.tutorials.financialMeasurements.step2',
      'helpCenter.tutorials.financialMeasurements.step3',
      'helpCenter.tutorials.financialMeasurements.step4',
      'helpCenter.tutorials.financialMeasurements.step5',
      'helpCenter.tutorials.financialMeasurements.step6',
      'helpCenter.tutorials.financialMeasurements.step7',
      'helpCenter.tutorials.financialMeasurements.step8',
      'helpCenter.tutorials.financialMeasurements.step9',
      'helpCenter.tutorials.financialMeasurements.step10',
    ],
    note: 'helpCenter.tutorials.financialMeasurements.note',
  },
  {
    id: 'portal-do-cliente',
    category: 'gestao-obras',
    categoryIcon: '🏗️',
    title: 'helpCenter.tutorials.clientPortal.title',
    steps: [
      'helpCenter.tutorials.clientPortal.step1',
      'helpCenter.tutorials.clientPortal.step2',
      'helpCenter.tutorials.clientPortal.step3',
      'helpCenter.tutorials.clientPortal.step4',
      'helpCenter.tutorials.clientPortal.step5',
      'helpCenter.tutorials.clientPortal.step6',
      'helpCenter.tutorials.clientPortal.step7',
    ],
    note: 'helpCenter.tutorials.clientPortal.note',
  },
];
