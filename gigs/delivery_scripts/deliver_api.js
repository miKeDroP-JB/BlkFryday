/**
 * deliver_api.js
 * Delivery automation for API development gigs
 */

const fs = require('fs');
const path = require('path');

class APIDelivery {
    constructor(config = {}) {
        this.projectPath = config.projectPath || './delivery';
        this.clientName = config.clientName || 'Client';
        this.projectName = config.projectName || 'api-project';
    }

    /**
     * Prepare delivery package
     */
    async prepareDelivery(order) {
        const delivery = {
            id: `delivery_${Date.now()}`,
            orderId: order.id,
            package: order.package,
            items: [],
            timestamp: Date.now()
        };

        // Generate deliverables based on package
        delivery.items.push(this._prepareSourceCode(order));
        delivery.items.push(this._prepareDocumentation(order));
        delivery.items.push(this._preparePostmanCollection(order));

        if (order.package !== 'basic') {
            delivery.items.push(this._prepareTestSuite(order));
        }

        if (order.package === 'premium') {
            delivery.items.push(this._prepareDockerSetup(order));
            delivery.items.push(this._prepareCICD(order));
        }

        // Generate delivery message
        delivery.message = this._generateDeliveryMessage(order, delivery);

        return delivery;
    }

    /**
     * Prepare source code info
     */
    _prepareSourceCode(order) {
        return {
            type: 'source_code',
            name: 'Source Code',
            location: `github.com/client/${this.projectName}`,
            description: 'Complete API source code with all endpoints implemented',
            files: [
                'src/index.js',
                'src/routes/',
                'src/controllers/',
                'src/models/',
                'src/middleware/',
                'config/',
                'package.json'
            ]
        };
    }

    /**
     * Prepare documentation
     */
    _prepareDocumentation(order) {
        const docs = {
            type: 'documentation',
            name: 'Documentation',
            files: ['README.md', 'docs/API.md']
        };

        if (order.package !== 'basic') {
            docs.files.push('docs/swagger.yaml');
            docs.files.push('docs/SETUP.md');
        }

        return docs;
    }

    /**
     * Prepare Postman collection
     */
    _preparePostmanCollection(order) {
        return {
            type: 'postman',
            name: 'Postman Collection',
            file: `${this.projectName}.postman_collection.json`,
            description: 'Ready-to-import Postman collection with all endpoints'
        };
    }

    /**
     * Prepare test suite
     */
    _prepareTestSuite(order) {
        return {
            type: 'tests',
            name: 'Test Suite',
            location: 'tests/',
            coverage: order.package === 'premium' ? '90%+' : '70%+',
            command: 'npm test'
        };
    }

    /**
     * Prepare Docker setup
     */
    _prepareDockerSetup(order) {
        return {
            type: 'docker',
            name: 'Docker Configuration',
            files: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
            command: 'docker-compose up -d'
        };
    }

    /**
     * Prepare CI/CD
     */
    _prepareCICD(order) {
        return {
            type: 'cicd',
            name: 'CI/CD Pipeline',
            files: ['.github/workflows/ci.yml', '.github/workflows/deploy.yml'],
            description: 'GitHub Actions workflows for automated testing and deployment'
        };
    }

    /**
     * Generate delivery message
     */
    _generateDeliveryMessage(order, delivery) {
        const items = delivery.items.map(i => `- ${i.name}`).join('\n');

        return `Hi ${this.clientName},

Great news - your ${this.projectName} API is ready for delivery!

## What's Included:

${items}

## Getting Started:

1. Clone the repository from the provided GitHub link
2. Run \`npm install\` to install dependencies
3. Copy \`.env.example\` to \`.env\` and configure
4. Run \`npm start\` to launch the server

## Documentation:

Full API documentation is available in the \`docs/\` folder and via Swagger at \`/api-docs\` when running.

## Testing:

Run \`npm test\` to execute the test suite.

Please review everything and let me know if you have any questions or need any adjustments!

Best regards`;
    }

    /**
     * Generate handoff checklist
     */
    generateHandoffChecklist(order) {
        return {
            preDelivery: [
                { task: 'All endpoints implemented', checked: false },
                { task: 'Tests passing', checked: false },
                { task: 'Documentation complete', checked: false },
                { task: 'Environment variables documented', checked: false },
                { task: 'Code reviewed and cleaned', checked: false }
            ],
            delivery: [
                { task: 'Repository access granted', checked: false },
                { task: 'Postman collection exported', checked: false },
                { task: 'Delivery message sent', checked: false }
            ],
            postDelivery: [
                { task: 'Client confirmed receipt', checked: false },
                { task: 'Questions addressed', checked: false },
                { task: 'Payment received', checked: false }
            ]
        };
    }
}

module.exports = APIDelivery;
