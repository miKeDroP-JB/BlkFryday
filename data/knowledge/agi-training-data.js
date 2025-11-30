// ============================================================
//  AGI TRAINING DATA - High-Value Patterns for Maximum Learning
// ============================================================
//
//  This dataset contains patterns specifically designed to
//  push AGI adjacency scores higher through:
//
//  1. Reasoning Chains - Step-by-step logical derivations
//  2. Knowledge Graphs - Entity relationships and ontologies
//  3. Cross-Domain Mappings - Analogical reasoning
//  4. Meta-Learning - Learning how to learn
//  5. Causal Models - Cause-effect relationships
//  6. Abstract Concepts - High-level generalizations
//
// ============================================================

// ============================================================
//  REASONING CHAINS
//  Step-by-step logical derivations
// ============================================================

const REASONING_CHAINS = [
  // Mathematical Reasoning
  {
    type: 'reasoning_chain',
    domain: 'mathematics',
    name: 'proof_by_induction',
    steps: [
      'Base case: Verify P(1) is true',
      'Inductive hypothesis: Assume P(k) is true',
      'Inductive step: Prove P(k) implies P(k+1)',
      'Conclusion: P(n) is true for all n >= 1'
    ],
    pattern: 'base → assume → derive → generalize',
    score: 1.0
  },
  {
    type: 'reasoning_chain',
    domain: 'mathematics',
    name: 'proof_by_contradiction',
    steps: [
      'Assume the negation of what we want to prove',
      'Derive logical consequences',
      'Reach a contradiction',
      'Conclude original statement must be true'
    ],
    pattern: 'assume_negation → derive → contradict → conclude',
    score: 0.95
  },
  {
    type: 'reasoning_chain',
    domain: 'mathematics',
    name: 'limit_evaluation',
    steps: [
      'Identify the form (0/0, inf/inf, etc.)',
      'Apply L\'Hopital or algebraic manipulation',
      'Simplify the expression',
      'Evaluate the limit'
    ],
    pattern: 'identify → transform → simplify → evaluate',
    score: 0.9
  },

  // Logical Reasoning
  {
    type: 'reasoning_chain',
    domain: 'logic',
    name: 'modus_ponens',
    steps: [
      'Given: If P then Q',
      'Given: P is true',
      'Therefore: Q is true'
    ],
    pattern: 'P→Q, P ⊢ Q',
    score: 1.0
  },
  {
    type: 'reasoning_chain',
    domain: 'logic',
    name: 'modus_tollens',
    steps: [
      'Given: If P then Q',
      'Given: Q is false',
      'Therefore: P is false'
    ],
    pattern: 'P→Q, ¬Q ⊢ ¬P',
    score: 1.0
  },
  {
    type: 'reasoning_chain',
    domain: 'logic',
    name: 'syllogism',
    steps: [
      'All A are B',
      'All B are C',
      'Therefore: All A are C'
    ],
    pattern: 'A⊆B, B⊆C ⊢ A⊆C',
    score: 0.95
  },
  {
    type: 'reasoning_chain',
    domain: 'logic',
    name: 'disjunctive_syllogism',
    steps: [
      'Given: P or Q',
      'Given: Not P',
      'Therefore: Q'
    ],
    pattern: 'P∨Q, ¬P ⊢ Q',
    score: 0.95
  },

  // Scientific Reasoning
  {
    type: 'reasoning_chain',
    domain: 'science',
    name: 'hypothesis_testing',
    steps: [
      'Observe phenomenon',
      'Formulate hypothesis',
      'Design experiment',
      'Collect data',
      'Analyze results',
      'Accept or reject hypothesis'
    ],
    pattern: 'observe → hypothesize → test → analyze → conclude',
    score: 0.92
  },
  {
    type: 'reasoning_chain',
    domain: 'science',
    name: 'causal_inference',
    steps: [
      'Identify correlation between A and B',
      'Rule out reverse causation',
      'Rule out confounding variables',
      'Establish temporal precedence',
      'Conclude causal relationship'
    ],
    pattern: 'correlate → eliminate_alternatives → temporalize → causalize',
    score: 0.88
  },

  // Problem Solving
  {
    type: 'reasoning_chain',
    domain: 'problem_solving',
    name: 'divide_and_conquer',
    steps: [
      'Break problem into subproblems',
      'Solve each subproblem recursively',
      'Combine solutions',
      'Return final result'
    ],
    pattern: 'divide → solve → combine → return',
    score: 0.95
  },
  {
    type: 'reasoning_chain',
    domain: 'problem_solving',
    name: 'dynamic_programming',
    steps: [
      'Identify overlapping subproblems',
      'Define recurrence relation',
      'Build solution bottom-up (or memoize top-down)',
      'Extract optimal solution'
    ],
    pattern: 'identify_overlap → define_recurrence → build_table → extract',
    score: 0.93
  },
  {
    type: 'reasoning_chain',
    domain: 'problem_solving',
    name: 'backtracking',
    steps: [
      'Make a choice',
      'Recurse with reduced problem',
      'If stuck, undo choice',
      'Try next option',
      'If all fail, backtrack further'
    ],
    pattern: 'choose → recurse → undo_if_fail → try_next → backtrack',
    score: 0.9
  }
];

