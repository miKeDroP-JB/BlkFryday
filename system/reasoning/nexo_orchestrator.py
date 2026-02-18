"""
═══════════════════════════════════════════════════════════════════════════════
NEXO ORCHESTRATOR - Unified Intelligence Pipeline
═══════════════════════════════════════════════════════════════════════════════

Wires together all system components into a unified intelligence pipeline:

┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXO ORCHESTRATOR                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │   MEMORY    │───▶│    TIER     │───▶│ INTEGRATOR  │                      │
│  │   SPINE     │    │   COUNCIL   │    │    BRAIN    │                      │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│         │                  │                  │                             │
│         │                  ▼                  │                             │
│         │          ┌─────────────┐           │                             │
│         └─────────▶│    NEXO     │◀──────────┘                             │
│                    │   SWARM     │                                          │
│                    │ (300 agents)│                                          │
│                    └─────────────┘                                          │
│                           │                                                 │
│                           ▼                                                 │
│                    ┌─────────────┐                                          │
│                    │   OUTPUT    │                                          │
│                    │  SYNTHESIS  │                                          │
│                    └─────────────┘                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Pipeline Flow:
1. Input → Memory Spine (context injection)
2. Memory + Input → TierCouncil (5-tier specialist analysis)
3. TierCouncil insights → IntegratorBrain (synergy detection)
4. All signals → NEXO Swarm (distributed processing)
5. Swarm consensus → Output Synthesis
"""

import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Callable
from datetime import datetime
from enum import Enum
import json

# Import all system components
from .tier_specialists import TierCouncil, Tier, SynthesisResult, Query
from .integrator_brain import A4IntegratorBrain, IntegrationOutput, IntegrationType
from .nexo_core import NexoSwarm, NexoIdentity, AgentRole
from .pattern_library import PatternLibrary, PatternEntry, PatternTier
from .jb4_key import JB4_KEY_SHORT, apply_jb4_boost

# Memory imports
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
try:
    from memory.spine import MemorySpine
    from memory.schema import RawSignal
    MEMORY_AVAILABLE = True
except ImportError:
    MEMORY_AVAILABLE = False
    MemorySpine = None


# ═══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR STATE
# ═══════════════════════════════════════════════════════════════════════════════

class ProcessingPhase(Enum):
    """Current phase in the processing pipeline"""
    IDLE = "idle"
    MEMORY_LOOKUP = "memory_lookup"
    TIER_ANALYSIS = "tier_analysis"
    INTEGRATION = "integration"
    SWARM_PROCESS = "swarm_process"
    SYNTHESIS = "synthesis"
    COMPLETE = "complete"


@dataclass
class PipelineMetrics:
    """Metrics for pipeline execution"""
    total_queries: int = 0
    successful_queries: int = 0
    avg_latency_ms: float = 0.0
    tier_contributions: Dict[str, float] = field(default_factory=dict)
    swarm_consensus_rate: float = 0.0
    memory_hit_rate: float = 0.0
    integration_multiplier: float = 1.0


@dataclass
class OrchestratorOutput:
    """Complete output from orchestrator processing"""
    query: str
    phase: ProcessingPhase

    # Component outputs
    memory_context: Optional[Dict] = None
    tier_synthesis: Optional[SynthesisResult] = None
    integration_output: Optional[IntegrationOutput] = None
    swarm_result: Optional[Dict] = None

    # Final synthesis
    final_response: str = ""
    confidence: float = 0.0
    reasoning_chain: List[str] = field(default_factory=list)

    # Metrics
    total_time_ms: float = 0.0
    component_times: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            'query': self.query,
            'phase': self.phase.value,
            'final_response': self.final_response,
            'confidence': self.confidence,
            'reasoning_chain': self.reasoning_chain,
            'total_time_ms': self.total_time_ms,
            'component_times': self.component_times
        }


# ═══════════════════════════════════════════════════════════════════════════════
# NEXO ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

