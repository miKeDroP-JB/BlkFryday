/**
 * deliver_security.js
 * Delivery automation for security audit gigs
 */

class SecurityDelivery {
    constructor(config = {}) {
        this.clientName = config.clientName || 'Client';
        this.projectName = config.projectName || 'security-audit';
        this.companyName = config.companyName || 'Company';
    }

    /**
     * Prepare delivery package
     */
    async prepareDelivery(order, findings) {
        const delivery = {
            id: `delivery_${Date.now()}`,
            orderId: order.id,
            package: order.package,
            items: [],
            timestamp: Date.now()
        };

        // Always include executive summary
        delivery.items.push(this._prepareExecutiveSummary(order, findings));

        // Technical report for all packages
        delivery.items.push(this._prepareTechnicalReport(order, findings));

        if (order.package !== 'basic') {
            delivery.items.push(this._preparePOCs(findings));
            delivery.items.push(this._prepareRemediationGuide(findings));
        }

        if (order.package === 'premium') {
            delivery.items.push(this._prepareDetailedAnalysis(findings));
            delivery.items.push(this._prepareRetestPlan());
        }

        // Generate delivery message
        delivery.message = this._generateDeliveryMessage(order, delivery, findings);

        return delivery;
    }

    /**
     * Prepare executive summary
     */
    _prepareExecutiveSummary(order, findings) {
        const criticalCount = findings.filter(f => f.severity === 'critical').length;
        const highCount = findings.filter(f => f.severity === 'high').length;
        const mediumCount = findings.filter(f => f.severity === 'medium').length;
        const lowCount = findings.filter(f => f.severity === 'low').length;

        return {
            type: 'executive_summary',
            name: 'Executive Summary',
            file: 'Executive_Summary.pdf',
            content: {
                scope: order.scope,
                duration: `${order.durationDays} days`,
                methodology: 'OWASP Testing Guide + Manual Testing',
                findingsSummary: {
                    critical: criticalCount,
                    high: highCount,
                    medium: mediumCount,
                    low: lowCount,
                    total: findings.length
                },
                overallRisk: this._calculateOverallRisk(findings),
                topRecommendations: this._getTopRecommendations(findings)
            }
        };
    }

    /**
     * Prepare technical report
     */
    _prepareTechnicalReport(order, findings) {
        return {
            type: 'technical_report',
            name: 'Technical Findings Report',
            file: 'Technical_Report.pdf',
            sections: [
                'Methodology',
                'Scope & Limitations',
                'Finding Details',
                'Risk Ratings',
                'Remediation Steps',
                'References'
            ],
            findings: findings.map(f => ({
                id: f.id,
                title: f.title,
                severity: f.severity,
                cvss: f.cvss,
                cwe: f.cwe,
                description: f.description,
                impact: f.impact,
                remediation: f.remediation
            }))
        };
    }

    /**
     * Prepare proof of concepts
     */
    _preparePOCs(findings) {
        const exploitableFindings = findings.filter(f =>
            f.severity === 'critical' || f.severity === 'high'
        );

        return {
            type: 'poc',
            name: 'Proof of Concepts',
            folder: 'POCs/',
            items: exploitableFindings.map(f => ({
                findingId: f.id,
                title: `POC - ${f.title}`,
                file: `poc_${f.id}.md`,
                includes: ['Steps to reproduce', 'Screenshots', 'Request/Response examples']
            }))
        };
    }

    /**
     * Prepare remediation guide
     */
    _prepareRemediationGuide(findings) {
        return {
            type: 'remediation',
            name: 'Remediation Guide',
            file: 'Remediation_Guide.pdf',
            sections: [
                {
                    title: 'Priority 1 - Immediate Action',
                    findings: findings.filter(f => f.severity === 'critical')
                },
                {
                    title: 'Priority 2 - Short Term',
                    findings: findings.filter(f => f.severity === 'high')
                },
                {
                    title: 'Priority 3 - Medium Term',
                    findings: findings.filter(f => f.severity === 'medium')
                },
                {
                    title: 'Priority 4 - Long Term',
                    findings: findings.filter(f => f.severity === 'low')
                }
            ]
        };
    }

