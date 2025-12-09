/**
 * ARC-AGI MODULE
 * Abstract Reasoning Corpus Solver
 *
 * "To understand the universe, first understand the pattern."
 */

const AbstractionEngine = require('./AbstractionEngine');
const GridPrimitives = require('./Primitives');
const { Evaluator, SAMPLE_TASKS } = require('./Evaluator');

module.exports = {
  AbstractionEngine,
  GridPrimitives,
  Evaluator,
  SAMPLE_TASKS
};
