/**
 * artemis.js
 * Compliance & Legal Validation Agent
 * Ensures all operations follow legal/ethical guidelines, manages contracts
 */

class Artemis {
    constructor(config = {}) {
        this.name = 'Artemis';
        this.version = '1.0.0';

        // Compliance rules
        this.rules = new Map();

        // Contract templates
        this.contracts = new Map();

        // Audit log
        this.auditLog = [];

        // Validation results
        this.validations = [];

        // Stats
        this.stats = {
            validationsRun: 0,
            passed: 0,
            failed: 0,
            contractsGenerated: 0,
            auditsCompleted: 0
        };

        this._initRules();
        this._initContracts();

        console.log('[Artemis] Compliance & legal agent initialized');
    }

    /**
     * Initialize compliance rules
     */
    _initRules() {
        // Bug bounty rules
        this.rules.set('bug_bounty', {
            name: 'Bug Bounty Compliance',
            checks: [
                { id: 'scope', name: 'Target in scope', required: true },
                { id: 'authorization', name: 'Authorization verified', required: true },
                { id: 'no_destruction', name: 'No destructive testing', required: true },
                { id: 'disclosure', name: 'Responsible disclosure timeline', required: true },
                { id: 'no_social', name: 'No social engineering', required: true },
                { id: 'no_dos', name: 'No denial of service', required: true }
            ]
        });

        // Freelance rules
        this.rules.set('freelance', {
            name: 'Freelance Compliance',
            checks: [
                { id: 'contract', name: 'Written agreement in place', required: true },
                { id: 'scope_defined', name: 'Scope clearly defined', required: true },
                { id: 'payment_terms', name: 'Payment terms agreed', required: true },
                { id: 'ip_ownership', name: 'IP ownership clarified', required: true },
                { id: 'nda', name: 'NDA if required', required: false },
                { id: 'liability', name: 'Liability limits defined', required: false }
            ]
        });

        // Content rules
        this.rules.set('content', {
            name: 'Content Compliance',
            checks: [
                { id: 'original', name: 'Content is original', required: true },
                { id: 'no_plagiarism', name: 'No plagiarism', required: true },
                { id: 'sources_cited', name: 'Sources properly cited', required: true },
                { id: 'no_defamation', name: 'No defamatory content', required: true },
                { id: 'copyright_clear', name: 'Copyright clearance', required: true },
                { id: 'brand_safe', name: 'Brand safety check', required: false }
            ]
        });

        // Data handling rules
        this.rules.set('data', {
            name: 'Data Handling Compliance',
            checks: [
                { id: 'gdpr', name: 'GDPR compliance', required: true },
                { id: 'encryption', name: 'Data encrypted at rest', required: true },
                { id: 'access_control', name: 'Access controls in place', required: true },
                { id: 'retention', name: 'Retention policy defined', required: true },
                { id: 'consent', name: 'User consent obtained', required: true },
                { id: 'breach_plan', name: 'Breach response plan', required: false }
            ]
        });

        // Outreach rules
        this.rules.set('outreach', {
            name: 'Outreach Compliance',
            checks: [
                { id: 'can_spam', name: 'CAN-SPAM compliance', required: true },
                { id: 'unsubscribe', name: 'Unsubscribe option present', required: true },
                { id: 'sender_id', name: 'Sender identification', required: true },
                { id: 'no_misleading', name: 'No misleading subject lines', required: true },
                { id: 'opt_in', name: 'Recipients opted in', required: false }
            ]
        });
    }

