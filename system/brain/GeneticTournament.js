/**
 * GENETIC ALGORITHM TOURNAMENT SYSTEM
 * Self-evolving prompts that get better over generations
 *
 * "Survival of the fittest prompts" - Genetic Philosophy
 *
 * Process:
 * 1. Start with population of prompt variants
 * 2. Execute all variants
 * 3. Evaluate fitness (quality score)
 * 4. Select top performers
 * 5. Crossover & mutate to create next generation
 * 6. Repeat until convergence or max generations
 */

const { MultiModelClient } = require('./MultiModelSwarm');
const { QualityEvaluator } = require('./CascadeEngine');

// Genetic operators for prompt evolution
const MUTATIONS = {
  ADD_STEP_BY_STEP: {
    name: 'add_step_by_step',
    apply: (prompt) => prompt + '\n\nThink step by step.',
    probability: 0.3
  },
  ADD_EXPERT: {
    name: 'add_expert',
    apply: (prompt) => `As an expert, ${prompt}`,
    probability: 0.2
  },
  ADD_CONCISE: {
    name: 'add_concise',
    apply: (prompt) => prompt + '\n\nBe concise.',
    probability: 0.2
  },
  ADD_DETAILED: {
    name: 'add_detailed',
    apply: (prompt) => prompt + '\n\nProvide detailed explanation.',
    probability: 0.15
  },
  ADD_EXAMPLES: {
    name: 'add_examples',
    apply: (prompt) => prompt + '\n\nInclude examples.',
    probability: 0.2
  },
  ADD_STRUCTURE: {
    name: 'add_structure',
    apply: (prompt) => prompt + '\n\nOrganize with clear headings and bullet points.',
    probability: 0.15
  },
  ADD_CONTEXT: {
    name: 'add_context',
    apply: (prompt) => `Context: This is an important task.\n\n${prompt}`,
    probability: 0.1
  },
  REPHRASE: {
    name: 'rephrase',
    apply: (prompt) => `Please ${prompt.toLowerCase()}`,
    probability: 0.1
  },
  ADD_CONSTRAINTS: {
    name: 'add_constraints',
    apply: (prompt) => prompt + '\n\nConstraints: Be accurate, thorough, and practical.',
    probability: 0.15
  },
  ADD_OUTPUT_FORMAT: {
    name: 'add_output_format',
    apply: (prompt) => prompt + '\n\nFormat your response clearly with sections.',
    probability: 0.1
  }
};

// System prompt variations for genetic diversity
const SYSTEM_PROMPT_GENES = [
  'You are a helpful AI assistant.',
  'You are an expert problem solver.',
  'You are a precise and thorough analyst.',
  'You are a creative thinker who provides innovative solutions.',
  'You are a senior professional with deep expertise.',
  'You provide concise, actionable responses.',
  'You think step-by-step and explain your reasoning.',
  'You focus on practical, implementable solutions.',
  'You consider multiple perspectives before answering.',
  'You prioritize accuracy and completeness.'
];

/**
 * Prompt Chromosome
 * Represents a single prompt variant with its genetic makeup
 */
