'use client';

/**
 * ====================================================
 *  GRIMOIRE UI - Spell Casting Interface
 * ====================================================
 *  Visual interface for the Grimoire spell system
 *  - Spell catalog browser
 *  - Variable binding
 *  - Casting animations
 *  - Result visualization
 * ====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';

// Spell categories and their icons
const SPELL_CATEGORIES = {
  BUILD: { icon: '\u2B22', color: '#00ffff', name: 'Build Spells' },
  TRANSFORM: { icon: '\u2728', color: '#ff00ff', name: 'Transform Spells' },
  ANALYZE: { icon: '\uD83E\uDDE0', color: '#8844ff', name: 'Analysis Spells' },
  SUMMON: { icon: '\u26A1', color: '#ffff00', name: 'Summon Spells' },
  TRANSCEND: { icon: '\u267E\uFE0F', color: '#00ff88', name: 'Transcend Spells' }
};

// Default spell definitions (synced with backend Grimoire.js)
const DEFAULT_SPELLS = [
  {
    id: 'landing-page',
    name: 'Conjure Landing Page',
    category: 'BUILD',
    glyph: '\u2B22\u25B3\uD83D\uDE80',
    incantation: 'By the power of {swarm}, manifest a landing page for {company} selling {product}',
    variables: ['swarm', 'company', 'product'],
    effect: 'GENERATE_LANDING'
  },
  {
    id: 'brand-identity',
    name: 'Forge Brand Identity',
    category: 'BUILD',
    glyph: '\u2640\uD83C\uDFA8\u25C7',
    incantation: 'Forge a complete brand identity for {company} in the {industry} space',
    variables: ['company', 'industry'],
    effect: 'GENERATE_BRAND'
  },
  {
    id: 'analyze-code',
    name: 'Oracle Sight',
    category: 'ANALYZE',
    glyph: '\uD83D\uDD2E\uD83E\uDDE0\uD83D\uDC41\uFE0F',
    incantation: 'With Oracle sight, analyze {code} for {purpose}',
    variables: ['code', 'purpose'],
    effect: 'ANALYZE_CODE'
  },
  {
    id: 'summon-swarm',
    name: 'Summon Swarm Legion',
    category: 'SUMMON',
    glyph: '\uD83D\uDC1D\u26A1\u2295',
    incantation: 'Rise, {swarm} swarm! Execute {task} with full force!',
    variables: ['swarm', 'task'],
    effect: 'ACTIVATE_SWARM'
  },
  {
    id: 'transcend',
    name: 'GODMODE Transcendence',
    category: 'TRANSCEND',
    glyph: '\u269B\uFE0F\uD83E\uDDE0\u221E',
    incantation: 'By quantum entanglement, transcend all limits for {goal}',
    variables: ['goal'],
    effect: 'ACTIVATE_GODMODE'
  },
  {
    id: 'transform-content',
    name: 'Transmute Content',
    category: 'TRANSFORM',
    glyph: '\u2728\u25BD\u25B3',
    incantation: 'Transform {source} into {target} with {style} essence',
    variables: ['source', 'target', 'style'],
    effect: 'TRANSFORM_CONTENT'
  }
];

export default function GrimoireUI({
  onCast,
  onClose,
  spells = DEFAULT_SPELLS,
  isOpen = true,
  compact = false
}) {
  // State
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [variables, setVariables] = useState({});
  const [isCasting, setIsCasting] = useState(false);
  const [castResult, setCastResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter spells
  const filteredSpells = spells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          spell.incantation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || spell.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Select spell
  const handleSelectSpell = (spell) => {
    setSelectedSpell(spell);
    setCastResult(null);
    // Initialize variables
    const vars = {};
    spell.variables.forEach(v => { vars[v] = ''; });
    setVariables(vars);
  };

  // Update variable
  const handleVariableChange = (varName, value) => {
    setVariables(prev => ({ ...prev, [varName]: value }));
  };

  // Cast spell
  const handleCast = async () => {
    if (!selectedSpell) return;

    // Validate variables
    const missingVars = selectedSpell.variables.filter(v => !variables[v]?.trim());
    if (missingVars.length > 0) {
      setCastResult({
        success: false,
        error: `Missing required variables: ${missingVars.join(', ')}`
      });
      return;
    }

    setIsCasting(true);
    setCastResult(null);

    try {
      const response = await fetch('/api/v11/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spellId: selectedSpell.id,
          variables
        })
      });

      const data = await response.json();

      if (data.success) {
        setCastResult({
          success: true,
          output: data.data.output,
          resolvedIncantation: data.data.resolvedIncantation,
          executionTime: data.data.executionTime
        });
        onCast?.(data.data);
      } else {
        setCastResult({
          success: false,
          error: data.error || 'Spell casting failed'
        });
      }
    } catch (err) {
      setCastResult({
        success: false,
        error: err.message
      });
    } finally {
      setIsCasting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={compact ? styles.containerCompact : styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span style={styles.titleIcon}>\uD83D\uDCD6</span>
          GRIMOIRE
        </div>
        {onClose && (
          <button onClick={onClose} style={styles.closeBtn}>\u2715</button>
        )}
      </div>

      {/* Search & Filter */}
      <div style={styles.searchBar}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search spells..."
          style={styles.searchInput}
        />
        <div style={styles.categoryFilter}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              ...styles.categoryBtn,
              borderColor: !selectedCategory ? '#00ffff' : 'rgba(0,255,255,0.2)'
            }}
          >
            All
          </button>
          {Object.entries(SPELL_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                ...styles.categoryBtn,
                borderColor: selectedCategory === key ? cat.color : 'rgba(0,255,255,0.2)',
                color: selectedCategory === key ? cat.color : 'rgba(0,255,255,0.6)'
              }}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {/* Spell List */}
        <div style={styles.spellList}>
          {filteredSpells.map(spell => {
            const category = SPELL_CATEGORIES[spell.category];
            return (
              <div
                key={spell.id}
                onClick={() => handleSelectSpell(spell)}
                style={{
                  ...styles.spellCard,
                  borderColor: selectedSpell?.id === spell.id ? category?.color : 'rgba(0,255,255,0.2)',
                  background: selectedSpell?.id === spell.id ? `${category?.color}15` : 'transparent'
                }}
              >
                <div style={styles.spellGlyph}>{spell.glyph}</div>
                <div style={styles.spellInfo}>
                  <div style={{ ...styles.spellName, color: category?.color }}>{spell.name}</div>
                  <div style={styles.spellCategory}>{category?.name}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spell Detail */}
        {selectedSpell && (
          <div style={styles.spellDetail}>
            <div style={styles.detailHeader}>
              <span style={styles.detailGlyph}>{selectedSpell.glyph}</span>
              <span style={styles.detailName}>{selectedSpell.name}</span>
            </div>

            {/* Incantation */}
            <div style={styles.incantation}>
              <div style={styles.incantationLabel}>Incantation:</div>
              <div style={styles.incantationText}>
                "{selectedSpell.incantation}"
              </div>
            </div>

            {/* Variables */}
            <div style={styles.variablesSection}>
              <div style={styles.variablesLabel}>Variables:</div>
              {selectedSpell.variables.map(varName => (
                <div key={varName} style={styles.variableRow}>
                  <label style={styles.variableLabel}>{`{${varName}}`}</label>
                  <input
                    type="text"
                    value={variables[varName] || ''}
                    onChange={(e) => handleVariableChange(varName, e.target.value)}
                    placeholder={`Enter ${varName}...`}
                    style={styles.variableInput}
                  />
                </div>
              ))}
            </div>

            {/* Cast Button */}
            <button
              onClick={handleCast}
              disabled={isCasting}
              style={{
                ...styles.castBtn,
                opacity: isCasting ? 0.6 : 1
              }}
            >
              {isCasting ? (
                <span>\u2728 Casting...</span>
              ) : (
                <span>\u26A1 Cast Spell</span>
              )}
            </button>

            {/* Result */}
            {castResult && (
              <div style={{
                ...styles.result,
                borderColor: castResult.success ? '#00ff88' : '#ff4444',
                background: castResult.success ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)'
              }}>
                {castResult.success ? (
                  <>
                    <div style={styles.resultSuccess}>\u2713 Spell Cast Successfully!</div>
                    {castResult.resolvedIncantation && (
                      <div style={styles.resultIncantation}>
                        "{castResult.resolvedIncantation}"
                      </div>
                    )}
                    {castResult.executionTime && (
                      <div style={styles.resultTime}>
                        Executed in {castResult.executionTime}ms
                      </div>
                    )}
                  </>
                ) : (
                  <div style={styles.resultError}>
                    \u2717 {castResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const styles = {
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 800,
    maxHeight: '80vh',
    background: 'linear-gradient(135deg, #0a0a12 0%, #0f0f1a 100%)',
    border: '2px solid rgba(0,255,255,0.3)',
    borderRadius: 12,
    overflow: 'hidden',
    fontFamily: "'Space Mono', monospace",
    color: '#00ffff',
    zIndex: 1000,
    boxShadow: '0 0 60px rgba(0,255,255,0.2)'
  },
  containerCompact: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(10,10,18,0.95)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 8,
    fontFamily: "'Space Mono', monospace",
    color: '#00ffff'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0,255,255,0.2)',
    background: 'rgba(0,255,255,0.05)'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  titleIcon: { fontSize: 24 },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(0,255,255,0.6)',
    fontSize: 20,
    cursor: 'pointer'
  },
  searchBar: {
    padding: 16,
    borderBottom: '1px solid rgba(0,255,255,0.1)',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    padding: '10px 16px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit'
  },
  categoryFilter: {
    display: 'flex',
    gap: 8
  },
  categoryBtn: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4,
    color: 'rgba(0,255,255,0.6)',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.2s'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    maxHeight: 'calc(80vh - 140px)',
    overflow: 'hidden'
  },
  spellList: {
    borderRight: '1px solid rgba(0,255,255,0.1)',
    overflowY: 'auto',
    padding: 12
  },
  spellCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  spellGlyph: {
    fontSize: 20,
    minWidth: 48,
    textAlign: 'center'
  },
  spellInfo: { flex: 1 },
  spellName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2
  },
  spellCategory: {
    fontSize: 10,
    color: 'rgba(0,255,255,0.5)'
  },
  spellDetail: {
    padding: 20,
    overflowY: 'auto'
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24
  },
  detailGlyph: {
    fontSize: 48,
    textShadow: '0 0 20px rgba(0,255,255,0.5)'
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  incantation: {
    marginBottom: 24,
    padding: 16,
    background: 'rgba(0,255,255,0.05)',
    borderRadius: 8,
    borderLeft: '3px solid #00ffff'
  },
  incantationLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    color: 'rgba(0,255,255,0.6)'
  },
  incantationText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#fff',
    lineHeight: 1.6
  },
  variablesSection: {
    marginBottom: 24
  },
  variablesLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    color: 'rgba(0,255,255,0.6)'
  },
  variableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  variableLabel: {
    fontSize: 12,
    color: '#ff00ff',
    minWidth: 100
  },
  variableInput: {
    flex: 1,
    padding: '10px 14px',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit'
  },
  castBtn: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #00ffff, #0066ff)',
    border: 'none',
    borderRadius: 8,
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  result: {
    marginTop: 20,
    padding: 16,
    border: '1px solid',
    borderRadius: 8
  },
  resultSuccess: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 8
  },
  resultIncantation: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8
  },
  resultTime: {
    fontSize: 10,
    color: 'rgba(0,255,255,0.6)'
  },
  resultError: {
    fontSize: 14,
    color: '#ff4444'
  }
};
