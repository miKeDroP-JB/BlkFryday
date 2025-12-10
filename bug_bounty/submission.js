/**
 * submission.js
 * Bug Bounty Submission Manager
 * Tracks submissions across platforms and manages the submission lifecycle
 */

class SubmissionManager {
    constructor(config = {}) {
        this.submissions = [];
        this.drafts = [];

        // Platform configurations
        this.platforms = {
            hackerone: {
                name: 'HackerOne',
                apiBase: 'https://api.hackerone.com',
                features: ['cvss_auto', 'cwe_auto', 'markdown']
            },
            bugcrowd: {
                name: 'Bugcrowd',
                apiBase: 'https://api.bugcrowd.com',
                features: ['vrt', 'markdown']
            },
            intigriti: {
                name: 'Intigriti',
                apiBase: 'https://api.intigriti.com',
                features: ['cvss_auto', 'markdown']
            }
        };

        // Stats
        this.stats = {
            totalSubmissions: 0,
            pending: 0,
            triaged: 0,
            accepted: 0,
            resolved: 0,
            rejected: 0,
            duplicate: 0,
            totalBounty: 0,
            avgBounty: 0
        };

        console.log('[SubmissionManager] Submission manager initialized');
    }

    /**
     * Create draft submission
     */
    createDraft(finding) {
        const draft = {
            id: `draft_${Date.now()}`,
            finding,
            title: this._generateTitle(finding),
            severity: finding.severity,
            vulnerability: {
                type: finding.type,
                cwes: this._mapCWEs(finding.type),
                cvss: this._generateCVSS(finding)
            },
            summary: this._generateSummary(finding),
            stepsToReproduce: finding.steps || this._generateSteps(finding),
            impact: this._generateImpact(finding),
            remediation: this._generateRemediation(finding.type),
            poc: finding.poc || null,
            attachments: finding.attachments || [],
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.drafts.push(draft);

        console.log(`[SubmissionManager] Draft created: ${draft.title}`);

        return draft;
    }

    /**
     * Submit to platform
     */
    async submit(draftId, platform, programId) {
        const draft = this.drafts.find(d => d.id === draftId);
        if (!draft) {
            return { error: 'Draft not found' };
        }

        const platformConfig = this.platforms[platform];
        if (!platformConfig) {
            return { error: `Unknown platform: ${platform}` };
        }

        const submission = {
            id: `sub_${Date.now()}`,
            draftId: draft.id,
            platform,
            platformName: platformConfig.name,
            programId,
            title: draft.title,
            severity: draft.severity,
            vulnerability: draft.vulnerability,
            content: this._formatForPlatform(draft, platform),
            status: 'submitted',
            submittedAt: Date.now(),
            timeline: [{
                status: 'submitted',
                timestamp: Date.now(),
                note: 'Initial submission'
            }]
        };

        this.submissions.push(submission);
        this.stats.totalSubmissions++;
        this.stats.pending++;

        // Remove from drafts
        this.drafts = this.drafts.filter(d => d.id !== draftId);

        console.log(`[SubmissionManager] Submitted to ${platformConfig.name}: ${submission.title}`);

        return {
            success: true,
            submissionId: submission.id,
            platform: platformConfig.name,
            status: 'submitted'
        };
    }

    /**
     * Update submission status
     */
    updateStatus(submissionId, newStatus, details = {}) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) {
            return { error: 'Submission not found' };
        }

        const oldStatus = submission.status;

        // Update stats
        if (this.stats[oldStatus] !== undefined) {
            this.stats[oldStatus]--;
        }
        if (this.stats[newStatus] !== undefined) {
            this.stats[newStatus]++;
        }

        submission.status = newStatus;
        submission.timeline.push({
            status: newStatus,
            timestamp: Date.now(),
            note: details.note || '',
            ...details
        });

        // Handle bounty
        if (details.bounty) {
            submission.bounty = details.bounty;
            this.stats.totalBounty += details.bounty;
            this.stats.avgBounty = this.stats.totalBounty / this.stats.accepted;
        }