    /**
     * Prepare detailed analysis
     */
    _prepareDetailedAnalysis(findings) {
        return {
            type: 'detailed_analysis',
            name: 'Detailed Technical Analysis',
            file: 'Detailed_Analysis.pdf',
            includes: [
                'Attack surface mapping',
                'Data flow analysis',
                'Authentication/authorization review',
                'Business logic assessment',
                'Infrastructure considerations'
            ]
        };
    }

    /**
     * Prepare retest plan
     */
    _prepareRetestPlan() {
        return {
            type: 'retest_plan',
            name: 'Retest Plan',
            file: 'Retest_Plan.pdf',
            validity: '30 days',
            process: [
                'Notify when fixes implemented',
                'Schedule retest window',
                'Verify fixes for each finding',
                'Update report with retest results'
            ]
        };
    }

    /**
     * Calculate overall risk
     */
    _calculateOverallRisk(findings) {
        const weights = { critical: 10, high: 5, medium: 2, low: 1 };
        const score = findings.reduce((acc, f) => acc + (weights[f.severity] || 0), 0);

        if (score >= 30) return 'Critical';
        if (score >= 15) return 'High';
        if (score >= 5) return 'Medium';
        return 'Low';
    }

    /**
     * Get top recommendations
     */
    _getTopRecommendations(findings) {
        const criticalFindings = findings.filter(f =>
            f.severity === 'critical' || f.severity === 'high'
        ).slice(0, 5);

        return criticalFindings.map(f => f.remediation);
    }

    /**
     * Generate delivery message
     */
    _generateDeliveryMessage(order, delivery, findings) {
        const summary = delivery.items.find(i => i.type === 'executive_summary');
        const stats = summary.content.findingsSummary;

        return `Hi ${this.clientName},

I have completed the security assessment of ${this.projectName} and am pleased to deliver the final report.

## Assessment Summary

- **Scope:** ${order.scope}
- **Duration:** ${order.durationDays} days
- **Methodology:** OWASP Testing Guide + Manual Testing

## Findings Overview

| Severity | Count |
|----------|-------|
| Critical | ${stats.critical} |
| High     | ${stats.high} |
| Medium   | ${stats.medium} |
| Low      | ${stats.low} |
| **Total** | **${stats.total}** |

**Overall Risk Level:** ${summary.content.overallRisk}

## Deliverables Included

${delivery.items.map(i => `- ${i.name}`).join('\n')}

## Key Recommendations

${summary.content.topRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Next Steps

1. Review the executive summary for a high-level overview
2. Share the technical report with your development team
3. Prioritize remediation based on the provided guide
${order.package === 'premium' ? '4. Contact me to schedule the retest once fixes are in place' : ''}

Please let me know if you have any questions about the findings or need clarification on any recommendations.

Best regards`;
    }

    /**
     * Generate handoff checklist
     */
    generateHandoffChecklist(order) {
        return {
            preDelivery: [
                { task: 'All tests completed', checked: false },
                { task: 'Findings documented', checked: false },
                { task: 'CVSS scores calculated', checked: false },
                { task: 'POCs created and verified', checked: false },
                { task: 'Reports generated', checked: false },
                { task: 'Quality review complete', checked: false }
            ],
            delivery: [
                { task: 'Reports uploaded securely', checked: false },
                { task: 'Delivery message sent', checked: false },
                { task: 'Secure channel confirmed', checked: false }
            ],
            postDelivery: [
                { task: 'Client confirmed receipt', checked: false },
                { task: 'Questions addressed', checked: false },
                { task: 'Retest scheduled (if premium)', checked: false },
                { task: 'Payment received', checked: false }
            ]
        };
    }
}

module.exports = SecurityDelivery;