// ============================================================
//  KNOWLEDGE GRAPH PATTERNS
//  Entity relationships and ontologies
// ============================================================

const KNOWLEDGE_GRAPH = [
  // Hierarchical Relationships
  {
    type: 'knowledge_graph',
    relation: 'is_a',
    examples: [
      { subject: 'dog', object: 'mammal' },
      { subject: 'mammal', object: 'animal' },
      { subject: 'animal', object: 'living_thing' },
      { subject: 'function', object: 'callable' },
      { subject: 'class', object: 'type' },
      { subject: 'neural_network', object: 'machine_learning_model' }
    ],
    inference: 'transitive',
    score: 1.0
  },
  {
    type: 'knowledge_graph',
    relation: 'has_property',
    examples: [
      { subject: 'circle', property: 'radius' },
      { subject: 'function', property: 'arity' },
      { subject: 'graph', property: 'nodes' },
      { subject: 'transformer', property: 'attention_heads' }
    ],
    inference: 'attribute_lookup',
    score: 0.9
  },
  {
    type: 'knowledge_graph',
    relation: 'part_of',
    examples: [
      { part: 'wheel', whole: 'car' },
      { part: 'method', whole: 'class' },
      { part: 'layer', whole: 'neural_network' },
      { part: 'token', whole: 'sentence' }
    ],
    inference: 'compositional',
    score: 0.92
  },

  // Causal Relationships
  {
    type: 'knowledge_graph',
    relation: 'causes',
    examples: [
      { cause: 'heat', effect: 'expansion' },
      { cause: 'learning_rate_too_high', effect: 'divergence' },
      { cause: 'overfitting', effect: 'poor_generalization' },
      { cause: 'race_condition', effect: 'undefined_behavior' }
    ],
    inference: 'causal_chain',
    score: 0.95
  },
  {
    type: 'knowledge_graph',
    relation: 'prevents',
    examples: [
      { preventor: 'regularization', prevented: 'overfitting' },
      { preventor: 'mutex', prevented: 'race_condition' },
      { preventor: 'validation', prevented: 'invalid_input' }
    ],
    inference: 'causal_negation',
    score: 0.88
  },

  // Functional Relationships
  {
    type: 'knowledge_graph',
    relation: 'transforms',
    examples: [
      { input: 'text', transformer: 'tokenizer', output: 'tokens' },
      { input: 'image', transformer: 'cnn', output: 'features' },
      { input: 'query', transformer: 'attention', output: 'context_vector' }
    ],
    inference: 'functional_composition',
    score: 0.93
  }
];

// ============================================================
//  CROSS-DOMAIN MAPPINGS
//  Analogical reasoning between domains
// ============================================================