        console.log(`[SubmissionManager] Status update: ${submission.title} -> ${newStatus}`);

        return {
            success: true,
            submissionId,
            oldStatus,
            newStatus,
            bounty: details.bounty || null
        };
    }

    /**
     * Generate title
     */
    _generateTitle(finding) {
        const templates = {
            xss: `Stored XSS in ${finding.location || 'application'}`,
            sqli: `SQL Injection in ${finding.endpoint || 'endpoint'}`,
            idor: `IDOR allows access to other users' ${finding.resource || 'data'}`,
            csrf: `CSRF on ${finding.action || 'sensitive action'}`,
            ssrf: `SSRF via ${finding.parameter || 'parameter'}`,
            rce: `Remote Code Execution via ${finding.vector || 'vector'}`,
            auth_bypass: `Authentication Bypass in ${finding.location || 'login'}`,
            info_disclosure: `Sensitive Information Disclosure at ${finding.path || 'endpoint'}`,
            open_redirect: `Open Redirect via ${finding.parameter || 'parameter'}`,
            xxe: `XML External Entity Injection in ${finding.endpoint || 'endpoint'}`
        };

        return templates[finding.type] || `${finding.category || 'Security'} vulnerability in ${finding.target}`;
    }

    /**
     * Generate summary
     */
    _generateSummary(finding) {
        const impactVerbs = {
            xss: 'execute arbitrary JavaScript in victim browsers',
            sqli: 'read, modify, or delete database contents',
            idor: 'access resources belonging to other users',
            csrf: 'perform actions on behalf of authenticated users',
            ssrf: 'make requests to internal resources',
            rce: 'execute arbitrary commands on the server',
            auth_bypass: 'bypass authentication mechanisms',
            info_disclosure: 'access sensitive information',
            open_redirect: 'redirect users to malicious sites',
            xxe: 'read local files and perform SSRF attacks'
        };

        const impact = impactVerbs[finding.type] || 'exploit the vulnerability';

        return `A ${finding.severity} severity ${finding.type} vulnerability was discovered in ${finding.target}. This vulnerability allows an attacker to ${impact}.`;
    }

    /**
     * Generate steps to reproduce
     */
    _generateSteps(finding) {
        return [
            `1. Navigate to ${finding.target || 'the affected endpoint'}`,
            `2. ${finding.action || 'Perform the vulnerable action'}`,
            `3. Observe that ${finding.observation || 'the vulnerability is triggered'}`,
            `4. Verify the impact by ${finding.verification || 'checking the results'}`
        ];
    }

    /**
     * Generate impact statement
     */
    _generateImpact(finding) {
        const impacts = {
            critical: {
                summary: 'Critical impact on confidentiality, integrity, and availability',
                confidentiality: 'High - Complete data breach possible',
                integrity: 'High - Full system compromise possible',
                availability: 'High - Service disruption possible'
            },
            high: {
                summary: 'High impact on security posture',
                confidentiality: 'High - Sensitive data exposure',
                integrity: 'Medium - Partial data manipulation',
                availability: 'Low - Limited impact'
            },
            medium: {
                summary: 'Moderate impact requiring attention',
                confidentiality: 'Medium - Limited data exposure',
                integrity: 'Low - Minimal manipulation possible',
                availability: 'None'
            },
            low: {
                summary: 'Low impact with minimal risk',
                confidentiality: 'Low - Minor information disclosure',
                integrity: 'None',
                availability: 'None'
            }
        };

        return impacts[finding.severity] || impacts.medium;
    }

    /**
     * Generate remediation advice
     */
    _generateRemediation(vulnType) {
        const remediations = {
            xss: 'Implement proper output encoding based on context (HTML, JavaScript, URL, CSS). Use Content Security Policy (CSP) headers. Consider using frameworks that automatically escape output.',
            sqli: 'Use parameterized queries or prepared statements exclusively. Never concatenate user input into SQL queries. Implement least-privilege database access.',
            idor: 'Implement proper authorization checks on every resource access. Verify the requesting user has permission to access the requested resource.',
            csrf: 'Implement anti-CSRF tokens on all state-changing requests. Use SameSite cookie attribute. Verify Origin/Referer headers.',
            ssrf: 'Validate and sanitize all user-supplied URLs. Implement allowlists for permitted destinations. Block requests to internal IP ranges.',
            rce: 'Avoid executing user-controlled input. If necessary, use strict allowlists and sandboxing. Implement proper input validation.',
            auth_bypass: 'Review authentication logic thoroughly. Implement proper session management. Use established authentication frameworks.',
            info_disclosure: 'Remove sensitive information from responses. Implement proper access controls. Review error handling to prevent information leakage.',
            open_redirect: 'Validate redirect URLs against an allowlist of permitted domains. Avoid using user input for redirects when possible.',
            xxe: 'Disable external entity processing in XML parsers. Use less complex data formats like JSON when possible.'
        };

        return remediations[vulnType] || 'Review and remediate the vulnerability following security best practices. Consult OWASP guidelines for specific remediation steps.';
    }

    /**
     * Map CWE IDs
     */
    _mapCWEs(vulnType) {
        const cwes = {
            xss: ['CWE-79'],
            sqli: ['CWE-89'],
            idor: ['CWE-639', 'CWE-284'],
            csrf: ['CWE-352'],
            ssrf: ['CWE-918'],
            rce: ['CWE-94', 'CWE-78'],
            auth_bypass: ['CWE-287', 'CWE-306'],
            info_disclosure: ['CWE-200', 'CWE-209'],
            open_redirect: ['CWE-601'],
            xxe: ['CWE-611']
        };

        return cwes[vulnType] || [];
    }

    /**
     * Generate CVSS score
     */
    _generateCVSS(finding) {
        const baseScores = {
            critical: { score: 9.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' },
            high: { score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' },
            medium: { score: 5.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N' },
            low: { score: 3.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N' }
        };

        return baseScores[finding.severity] || baseScores.medium;
    }

    /**
     * Format submission for platform
     */
    _formatForPlatform(draft, platform) {
        const platformConfig = this.platforms[platform];

        // Markdown formatting (supported by all)
        let content = `## Summary\n\n${draft.summary}\n\n`;
        content += `## Vulnerability Details\n\n`;
        content += `- **Type:** ${draft.vulnerability.type}\n`;
        content += `- **CWE:** ${draft.vulnerability.cwes.join(', ')}\n`;
        content += `- **CVSS:** ${draft.vulnerability.cvss.score} (${draft.vulnerability.cvss.vector})\n\n`;

        content += `## Steps to Reproduce\n\n`;
        content += draft.stepsToReproduce.join('\n') + '\n\n';

        content += `## Impact\n\n`;
        content += `${draft.impact.summary}\n\n`;
        content += `- **Confidentiality:** ${draft.impact.confidentiality}\n`;
        content += `- **Integrity:** ${draft.impact.integrity}\n`;
        content += `- **Availability:** ${draft.impact.availability}\n\n`;

        content += `## Remediation\n\n${draft.remediation}\n`;

        if (draft.poc) {
            content += `\n## Proof of Concept\n\n\`\`\`\n${draft.poc}\n\`\`\`\n`;
        }

        return content;
    }

    /**
     * Get submissions by status
     */
    getByStatus(status) {
        return this.submissions.filter(s => s.status === status);
    }

    /**
     * Get submission timeline
     */
    getTimeline(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return null;
        return submission.timeline;
    }

    /**
     * Get drafts
     */
    getDrafts() {
        return this.drafts;
    }

    /**
     * Get all submissions
     */
    getAllSubmissions() {
        return this.submissions;
    }

    /**
     * Get stats
     */
    getStats() {
        return this.stats;
    }

    /**
     * Export submission for backup
     */
    exportSubmission(submissionId) {
        const submission = this.submissions.find(s => s.id === submissionId);
        if (!submission) return null;

        return {
            ...submission,
            exportedAt: Date.now()
        };
    }
}

module.exports = SubmissionManager;