    /**
     * Initialize contract templates
     */
    _initContracts() {
        this.contracts.set('freelance_basic', {
            name: 'Basic Freelance Agreement',
            template: `FREELANCE SERVICES AGREEMENT

This Agreement is entered into as of {{date}} between:

CLIENT: {{clientName}} ("Client")
CONTRACTOR: {{contractorName}} ("Contractor")

1. SERVICES
Contractor agrees to provide the following services:
{{serviceDescription}}

2. COMPENSATION
Client agrees to pay Contractor:
- Total Amount: ${{totalAmount}}
- Payment Schedule: {{paymentSchedule}}
- Payment Method: {{paymentMethod}}

3. TIMELINE
- Start Date: {{startDate}}
- Estimated Completion: {{endDate}}
- Milestones: {{milestones}}

4. INTELLECTUAL PROPERTY
{{ipClause}}

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information shared during this engagement.

6. TERMINATION
Either party may terminate with {{noticePeriod}} written notice.

7. LIABILITY
{{liabilityClause}}

SIGNATURES:

Client: _______________ Date: ___________
Contractor: _______________ Date: ___________
`
        });

        this.contracts.set('nda_mutual', {
            name: 'Mutual NDA',
            template: `MUTUAL NON-DISCLOSURE AGREEMENT

Effective Date: {{date}}

BETWEEN:
Party A: {{partyA}}
Party B: {{partyB}}

1. PURPOSE
The parties wish to explore a potential business relationship and may share confidential information.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes all information disclosed by either party that is:
- Marked as confidential
- Reasonably understood to be confidential given its nature

3. OBLIGATIONS
Each party agrees to:
- Protect confidential information with reasonable care
- Use information only for the stated purpose
- Not disclose to third parties without consent

4. EXCLUSIONS
Information is not confidential if it:
- Was publicly known at time of disclosure
- Becomes publicly known through no fault of receiving party
- Was already known to receiving party
- Is independently developed

5. TERM
This agreement remains in effect for {{term}} from the effective date.

6. RETURN OF INFORMATION
Upon request, each party shall return or destroy confidential information.

SIGNATURES:

Party A: _______________ Date: ___________
Party B: _______________ Date: ___________
`
        });

        this.contracts.set('scope_change', {
            name: 'Scope Change Request',
            template: `SCOPE CHANGE REQUEST

Project: {{projectName}}
Date: {{date}}
Request #: {{requestNumber}}

ORIGINAL SCOPE:
{{originalScope}}

REQUESTED CHANGES:
{{requestedChanges}}

IMPACT ASSESSMENT:
- Timeline Impact: {{timelineImpact}}
- Cost Impact: ${{costImpact}}
- Resource Impact: {{resourceImpact}}

RECOMMENDATION:
{{recommendation}}

APPROVAL:

Client Approval: _______________ Date: ___________
Contractor Acknowledgment: _______________ Date: ___________
`
        });
    }

    /**
     * Execute task
     */
    async execute(task) {
        switch (task.type) {
            case 'validate':
                return this._runValidation(task);
            case 'generate_contract':
                return this._generateContract(task);
            case 'audit':
                return this._runAudit(task);
            case 'check_scope':
                return this._checkScope(task);
            case 'risk_assessment':
                return this._assessRisk(task);
            default:
                return { error: 'Unknown task type' };
        }
    }

    /**
     * Run compliance validation
     */
    _runValidation(task) {
        const { ruleSet, context, evidence } = task;

        const rules = this.rules.get(ruleSet);
        if (!rules) {
            return { error: `Rule set '${ruleSet}' not found` };
        }

        const results = {
            ruleSet,
            ruleName: rules.name,
            timestamp: Date.now(),
            checks: [],
            passed: true,
            score: 0
        };

        for (const check of rules.checks) {
            const checkResult = {
                id: check.id,
                name: check.name,
                required: check.required,
                passed: this._evaluateCheck(check, context, evidence),
                evidence: evidence?.[check.id] || null
            };

            results.checks.push(checkResult);

            if (check.required && !checkResult.passed) {
                results.passed = false;
            }
        }

        // Calculate score
        const passedChecks = results.checks.filter(c => c.passed).length;
        results.score = Math.round((passedChecks / results.checks.length) * 100);

        this.validations.push(results);
        this.stats.validationsRun++;
        results.passed ? this.stats.passed++ : this.stats.failed++;

        this._log('validation', results);

        console.log(`[Artemis] Validation: ${results.passed ? 'PASSED' : 'FAILED'} (${results.score}%)`);

        return results;
    }

    /**
     * Evaluate a single compliance check
     */
    _evaluateCheck(check, context, evidence) {
        // In production, this would have more sophisticated evaluation
        if (evidence && evidence[check.id] !== undefined) {
            return evidence[check.id] === true;
        }

        // Default evaluations based on context
        if (context) {
            switch (check.id) {
                case 'scope':
                    return context.targetInScope === true;
                case 'authorization':
                    return context.authorized === true;
                case 'contract':
                    return context.hasContract === true;
                case 'original':
                    return context.isOriginal !== false;
                default:
                    return true; // Assume passed if not explicitly failed
            }
        }

        return false;
    }

    /**
     * Generate contract from template
     */
    _generateContract(task) {
        const { templateName, variables } = task;

        const contract = this.contracts.get(templateName);
        if (!contract) {
            return { error: `Contract template '${templateName}' not found` };
        }

        let document = contract.template;

        // Replace all variables
        for (const [key, value] of Object.entries(variables || {})) {
            document = document.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }

        // Find missing variables
        const missingVars = document.match(/\{\{(\w+)\}\}/g) || [];

        this.stats.contractsGenerated++;
        this._log('contract_generated', { templateName, variables });

        return {
            templateName,
            templateDisplayName: contract.name,
            document,
            missingVariables: missingVars.map(v => v.replace(/\{\{|\}\}/g, '')),
            generatedAt: Date.now()
        };
    }