class PromptChromosome {
  constructor(basePrompt, options = {}) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.basePrompt = basePrompt;
    this.mutations = options.mutations || [];
    this.systemPrompt = options.systemPrompt || SYSTEM_PROMPT_GENES[0];
    this.temperature = options.temperature || 0.7;
    this.fitness = 0;
    this.generation = options.generation || 0;
    this.parentIds = options.parentIds || [];
  }

  /**
   * Get the fully constructed prompt
   */
  getPrompt() {
    let prompt = this.basePrompt;
    for (const mutation of this.mutations) {
      if (MUTATIONS[mutation]) {
        prompt = MUTATIONS[mutation].apply(prompt);
      }
    }
    return prompt;
  }

  /**
   * Create a mutated copy
   */
  mutate() {
    const newMutations = [...this.mutations];
    const newTemperature = this.temperature;

    // Randomly add a mutation
    const availableMutations = Object.keys(MUTATIONS).filter(m => !newMutations.includes(m));
    if (availableMutations.length > 0) {
      for (const mutationKey of availableMutations) {
        if (Math.random() < MUTATIONS[mutationKey].probability) {
          newMutations.push(mutationKey);
          break; // Only add one mutation per generation
        }
      }
    }

    // Occasionally remove a mutation
    if (newMutations.length > 0 && Math.random() < 0.2) {
      const removeIndex = Math.floor(Math.random() * newMutations.length);
      newMutations.splice(removeIndex, 1);
    }

    // Mutate temperature slightly
    const tempChange = (Math.random() - 0.5) * 0.2;
    const newTemp = Math.max(0.1, Math.min(1.5, newTemperature + tempChange));

    // Possibly change system prompt
    let newSystemPrompt = this.systemPrompt;
    if (Math.random() < 0.1) {
      newSystemPrompt = SYSTEM_PROMPT_GENES[Math.floor(Math.random() * SYSTEM_PROMPT_GENES.length)];
    }

    return new PromptChromosome(this.basePrompt, {
      mutations: newMutations,
      systemPrompt: newSystemPrompt,
      temperature: newTemp,
      generation: this.generation + 1,
      parentIds: [this.id]
    });
  }

  /**
   * Crossover with another chromosome
   */
  crossover(other) {
    // Take mutations from both parents
    const combinedMutations = [...new Set([
      ...this.mutations.slice(0, Math.ceil(this.mutations.length / 2)),
      ...other.mutations.slice(0, Math.ceil(other.mutations.length / 2))
    ])];

    // Average temperature
    const newTemp = (this.temperature + other.temperature) / 2;

    // Randomly pick system prompt from either parent
    const newSystemPrompt = Math.random() < 0.5 ? this.systemPrompt : other.systemPrompt;

    return new PromptChromosome(this.basePrompt, {
      mutations: combinedMutations,
      systemPrompt: newSystemPrompt,
      temperature: newTemp,
      generation: Math.max(this.generation, other.generation) + 1,
      parentIds: [this.id, other.id]
    });
  }

  toJSON() {
    return {
      id: this.id,
      prompt: this.getPrompt(),
      mutations: this.mutations,
      systemPrompt: this.systemPrompt,
      temperature: this.temperature,
      fitness: this.fitness,
      generation: this.generation,
      parentIds: this.parentIds
    };
  }
}

/**
 * Genetic Tournament
 * Evolves prompts to find optimal formulation
 */
class GeneticTournament {
  constructor(config = {}) {
    this.client = new MultiModelClient(config.apiKeys);
    this.evaluator = new QualityEvaluator(config);

    // Genetic algorithm parameters
    this.populationSize = config.populationSize || 10;
    this.maxGenerations = config.maxGenerations || 5;
    this.eliteCount = config.eliteCount || 2;
    this.mutationRate = config.mutationRate || 0.3;
    this.crossoverRate = config.crossoverRate || 0.5;
    this.convergenceThreshold = config.convergenceThreshold || 0.95;

    // Execution parameters
    this.provider = config.provider || 'groq'; // Fast for iterations
    this.model = config.model || 'llama-3.1-70b-versatile';

    // History
    this.evolutionHistory = [];
  }

  /**
   * Initialize population with diverse prompts
   */
  initializePopulation(task) {
    const population = [];

    // Add base prompt
    population.push(new PromptChromosome(task));

    // Add variants with different mutations
    const mutationKeys = Object.keys(MUTATIONS);
    for (let i = 1; i < this.populationSize; i++) {
      const mutations = [];
      // Randomly select 0-3 mutations
      const numMutations = Math.floor(Math.random() * 3);
      for (let j = 0; j < numMutations; j++) {
        const mutation = mutationKeys[Math.floor(Math.random() * mutationKeys.length)];
        if (!mutations.includes(mutation)) {
          mutations.push(mutation);
        }
      }

      population.push(new PromptChromosome(task, {
        mutations,
        systemPrompt: SYSTEM_PROMPT_GENES[Math.floor(Math.random() * SYSTEM_PROMPT_GENES.length)],
        temperature: 0.3 + Math.random() * 0.8
      }));
    }

    return population;
  }

  /**
   * Evaluate fitness of all chromosomes in population
   */
  async evaluatePopulation(population, task) {
    const evaluations = await Promise.all(
      population.map(async (chromosome) => {
        const messages = [
          { role: 'system', content: chromosome.systemPrompt },
          { role: 'user', content: chromosome.getPrompt() }
        ];

        const result = await this.client.call(
          this.provider,
          this.model,
          messages,
          { temperature: chromosome.temperature }
        );

        if (result.success) {
          const evaluation = this.evaluator.evaluate(result, task);
          chromosome.fitness = evaluation.score;
          return {
            chromosome,
            result,
            evaluation
          };
        } else {
          chromosome.fitness = 0;
          return {
            chromosome,
            result,
            evaluation: { score: 0 }
          };
        }
      })
    );

    return evaluations;
  }

