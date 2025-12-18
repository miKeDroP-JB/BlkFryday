// ============================================================
//  ORBOS V11.5 - CODE AGGREGATOR
//  Aggregate code from all available sources
// ============================================================
//
//  Sources: GitHub, StackOverflow, Documentation, AI models
//  Purpose: Find the best code solutions from everywhere
//
// ============================================================

class CodeAggregator {
  constructor(config = {}) {
    this.config = config;

    // Code sources
    this.sources = {
      github: {
        name: 'GitHub Search',
        type: 'repository',
        endpoint: 'https://api.github.com/search/code',
        enabled: !!process.env.GITHUB_TOKEN
      },
      stackoverflow: {
        name: 'StackOverflow',
        type: 'qa',
        endpoint: 'https://api.stackexchange.com/2.3/search/advanced',
        enabled: true
      },
      npmRegistry: {
        name: 'NPM Registry',
        type: 'packages',
        endpoint: 'https://registry.npmjs.org/-/v1/search',
        enabled: true
      },
      pypi: {
        name: 'PyPI',
        type: 'packages',
        endpoint: 'https://pypi.org/pypi',
        enabled: true
      },
      devDocs: {
        name: 'DevDocs',
        type: 'documentation',
        endpoint: 'https://devdocs.io',
        enabled: true
      },
      mdn: {
        name: 'MDN Web Docs',
        type: 'documentation',
        endpoint: 'https://developer.mozilla.org/api/v1/search',
        enabled: true
      }
    };

    // Code patterns database
    this.patterns = new Map();
  }

  // ============================================================
  //  SEARCH ALL SOURCES
  // ============================================================