class NexoOrchestrator:
    """
    Central orchestrator that unifies all system components.

    Manages the flow of information through:
    - Memory Spine (context and history)
    - TierCouncil (5 specialist agents)
    - IntegratorBrain (synergy detection)
    - NEXO Swarm (distributed consensus)
    """

    def __init__(self,
                 user_id: str = "default",
                 enable_memory: bool = True,
                 enable_swarm: bool = True,
                 swarm_clusters: int = 100):

        self.user_id = user_id
        self.phase = ProcessingPhase.IDLE
        self.metrics = PipelineMetrics()

        # Initialize components
        print("Initializing NEXO Orchestrator...")

        # Memory Spine
        self.memory_enabled = enable_memory and MEMORY_AVAILABLE
        if self.memory_enabled:
            self.memory = MemorySpine(user_id=user_id)
            print("  ✓ Memory Spine initialized")
        else:
            self.memory = None
            print("  ○ Memory Spine disabled")

        # Tier Council (5 specialists)
        self.council = TierCouncil()
        print("  ✓ Tier Council initialized (5 specialists)")

        # NEXO Swarm
        self.swarm_enabled = enable_swarm
        if enable_swarm:
            self.swarm = NexoSwarm(num_clusters=swarm_clusters)
            print(f"  ✓ NEXO Swarm initialized ({swarm_clusters * 3} agents)")
        else:
            self.swarm = None
            print("  ○ NEXO Swarm disabled")

        # Pattern Library (needed by Integrator)
        self.patterns = PatternLibrary()
        print("  ✓ Pattern Library initialized")

        # Integrator Brain (A4) - needs pattern library and swarm
        self.integrator = A4IntegratorBrain(
            library=self.patterns,
            swarm=self.swarm
        )
        print("  ✓ Integrator Brain (A4) initialized")

        # Query history
        self.history: List[OrchestratorOutput] = []

        print("NEXO Orchestrator ready.\n")

    async def process(self,
                     query: str,
                     context: Dict = None,
                     target_tiers: List[Tier] = None) -> OrchestratorOutput:
        """
        Process a query through the full pipeline.

        Args:
            query: The input query to process
            context: Additional context
            target_tiers: Specific tiers to use (None = all)

        Returns:
            OrchestratorOutput with full results
        """
        start_time = datetime.now()
        context = context or {}
        reasoning_chain = []
        component_times = {}

        output = OrchestratorOutput(
            query=query,
            phase=ProcessingPhase.IDLE
        )

        try:
            # Phase 1: Memory Lookup
            self.phase = ProcessingPhase.MEMORY_LOOKUP
            output.phase = self.phase

            if self.memory_enabled:
                mem_start = datetime.now()
                memory_context = await self._lookup_memory(query, context)
                output.memory_context = memory_context
                component_times['memory'] = (datetime.now() - mem_start).total_seconds() * 1000
                reasoning_chain.append(f"Memory context retrieved: {len(memory_context.get('entries', []))} entries")
            else:
                output.memory_context = {}
                reasoning_chain.append("Memory disabled - proceeding without context")

            # Phase 2: Tier Analysis
            self.phase = ProcessingPhase.TIER_ANALYSIS
            output.phase = self.phase

            tier_start = datetime.now()
            tier_synthesis = self._run_tier_analysis(query, output.memory_context, target_tiers)
            output.tier_synthesis = tier_synthesis
            component_times['tier_council'] = (datetime.now() - tier_start).total_seconds() * 1000
            reasoning_chain.append(f"Tier analysis complete: {tier_synthesis.confidence:.0%} confidence")

            # Phase 3: Integration
            self.phase = ProcessingPhase.INTEGRATION
            output.phase = self.phase

            int_start = datetime.now()
            integration = await self._run_integration(tier_synthesis)
            output.integration_output = integration
            component_times['integrator'] = (datetime.now() - int_start).total_seconds() * 1000
            reasoning_chain.append(f"Integration: {integration.synergies_found} synergies, {integration.multiplier_total:.1f}x multiplier")

            # Phase 4: Swarm Processing
            self.phase = ProcessingPhase.SWARM_PROCESS
            output.phase = self.phase

            if self.swarm_enabled:
                swarm_start = datetime.now()
                swarm_result = await self._run_swarm_consensus(query, tier_synthesis, integration)
                output.swarm_result = swarm_result
                component_times['swarm'] = (datetime.now() - swarm_start).total_seconds() * 1000
                reasoning_chain.append(f"Swarm consensus: {swarm_result.get('consensus_level', 0):.0%}")
            else:
                output.swarm_result = {'consensus_level': 1.0, 'bypassed': True}
                reasoning_chain.append("Swarm bypassed")

            # Phase 5: Synthesis
            self.phase = ProcessingPhase.SYNTHESIS
            output.phase = self.phase

            syn_start = datetime.now()
            final_response, confidence = self._synthesize_output(
                query, tier_synthesis, integration, output.swarm_result
            )
            output.final_response = final_response
            output.confidence = confidence
            component_times['synthesis'] = (datetime.now() - syn_start).total_seconds() * 1000
            reasoning_chain.append(f"Final synthesis: {confidence:.0%} confidence")

            # Complete
            self.phase = ProcessingPhase.COMPLETE
            output.phase = self.phase
            output.reasoning_chain = reasoning_chain
            output.component_times = component_times
            output.total_time_ms = (datetime.now() - start_time).total_seconds() * 1000

            # Update metrics
            self._update_metrics(output)

            # Store in history
            self.history.append(output)

            # Store in memory if enabled
            if self.memory_enabled:
                await self._store_in_memory(query, output)

            return output

        except Exception as e:
            output.phase = ProcessingPhase.IDLE
            output.final_response = f"Error in processing: {str(e)}"
            output.confidence = 0.0
            output.reasoning_chain = reasoning_chain + [f"ERROR: {str(e)}"]
            output.total_time_ms = (datetime.now() - start_time).total_seconds() * 1000
            return output

    async def _lookup_memory(self, query: str, context: Dict) -> Dict:
        """Retrieve relevant memory context"""
        if not self.memory:
            return {}

        # Create a mock message for memory lookup
        signal = RawSignal(
            message_id=f"query_{datetime.now().timestamp()}",
            role="user",
            content=query,
            timestamp=datetime.now()
        )

        # Get memory context
        memory_data = self.memory.inject_context(avatar_id="nexo")

        return {
            'entries': memory_data.get('knowledge', []),
            'patterns': memory_data.get('patterns', []),
            'context': memory_data
        }

    def _run_tier_analysis(self, query: str, memory_context: Dict,
                          target_tiers: List[Tier] = None) -> SynthesisResult:
        """Run analysis through TierCouncil"""
        # Inject memory context
        context = {
            'memory': memory_context,
            'timestamp': datetime.now().isoformat()
        }

        return self.council.query(query, context=context, target_tiers=target_tiers)

    async def _run_integration(self, tier_synthesis: SynthesisResult) -> IntegrationOutput:
        """Run integration through IntegratorBrain"""
        # Convert tier insights to integration input
        inputs = []
        for insight in tier_synthesis.insights:
            inputs.append({
                'tier': insight.tier.name,
                'content': insight.content,
                'confidence': insight.confidence,
                'sources': insight.sources_used
            })

        # Run integration
        return await self.integrator.integrate(inputs)

    async def _run_swarm_consensus(self, query: str,
                                   tier_synthesis: SynthesisResult,
                                   integration: IntegrationOutput) -> Dict:
        """Run distributed consensus through NEXO swarm"""
        if not self.swarm:
            return {'consensus_level': 1.0, 'bypassed': True}

        # Package the inputs for swarm processing
        swarm_input = {
            'query': query,
            'tier_synthesis': tier_synthesis.synthesis,
            'tier_confidence': tier_synthesis.confidence,
            'integration_multiplier': integration.multiplier_total,
            'synergies': integration.synergies_found
        }

        # Process through swarm
        result = await self.swarm.process(swarm_input)

        return {
            'consensus_level': result.get('consensus', 0.8),
            'cluster_votes': result.get('votes', {}),
            'emergent_patterns': result.get('patterns', []),
            'processing_time': result.get('time_ms', 0)
        }

    def _synthesize_output(self, query: str,
                          tier_synthesis: SynthesisResult,
                          integration: IntegrationOutput,
                          swarm_result: Dict) -> Tuple[str, float]:
        """Synthesize final output from all components"""

        # Build response from tier synthesis
        response_parts = [tier_synthesis.synthesis]

        # Add emergent patterns if any
        if tier_synthesis.emergent_patterns:
            response_parts.append(f"Emergent: {', '.join(tier_synthesis.emergent_patterns[:2])}")

        # Add integration heuristics if valuable
        if integration.emergent_heuristics:
            response_parts.append(f"Insights: {', '.join(integration.emergent_heuristics[:2])}")

        final_response = " | ".join(response_parts)

        # Calculate confidence
        # Base from tier synthesis, boosted by integration and swarm
        base_confidence = tier_synthesis.confidence
        integration_boost = min(0.1, (integration.multiplier_total - 1.0) * 0.05)
        swarm_boost = swarm_result.get('consensus_level', 0.8) * 0.1

        confidence = min(1.0, base_confidence + integration_boost + swarm_boost)

        # Apply JB4 boost if aligned
        if integration.jb4_aligned:
            boost_result = apply_jb4_boost(confidence, 0.5)  # 0.5 base novelty
            confidence = boost_result.boosted_confidence

        return final_response, confidence

    def _update_metrics(self, output: OrchestratorOutput):
        """Update running metrics"""
        self.metrics.total_queries += 1
        if output.confidence > 0.5:
            self.metrics.successful_queries += 1

        # Rolling average for latency
        n = self.metrics.total_queries
        self.metrics.avg_latency_ms = (
            (self.metrics.avg_latency_ms * (n - 1) + output.total_time_ms) / n
        )

        # Track tier contributions
        if output.tier_synthesis:
            for tier, contrib in output.tier_synthesis.tier_contributions.items():
                tier_name = tier.name
                if tier_name not in self.metrics.tier_contributions:
                    self.metrics.tier_contributions[tier_name] = 0.0
                self.metrics.tier_contributions[tier_name] = (
                    (self.metrics.tier_contributions[tier_name] * (n - 1) + contrib) / n
                )

        # Swarm consensus
        if output.swarm_result:
            consensus = output.swarm_result.get('consensus_level', 0.8)
            self.metrics.swarm_consensus_rate = (
                (self.metrics.swarm_consensus_rate * (n - 1) + consensus) / n
            )

        # Integration multiplier
        if output.integration_output:
            self.metrics.integration_multiplier = (
                (self.metrics.integration_multiplier * (n - 1) +
                 output.integration_output.multiplier_total) / n
            )

    async def _store_in_memory(self, query: str, output: OrchestratorOutput):
        """Store the query and output in memory"""
        if not self.memory:
            return

        # Store as a processed message
        signal = RawSignal(
            message_id=f"query_{datetime.now().timestamp()}",
            role="user",
            content=query,
            timestamp=datetime.now()
        )

        await self.memory.process_message(signal)

        # Store the response
        response_signal = RawSignal(
            message_id=f"response_{datetime.now().timestamp()}",
            role="assistant",
            content=output.final_response,
            timestamp=datetime.now()
        )

        await self.memory.process_message(response_signal)

    def get_status(self) -> Dict:
        """Get current orchestrator status"""
        return {
            'phase': self.phase.value,
            'metrics': {
                'total_queries': self.metrics.total_queries,
                'successful_queries': self.metrics.successful_queries,
                'success_rate': self.metrics.successful_queries / max(1, self.metrics.total_queries),
                'avg_latency_ms': self.metrics.avg_latency_ms,
                'tier_contributions': self.metrics.tier_contributions,
                'swarm_consensus_rate': self.metrics.swarm_consensus_rate,
                'integration_multiplier': self.metrics.integration_multiplier
            },
            'components': {
                'memory': self.memory_enabled,
                'swarm': self.swarm_enabled,
                'tier_council': True,
                'integrator': True
            },
            'history_size': len(self.history)
        }

    def describe(self) -> str:
        """Describe the orchestrator configuration"""
        status = self.get_status()

        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                           NEXO ORCHESTRATOR                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Components:                                                                 ║