  /**
   * Select parents for next generation (tournament selection)
   */
  selectParents(population, count) {
    const selected = [];
    const tournamentSize = 3;

    for (let i = 0; i < count; i++) {
      // Random tournament
      const tournament = [];
      for (let j = 0; j < tournamentSize; j++) {
        tournament.push(population[Math.floor(Math.random() * population.length)]);
      }

      // Winner is the one with highest fitness
      const winner = tournament.reduce((best, current) =>
        current.fitness > best.fitness ? current : best
      );
      selected.push(winner);
    }

    return selected;
  }

  /**
   * Create next generation
   */
  createNextGeneration(population) {
    const newPopulation = [];

    // Sort by fitness
    const sorted = [...population].sort((a, b) => b.fitness - a.fitness);

    // Elitism: keep top performers
    for (let i = 0; i < this.eliteCount; i++) {
      newPopulation.push(sorted[i]);
    }

    // Fill rest with offspring
    while (newPopulation.length < this.populationSize) {
      const parents = this.selectParents(sorted, 2);

      let child;
      if (Math.random() < this.crossoverRate) {
        // Crossover
        child = parents[0].crossover(parents[1]);
      } else {
        // Clone better parent
        child = parents[0].fitness > parents[1].fitness
          ? parents[0].mutate()
          : parents[1].mutate();
      }

      // Mutate
      if (Math.random() < this.mutationRate) {
        child = child.mutate();
      }

      newPopulation.push(child);
    }

    return newPopulation;
  }

  /**
   * Run the genetic tournament
   */
  async evolve(task, options = {}) {
    const startTime = Date.now();
    this.evolutionHistory = [];

    // Initialize
    let population = this.initializePopulation(task);
    let generation = 0;
    let bestEver = { fitness: 0 };

    // Evolution loop
    while (generation < this.maxGenerations) {
      // Evaluate
      const evaluations = await this.evaluatePopulation(population, task);

      // Track best
      const currentBest = evaluations.reduce((best, current) =>
        current.chromosome.fitness > best.chromosome.fitness ? current : best
      );

      if (currentBest.chromosome.fitness > bestEver.fitness) {
        bestEver = {
          ...currentBest,
          fitness: currentBest.chromosome.fitness,
          generation
        };
      }

      // Record history
      this.evolutionHistory.push({
        generation,
        avgFitness: evaluations.reduce((sum, e) => sum + e.chromosome.fitness, 0) / evaluations.length,
        bestFitness: currentBest.chromosome.fitness,
        bestChromosome: currentBest.chromosome.toJSON()
      });

      // Check convergence
      if (currentBest.chromosome.fitness >= this.convergenceThreshold) {
        break;
      }

      // Create next generation
      population = this.createNextGeneration(population);
      generation++;
    }

    return {
      success: true,
      task,
      winner: bestEver.chromosome.toJSON(),
      winnerResponse: bestEver.result?.content,
      fitness: bestEver.fitness,
      generation: bestEver.generation,
      totalGenerations: generation + 1,
      evolutionHistory: this.evolutionHistory,
      totalLatency: Date.now() - startTime,
      improvement: this.calculateImprovement()
    };
  }

  /**
   * Calculate improvement over generations
   */
  calculateImprovement() {
    if (this.evolutionHistory.length < 2) return 0;

    const first = this.evolutionHistory[0].bestFitness;
    const last = this.evolutionHistory[this.evolutionHistory.length - 1].bestFitness;

    return ((last - first) / Math.max(first, 0.01)) * 100;
  }

  /**
   * Get evolution statistics
   */
  getEvolutionStats() {
    return {
      generations: this.evolutionHistory.length,
      history: this.evolutionHistory,
      improvement: `${this.calculateImprovement().toFixed(1)}%`,
      bestMutations: this.evolutionHistory.length > 0
        ? this.evolutionHistory[this.evolutionHistory.length - 1].bestChromosome.mutations
        : []
    };
  }
}

/**
 * Quick evolution helper
 */
async function evolve(task, options = {}) {
  const tournament = new GeneticTournament(options);
  return tournament.evolve(task, options);
}

module.exports = {
  MUTATIONS,
  SYSTEM_PROMPT_GENES,
  PromptChromosome,
  GeneticTournament,
  evolve
};