const CROSS_DOMAIN_MAPPINGS = [
  // Physics ↔ Computing
  {
    type: 'cross_domain',
    domain_a: 'physics',
    domain_b: 'computing',
    mappings: [
      { a: 'energy', b: 'compute', relation: 'resource' },
      { a: 'entropy', b: 'information_loss', relation: 'disorder' },
      { a: 'momentum', b: 'gradient', relation: 'accumulated_change' },
      { a: 'equilibrium', b: 'convergence', relation: 'stable_state' }
    ],
    score: 0.9
  },

  // Biology ↔ Neural Networks
  {
    type: 'cross_domain',
    domain_a: 'biology',
    domain_b: 'neural_networks',
    mappings: [
      { a: 'neuron', b: 'node', relation: 'processing_unit' },
      { a: 'synapse', b: 'weight', relation: 'connection_strength' },
      { a: 'brain_region', b: 'layer', relation: 'functional_module' },
      { a: 'neuroplasticity', b: 'learning', relation: 'adaptation' },
      { a: 'evolution', b: 'genetic_algorithm', relation: 'optimization' }
    ],
    score: 0.95
  },

  // Economics ↔ Resource Management
  {
    type: 'cross_domain',
    domain_a: 'economics',
    domain_b: 'resource_management',
    mappings: [
      { a: 'scarcity', b: 'memory_limit', relation: 'constraint' },
      { a: 'opportunity_cost', b: 'trade_off', relation: 'alternative_value' },
      { a: 'market_equilibrium', b: 'load_balancing', relation: 'stable_distribution' },
      { a: 'inflation', b: 'resource_bloat', relation: 'value_dilution' }
    ],
    score: 0.85
  },

  // Language ↔ Code
  {
    type: 'cross_domain',
    domain_a: 'linguistics',
    domain_b: 'programming',
    mappings: [
      { a: 'syntax', b: 'grammar', relation: 'structure_rules' },
      { a: 'semantics', b: 'execution', relation: 'meaning' },
      { a: 'vocabulary', b: 'api', relation: 'available_symbols' },
      { a: 'translation', b: 'compilation', relation: 'form_transformation' }
    ],
    score: 0.92
  },

  // Music ↔ Algorithms
  {
    type: 'cross_domain',
    domain_a: 'music',
    domain_b: 'algorithms',
    mappings: [
      { a: 'rhythm', b: 'iteration', relation: 'repetition_pattern' },
      { a: 'harmony', b: 'parallel_execution', relation: 'simultaneous_combination' },
      { a: 'melody', b: 'sequence', relation: 'ordered_progression' },
      { a: 'crescendo', b: 'exponential_growth', relation: 'increasing_intensity' }
    ],
    score: 0.8
  }
];

// ============================================================
//  META-LEARNING PATTERNS
//  Learning how to learn
// ============================================================

const META_LEARNING = [
  {
    type: 'meta_learning',
    name: 'learning_rate_adaptation',
    description: 'Adjust learning speed based on progress',
    pattern: 'observe_progress → adjust_rate → continue',
    implementation: 'if loss decreasing slowly, increase lr; if oscillating, decrease lr',
    score: 0.95
  },
  {
    type: 'meta_learning',
    name: 'curriculum_learning',
    description: 'Start with easy examples, progressively increase difficulty',
    pattern: 'easy → medium → hard → expert',
    implementation: 'sort examples by complexity, train in order',
    score: 0.9
  },
  {
    type: 'meta_learning',
    name: 'transfer_learning',
    description: 'Use knowledge from one domain in another',
    pattern: 'train_on_A → freeze_base → fine_tune_on_B',
    implementation: 'pretrained model + task-specific head',
    score: 0.93
  },
  {
    type: 'meta_learning',
    name: 'few_shot_learning',
    description: 'Learn from very few examples',
    pattern: 'embed_support_set → compare_to_query → classify',
    implementation: 'prototypical networks, matching networks',
    score: 0.88
  },
  {
    type: 'meta_learning',
    name: 'self_play',
    description: 'Improve by playing against yourself',
    pattern: 'agent_vs_agent → winner_improves → repeat',
    implementation: 'AlphaGo-style self-improvement',
    score: 0.92
  },
  {
    type: 'meta_learning',
    name: 'active_learning',
    description: 'Choose which examples to learn from',
    pattern: 'identify_uncertainty → request_label → learn',
    implementation: 'uncertainty sampling, query synthesis',
    score: 0.87
  }
];