  async searchAll(query, options = {}) {
    const { language, limit = 10, sources = Object.keys(this.sources) } = options;

    console.log(`[CodeAggregator] Searching "${query}" across ${sources.length} sources`);

    const results = await Promise.allSettled(
      sources
        .filter(s => this.sources[s]?.enabled)
        .map(source => this.searchSource(source, query, { language, limit }))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Rank results
    const ranked = this.rankResults(successful, query);

    return {
      total: ranked.length,
      query,
      results: ranked.slice(0, limit),
      sources: sources.filter(s => this.sources[s]?.enabled)
    };
  }

  // ============================================================
  //  SOURCE-SPECIFIC SEARCHES
  // ============================================================

  async searchSource(sourceId, query, options = {}) {
    switch (sourceId) {
      case 'github':
        return this.searchGitHub(query, options);
      case 'stackoverflow':
        return this.searchStackOverflow(query, options);
      case 'npmRegistry':
        return this.searchNPM(query, options);
      case 'mdn':
        return this.searchMDN(query, options);
      default:
        return [];
    }
  }

  async searchGitHub(query, options = {}) {
    try {
      const langFilter = options.language ? `+language:${options.language}` : '';
      const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}${langFilter}&per_page=${options.limit || 10}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : ''
        }
      });

      if (!response.ok) return [];

      const data = await response.json();

      return (data.items || []).map(item => ({
        source: 'github',
        type: 'code',
        title: item.name,
        url: item.html_url,
        repository: item.repository?.full_name,
        path: item.path,
        score: item.score,
        language: options.language
      }));
    } catch (error) {
      console.error('[GitHub] Search error:', error.message);
      return [];
    }
  }

  async searchStackOverflow(query, options = {}) {
    try {
      const tagFilter = options.language ? `&tagged=${options.language}` : '';
      const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}${tagFilter}&site=stackoverflow&pagesize=${options.limit || 10}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();

      return (data.items || []).map(item => ({
        source: 'stackoverflow',
        type: 'qa',
        title: item.title,
        url: item.link,
        score: item.score,
        answers: item.answer_count,
        accepted: item.is_answered,
        tags: item.tags
      }));
    } catch (error) {
      console.error('[StackOverflow] Search error:', error.message);
      return [];
    }
  }

  async searchNPM(query, options = {}) {
    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${options.limit || 10}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();

      return (data.objects || []).map(item => ({
        source: 'npm',
        type: 'package',
        title: item.package.name,
        description: item.package.description,
        url: `https://www.npmjs.com/package/${item.package.name}`,
        version: item.package.version,
        score: item.score?.final || 0,
        downloads: item.package.downloads
      }));
    } catch (error) {
      console.error('[NPM] Search error:', error.message);
      return [];
    }
  }

  async searchMDN(query, options = {}) {
    try {
      const url = `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(query)}&locale=en-US&size=${options.limit || 10}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();

      return (data.documents || []).map(item => ({
        source: 'mdn',
        type: 'documentation',
        title: item.title,
        url: `https://developer.mozilla.org${item.mdn_url}`,
        summary: item.summary,
        score: item.score || 0
      }));
    } catch (error) {
      console.error('[MDN] Search error:', error.message);
      return [];
    }
  }

  // ============================================================
  //  FETCH CODE CONTENT
  // ============================================================

  async fetchCode(result) {
    if (result.source === 'github' && result.url) {
      return this.fetchGitHubCode(result.url);
    }

    if (result.source === 'stackoverflow' && result.url) {
      return this.fetchStackOverflowAnswers(result.url);
    }

    return null;
  }

  async fetchGitHubCode(url) {
    try {
      // Convert HTML URL to raw URL
      const rawUrl = url
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');

      const response = await fetch(rawUrl);
      if (!response.ok) return null;

      return await response.text();
    } catch (error) {
      return null;
    }
  }

  async fetchStackOverflowAnswers(url) {
    try {
      // Extract question ID
      const match = url.match(/questions\/(\d+)/);
      if (!match) return null;

      const questionId = match[1];
      const apiUrl = `https://api.stackexchange.com/2.3/questions/${questionId}/answers?order=desc&sort=votes&site=stackoverflow&filter=withbody`;

      const response = await fetch(apiUrl);
      if (!response.ok) return null;

      const data = await response.json();

      return (data.items || []).map(answer => ({
        score: answer.score,
        accepted: answer.is_accepted,
        body: answer.body
      }));
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  //  RANKING
  // ============================================================

  rankResults(results, query) {
    return results
      .map(result => ({
        ...result,
        relevanceScore: this.calculateRelevance(result, query)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateRelevance(result, query) {
    let score = result.score || 0;

    // Source weights
    const sourceWeights = {
      github: 1.2,
      stackoverflow: 1.5,
      npm: 1.0,
      mdn: 1.3
    };
    score *= sourceWeights[result.source] || 1;

    // Bonus for accepted answers
    if (result.accepted) score *= 1.5;

    // Bonus for high vote counts
    if (result.answers > 5) score *= 1.2;

    return score;
  }

  // ============================================================
  //  CODE SYNTHESIS
  // ============================================================

  async synthesizeCode(task, searchResults, options = {}) {
    // Fetch actual code from top results
    const codeSnippets = await Promise.all(
      searchResults.slice(0, 5).map(r => this.fetchCode(r))
    );

    const validSnippets = codeSnippets.filter(Boolean);

    return {
      task,
      snippets: validSnippets,
      sources: searchResults.slice(0, 5).map(r => r.url),
      synthesisPrompt: this.buildSynthesisPrompt(task, validSnippets)
    };
  }

  buildSynthesisPrompt(task, snippets) {
    return `
Task: ${task}

I found these relevant code examples from various sources:

${snippets.map((code, i) => `
=== Example ${i + 1} ===
${typeof code === 'string' ? code.slice(0, 2000) : JSON.stringify(code).slice(0, 2000)}
`).join('\n')}

Please synthesize the best solution by:
1. Taking the best patterns from each example
2. Combining them into clean, production-ready code
3. Adding error handling and edge cases
4. Optimizing for performance

Provide the synthesized code:
`;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { CodeAggregator };