    /**
     * Run compliance audit
     */
    _runAudit(task) {
        const { scope, depth } = task;

        const audit = {
            id: `audit_${Date.now()}`,
            scope: scope || 'full',
            depth: depth || 'standard',
            startTime: Date.now(),
            findings: [],
            recommendations: []
        };

        // Check recent validations
        const recentValidations = this.validations.slice(-50);
        const failedValidations = recentValidations.filter(v => !v.passed);

        if (failedValidations.length > 0) {
            audit.findings.push({
                severity: 'high',
                category: 'compliance',
                description: `${failedValidations.length} recent validation failures`,
                details: failedValidations.map(v => v.ruleSet)
            });

            audit.recommendations.push({
                priority: 'high',
                action: 'Review and address validation failures',
                deadline: 'immediate'
            });
        }

        // Check for missing documentation
        audit.findings.push({
            severity: 'medium',
            category: 'documentation',
            description: 'Regular documentation review recommended'
        });

        // Calculate compliance score
        const passRate = recentValidations.length > 0
            ? (recentValidations.filter(v => v.passed).length / recentValidations.length) * 100
            : 100;

        audit.complianceScore = Math.round(passRate);
        audit.endTime = Date.now();
        audit.status = 'complete';

        this.stats.auditsCompleted++;
        this._log('audit', audit);

        console.log(`[Artemis] Audit complete: ${audit.complianceScore}% compliance`);

        return audit;
    }

    /**
     * Check if action is within scope
     */
    _checkScope(task) {
        const { action, target, program } = task;

        // Would check against actual program scope in production
        const scopeCheck = {
            action,
            target,
            program,
            timestamp: Date.now(),
            inScope: true,
            restrictions: [],
            warnings: []
        };

        // Common scope restrictions
        if (target && target.includes('prod')) {
            scopeCheck.warnings.push('Production environment - exercise caution');
        }

        if (action === 'destructive') {
            scopeCheck.inScope = false;
            scopeCheck.restrictions.push('Destructive actions not permitted');
        }

        this._log('scope_check', scopeCheck);

        return scopeCheck;
    }

    /**
     * Assess risk of an operation
     */
    _assessRisk(task) {
        const { operation, context } = task;

        const riskFactors = {
            scope: 0,
            impact: 0,
            reversibility: 0,
            precedent: 0,
            legal: 0
        };

        // Evaluate risk factors
        if (context?.production) riskFactors.scope += 30;
        if (context?.userFacing) riskFactors.impact += 20;
        if (context?.irreversible) riskFactors.reversibility += 40;
        if (!context?.tested) riskFactors.precedent += 15;
        if (context?.regulated) riskFactors.legal += 25;

        const totalRisk = Object.values(riskFactors).reduce((a, b) => a + b, 0);
        let riskLevel = 'low';
        if (totalRisk > 60) riskLevel = 'high';
        else if (totalRisk > 30) riskLevel = 'medium';

        const assessment = {
            operation,
            riskFactors,
            totalRiskScore: totalRisk,
            riskLevel,
            recommendation: this._getRiskRecommendation(riskLevel),
            mitigations: this._getSuggestedMitigations(riskFactors),
            assessedAt: Date.now()
        };

        this._log('risk_assessment', assessment);

        return assessment;
    }

    /**
     * Get risk recommendation
     */
    _getRiskRecommendation(level) {
        const recommendations = {
            low: 'Proceed with standard precautions',
            medium: 'Review carefully before proceeding, consider additional approval',
            high: 'Requires senior approval, implement mitigations before proceeding'
        };
        return recommendations[level];
    }

    /**
     * Get suggested mitigations
     */
    _getSuggestedMitigations(factors) {
        const mitigations = [];

        if (factors.scope > 20) {
            mitigations.push('Test in staging environment first');
        }
        if (factors.impact > 15) {
            mitigations.push('Implement feature flag for gradual rollout');
        }
        if (factors.reversibility > 30) {
            mitigations.push('Create backup/restore plan');
        }
        if (factors.precedent > 10) {
            mitigations.push('Document the change for future reference');
        }
        if (factors.legal > 20) {
            mitigations.push('Review with legal/compliance team');
        }

        return mitigations;
    }

    /**
     * Log audit event
     */
    _log(type, data) {
        this.auditLog.push({
            type,
            data,
            timestamp: Date.now()
        });

        // Keep audit log manageable
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-500);
        }
    }

    /**
     * Get available rule sets
     */
    getRuleSets() {
        return Array.from(this.rules.entries()).map(([key, val]) => ({
            id: key,
            name: val.name,
            checkCount: val.checks.length,
            requiredChecks: val.checks.filter(c => c.required).length
        }));
    }

    /**
     * Get contract templates
     */
    getContractTemplates() {
        return Array.from(this.contracts.entries()).map(([key, val]) => ({
            id: key,
            name: val.name
        }));
    }

    /**
     * Get audit log
     */
    getAuditLog(limit = 100) {
        return this.auditLog.slice(-limit);
    }

    /**
     * Get stats
     */
    getStats() {
        return this.stats;
    }
}

module.exports = Artemis;