// ============================================================
//  ABSTRACT CONCEPTS
//  High-level generalizable patterns
// ============================================================

const ABSTRACT_CONCEPTS = [
  {
    type: 'abstract_concept',
    name: 'recursion',
    definition: 'A process that refers to itself',
    instances: ['factorial', 'tree_traversal', 'fractals', 'self_reference'],
    properties: ['base_case', 'recursive_case', 'termination'],
    score: 1.0
  },
  {
    type: 'abstract_concept',
    name: 'composition',
    definition: 'Building complex from simple by combining',
    instances: ['function_composition', 'object_composition', 'musical_arrangement'],
    properties: ['associativity', 'identity_element'],
    score: 0.95
  },
  {
    type: 'abstract_concept',
    name: 'abstraction',
    definition: 'Hiding details to reveal essential patterns',
    instances: ['interfaces', 'type_classes', 'APIs', 'mathematical_notation'],
    properties: ['information_hiding', 'generalization', 'polymorphism'],
    score: 1.0
  },
  {
    type: 'abstract_concept',
    name: 'duality',
    definition: 'Two perspectives on the same thing',
    instances: ['wave_particle', 'time_frequency', 'primal_dual', 'syntax_semantics'],
    properties: ['complementarity', 'transformation'],
    score: 0.9
  },
  {
    type: 'abstract_concept',
    name: 'emergence',
    definition: 'Complex behavior from simple rules',
    instances: ['consciousness', 'market_behavior', 'flocking', 'intelligence'],
    properties: ['non_linearity', 'self_organization', 'unpredictability'],
    score: 0.95
  },
  {
    type: 'abstract_concept',
    name: 'invariance',
    definition: 'What remains unchanged under transformation',
    instances: ['conservation_laws', 'symmetry', 'type_safety'],
    properties: ['transformation_group', 'preserved_quantity'],
    score: 0.92
  },
  {
    type: 'abstract_concept',
    name: 'gradient',
    definition: 'Direction of steepest change',
    instances: ['derivatives', 'backpropagation', 'optimization'],
    properties: ['local_information', 'steepest_ascent'],
    score: 0.95
  }
];

// ============================================================
//  PROBLEM-SOLUTION PAIRS
//  Real examples of problems and their solutions
// ============================================================

const PROBLEM_SOLUTIONS = [
  {
    type: 'problem_solution',
    problem: 'Find the shortest path between two nodes',
    solution: 'Dijkstra\'s algorithm or A* for weighted graphs',
    reasoning: 'Greedy approach with priority queue ensures optimality',
    complexity: 'O((V+E) log V)',
    score: 0.95
  },
  {
    type: 'problem_solution',
    problem: 'Sort an array efficiently',
    solution: 'QuickSort (average), MergeSort (stable), HeapSort (in-place)',
    reasoning: 'Divide and conquer reduces comparisons to O(n log n)',
    complexity: 'O(n log n)',
    score: 0.9
  },
  {
    type: 'problem_solution',
    problem: 'Find patterns in sequences',
    solution: 'Attention mechanism / Transformer architecture',
    reasoning: 'Self-attention computes pairwise relevance scores',
    complexity: 'O(n²) for sequence length n',
    score: 0.93
  },
  {
    type: 'problem_solution',
    problem: 'Prevent catastrophic forgetting in continual learning',
    solution: 'Elastic Weight Consolidation (EWC) or Progressive Networks',
    reasoning: 'Protect important weights or expand architecture',
    complexity: 'O(params) memory overhead',
    score: 0.88
  },
  {
    type: 'problem_solution',
    problem: 'Handle variable-length inputs',
    solution: 'Padding + masking or dynamic batching',
    reasoning: 'Standardize dimensions while preserving information',
    complexity: 'O(max_length) space',
    score: 0.85
  }
];

