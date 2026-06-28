export const algorithms = {
  astar: {
    name: 'A*',
    labelKey: 'algorithm.astar.label',
    icon: '✦',
    descriptionKey: 'algorithm.astar.description',
    strengths: ['algorithm.strength.stable', 'algorithm.strength.optimal', 'algorithm.strength.explainable'],
  },
  dstar: {
    name: 'D* Lite',
    labelKey: 'algorithm.dstar.label',
    icon: '◇',
    descriptionKey: 'algorithm.dstar.description',
    strengths: ['algorithm.strength.dynamic', 'algorithm.strength.localRepair', 'algorithm.strength.stablePath'],
  },
  rrt: {
    name: 'RRT*',
    labelKey: 'algorithm.rrt.label',
    icon: '△',
    descriptionKey: 'algorithm.rrt.description',
    strengths: ['algorithm.strength.exploration', 'algorithm.strength.nonHolonomic', 'algorithm.strength.asymptotic'],
  },
  aco: {
    name: 'ACO',
    labelKey: 'algorithm.aco.label',
    icon: '◎',
    descriptionKey: 'algorithm.aco.description',
    strengths: ['algorithm.strength.multiObjective', 'algorithm.strength.heuristic', 'algorithm.strength.globalSearch'],
  },
};

export const scenarioPresets = {
  balanced: { nameKey: 'scenarios.balanced', gridSize: 28, density: 20, dynamic: false, dynamicCount: 10, speed: 150, algorithm: 'astar' },
  dense: { nameKey: 'scenarios.dense', gridSize: 34, density: 34, dynamic: false, dynamicCount: 12, speed: 135, algorithm: 'aco' },
  dynamic: { nameKey: 'scenarios.dynamic', gridSize: 30, density: 22, dynamic: true, dynamicCount: 24, speed: 115, algorithm: 'dstar' },
  explore: { nameKey: 'scenarios.explore', gridSize: 46, density: 16, dynamic: false, dynamicCount: 8, speed: 170, algorithm: 'rrt' },
};

export const quickPrompts = [
  'assistant.explainAstar',
  'assistant.compareRrtAco',
  'assistant.optimization',
  'assistant.generatePython',
];

export const initialAssistantMessage = {
  role: 'assistant',
  content: 'chat.welcome',
};