║    Memory Spine:    {'✓ Enabled' if status['components']['memory'] else '○ Disabled':15}                                    ║
║    Tier Council:    {'✓ Enabled':15} (5 specialists)                         ║
║    Integrator:      {'✓ Enabled':15}                                         ║
║    NEXO Swarm:      {'✓ Enabled' if status['components']['swarm'] else '○ Disabled':15} ({self.swarm.num_clusters * 3 if self.swarm else 0} agents)                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Metrics:                                                                    ║
║    Total Queries:     {status['metrics']['total_queries']:>6}                                               ║
║    Success Rate:      {status['metrics']['success_rate']:>5.0%}                                               ║
║    Avg Latency:       {status['metrics']['avg_latency_ms']:>6.1f}ms                                            ║
║    Swarm Consensus:   {status['metrics']['swarm_consensus_rate']:>5.0%}                                               ║
║    Integration Mult:  {status['metrics']['integration_multiplier']:>5.1f}x                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK TEST
# ═══════════════════════════════════════════════════════════════════════════════

async def test_orchestrator():
    """Test the NEXO Orchestrator"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███╗   ██╗███████╗██╗  ██╗ ██████╗                                          ║
║  ████╗  ██║██╔════╝╚██╗██╔╝██╔═══██╗                                         ║
║  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║                                         ║
║  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║                                         ║
║  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝                                         ║
║  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝                                          ║
║                                                                              ║
║                    ORCHESTRATOR TEST                                         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    # Initialize orchestrator (disable swarm for faster test)
    orchestrator = NexoOrchestrator(
        user_id="test_user",
        enable_memory=False,  # Disable for test
        enable_swarm=False,   # Disable for test
        swarm_clusters=10
    )

    # Test queries
    test_queries = [
        "How should we design a fault-tolerant distributed system?",
        "What's the best approach to negotiate a difficult situation?",
        "Analyze the logical structure of this argument about AI safety.",
    ]

    print("\n" + "=" * 70)
    print("RUNNING TEST QUERIES...")
    print("=" * 70)

    for i, query in enumerate(test_queries, 1):
        print(f"\n[Query {i}] {query[:60]}...")

        result = await orchestrator.process(query)

        print(f"  Phase: {result.phase.value}")
        print(f"  Confidence: {result.confidence:.0%}")
        print(f"  Time: {result.total_time_ms:.1f}ms")
        print(f"  Response: {result.final_response[:100]}...")

        # Show component times
        print(f"  Components:")
        for comp, time_ms in result.component_times.items():
            print(f"    - {comp}: {time_ms:.1f}ms")

    # Show final status
    print("\n" + "=" * 70)
    print("FINAL STATUS:")
    print("=" * 70)
    print(orchestrator.describe())

    print("✓ Orchestrator test complete!")

    return orchestrator


if __name__ == "__main__":
    asyncio.run(test_orchestrator())