// ============================================================
//  COGNITIVE PRIMITIVES
//  Basic building blocks of intelligence
// ============================================================

const COGNITIVE_PRIMITIVES = [
  { type: 'cognitive', name: 'pattern_recognition', description: 'Identify regularities in data', score: 1.0 },
  { type: 'cognitive', name: 'analogy_making', description: 'Map structures between domains', score: 0.95 },
  { type: 'cognitive', name: 'abstraction', description: 'Extract essential features, ignore details', score: 1.0 },
  { type: 'cognitive', name: 'planning', description: 'Sequence actions to achieve goals', score: 0.92 },
  { type: 'cognitive', name: 'prediction', description: 'Anticipate future states', score: 0.9 },
  { type: 'cognitive', name: 'counterfactual_reasoning', description: 'What would happen if...', score: 0.88 },
  { type: 'cognitive', name: 'memory_retrieval', description: 'Access relevant past experiences', score: 0.85 },
  { type: 'cognitive', name: 'attention_control', description: 'Focus on relevant information', score: 0.9 },
  { type: 'cognitive', name: 'error_correction', description: 'Detect and fix mistakes', score: 0.87 },
  { type: 'cognitive', name: 'goal_decomposition', description: 'Break complex goals into subgoals', score: 0.93 }
];

// ============================================================
//  MATHEMATICAL FOUNDATIONS
//  Core mathematical concepts
// ============================================================

const MATHEMATICAL_FOUNDATIONS = [
  { type: 'math', name: 'linear_algebra', concepts: ['vectors', 'matrices', 'eigenvalues', 'transformations'], score: 1.0 },
  { type: 'math', name: 'calculus', concepts: ['derivatives', 'integrals', 'limits', 'optimization'], score: 1.0 },
  { type: 'math', name: 'probability', concepts: ['distributions', 'bayes_theorem', 'expectation', 'independence'], score: 0.95 },
  { type: 'math', name: 'information_theory', concepts: ['entropy', 'mutual_information', 'kl_divergence', 'compression'], score: 0.92 },
  { type: 'math', name: 'graph_theory', concepts: ['nodes', 'edges', 'paths', 'connectivity'], score: 0.9 },
  { type: 'math', name: 'topology', concepts: ['continuity', 'manifolds', 'homeomorphism'], score: 0.85 },
  { type: 'math', name: 'category_theory', concepts: ['objects', 'morphisms', 'functors', 'natural_transformations'], score: 0.88 }
];

// ============================================================
//  EXPORT ALL DATA
// ============================================================

function getAllTrainingData() {
  return [
    ...REASONING_CHAINS,
    ...KNOWLEDGE_GRAPH,
    ...CROSS_DOMAIN_MAPPINGS,
    ...META_LEARNING,
    ...ABSTRACT_CONCEPTS,
    ...PROBLEM_SOLUTIONS,
    ...COGNITIVE_PRIMITIVES,
    ...MATHEMATICAL_FOUNDATIONS
  ];
}

function getDataStats() {
  return {
    reasoning_chains: REASONING_CHAINS.length,
    knowledge_graph: KNOWLEDGE_GRAPH.length,
    cross_domain: CROSS_DOMAIN_MAPPINGS.length,
    meta_learning: META_LEARNING.length,
    abstract_concepts: ABSTRACT_CONCEPTS.length,
    problem_solutions: PROBLEM_SOLUTIONS.length,
    cognitive_primitives: COGNITIVE_PRIMITIVES.length,
    mathematical: MATHEMATICAL_FOUNDATIONS.length,
    total: getAllTrainingData().length
  };
}

module.exports = {
  REASONING_CHAINS,
  KNOWLEDGE_GRAPH,
  CROSS_DOMAIN_MAPPINGS,
  META_LEARNING,
  ABSTRACT_CONCEPTS,
  PROBLEM_SOLUTIONS,
  COGNITIVE_PRIMITIVES,
  MATHEMATICAL_FOUNDATIONS,
  getAllTrainingData,
  getDataStats
};
