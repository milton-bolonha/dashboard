/**
 * 📋 Advanced Rules Setup - Estrutura organizacional avançada de rules
 * Baseado em patterns avançados de organização de rules do Cursor
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class AdvancedRulesSetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
    this.rulesDir = path.join(this.cursorDir, "rules");
  }

  /**
   * 📋 Setup completo de estrutura avançada de rules
   */
  async setup() {
    console.log("Setting up advanced rules structure...");

    try {
      // 1. Criar estrutura organizacional
      await this.setupRulesStructure();

      // 2. Configurar tipos de rules e naming conventions
      await this.setupRuleTypes();

      // 3. Criar templates para rules
      await this.setupRuleTemplates();

      // 4. Configurar workflows básicos
      await this.setupBasicWorkflows();

      // 5. Criar rule para geração de rules
      await this.setupRuleGenerator();

      console.log(chalk.green("   ✓ Estrutura avançada de rules configurada"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Advanced rules setup não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 🏗️ Configura estrutura organizacional de rules
   */
  async setupRulesStructure() {
    // Criar estrutura de pastas organizacional
    const rulesFolders = [
      "core-rules", // Rules do comportamento do Cursor
      "global-rules", // Rules sempre aplicadas
      "stack-rules", // Rules específicas do stack (React, Next.js, etc.)
      "tool-rules", // Rules para ferramentas (git, testing, etc.)
      "workflow-rules", // Workflows e processos
      "project-rules", // Rules específicas do projeto
    ];

    for (const folder of rulesFolders) {
      await fs.ensureDir(path.join(this.rulesDir, folder));
    }

    // Criar guia da estrutura
    const structureGuide = `# 📋 Advanced Rules Structure

## 🏗️ **ORGANIZAÇÃO DE RULES**

Nossa estrutura organiza rules em categorias lógicas para melhor manutenção e aplicação:

### 📁 **Pasta Structure**

\`\`\`
.cursor/rules/
├── core-rules/          # Comportamento do Cursor agent
├── global-rules/        # Rules sempre aplicadas
├── stack-rules/         # Rules específicas do stack
├── tool-rules/          # Rules para ferramentas
├── workflow-rules/      # Workflows e processos
└── project-rules/       # Rules específicas do projeto
\`\`\`

### 🎯 **Tipos de Rules (Naming Convention)**

#### **Auto Rules** (rule-name-auto.mdc)
- **Quando usar**: Rules que se aplicam automaticamente a certos tipos de arquivo
- **Front matter**: \`description: ""\`, \`globs: ["*.ts", "*.tsx"]\`, \`alwaysApply: false\`
- **Exemplo**: \`typescript-standards-auto.mdc\`

#### **Agent Rules** (rule-name-agent.mdc)  
- **Quando usar**: Rules específicas que o agent decide quando aplicar
- **Front matter**: \`description: "Detailed when to apply"\`, \`globs: ""\`, \`alwaysApply: false\`
- **Exemplo**: \`debugging-strategies-agent.mdc\`

#### **Always Rules** (rule-name-always.mdc)
- **Quando usar**: Rules globais aplicadas a todo chat/comando
- **Front matter**: \`description: ""\`, \`globs: ""\`, \`alwaysApply: true\`
- **Exemplo**: \`code-quality-always.mdc\`

#### **Manual Rules** (rule-name-manual.mdc)
- **Quando usar**: Rules ativadas manualmente pelo usuário
- **Front matter**: \`description: ""\`, \`globs: ""\`, \`alwaysApply: false\`
- **Exemplo**: \`complex-refactor-manual.mdc\`

### 📝 **Template Padrão**

\`\`\`mdc
---
description: "Detailed description of when and why to apply this rule"
globs: ["*.ts", "*.tsx"] OR ""
alwaysApply: true OR false
---

# Rule Title

## Critical Rules

- Actionable rule 1
- Actionable rule 2
- Actionable rule 3

## Examples

<example>
Valid usage example
</example>

<example type="invalid">
Invalid usage example
</example>
\`\`\`

## 🎯 **Usage Guidelines**

### Para Criar Nova Rule
1. **Determine tipo**: Auto, Agent, Always, ou Manual
2. **Escolha pasta**: Baseado na categoria da rule
3. **Use naming convention**: \`rule-name-{type}.mdc\`
4. **Preencha template**: Description apropriada para o tipo
5. **Include examples**: Valid e invalid usage

### Para Organizar Rules Existentes
1. **Review function**: Que problema a rule resolve?
2. **Categorize**: Em qual pasta faz mais sentido?
3. **Rename if needed**: Para seguir naming convention
4. **Update description**: Especialmente para agent rules

### Para Manter Rules
1. **Regular review**: Quarterly review de todas as rules
2. **Update examples**: Baseado em patterns reais do projeto
3. **Consolidate**: Merge rules similares
4. **Deprecate**: Remove rules obsoletas

## 💡 **Best Practices**

### Description Writing
- **Auto rules**: Deixe description vazia
- **Agent rules**: Description detalhada sobre quando aplicar
- **Always rules**: Description vazia
- **Manual rules**: Description vazia

### Glob Patterns
- **Be specific**: \`src/components/**/*.tsx\` vs \`**/*.tsx\`
- **Multiple patterns**: \`["*.ts", "*.tsx", "*.js", "*.jsx"]\`
- **Exclude patterns**: Use .cursorignore para exclusions

### Rule Content
- **Actionable**: Focus em o que fazer, não teorias
- **Concise**: Agent context window é limitado
- **Examples**: Sempre include valid e invalid examples
- **Emojis allowed**: Para melhor AI comprehension

## 🔧 **Advanced Features**

### Rule Dependencies
- Reference outras rules quando necessário
- Use \`@rule-name\` para referenciar
- Avoid circular dependencies

### Rule Testing
- Test rules com different scenarios
- Monitor rule effectiveness
- Update based on usage patterns

### Rule Analytics
- Track qual rules são mais usadas
- Identify rules que nunca são aplicadas
- Optimize based on usage data
`;

    await fs.writeFile(
      path.join(this.cursorDir, "rules-structure-guide.md"),
      structureGuide
    );
    console.log(chalk.green("     ✓ Rules structure configurada"));
  }

  /**
   * 🎯 Configura tipos de rules e naming conventions
   */
  async setupRuleTypes() {
    // Rule para code quality (always)
    const codeQualityRule = `---
description: ""
globs: ""
alwaysApply: true
---

# Code Quality Standards

## Critical Rules

- Write self-documenting code with clear variable and function names
- Follow consistent indentation and formatting
- Include error handling for all external operations
- Add comments only for complex business logic, not obvious code
- Keep functions focused and small (single responsibility)
- Use meaningful commit messages following conventional commits
- Write tests for critical business logic
- Avoid deep nesting (max 3 levels)

## Examples

<example>
// Good: Clear function name and error handling
async function getUserProfile(userId: string): Promise<UserProfile> {
  try {
    const user = await userService.findById(userId);
    return user.profile;
  } catch (error) {
    throw new Error(\`Failed to get user profile: \${error.message}\`);
  }
}
</example>

<example type="invalid">
// Bad: Unclear naming and no error handling
async function get(id) {
  const u = await service.find(id);
  return u.p;
}
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "global-rules", "code-quality-always.mdc"),
      codeQualityRule
    );

    // Rule para stack específico (auto)
    const stackRule = this.generateStackSpecificRule();
    await fs.writeFile(
      path.join(
        this.rulesDir,
        "stack-rules",
        `${this.detection.type}-standards-auto.mdc`
      ),
      stackRule
    );

    // Rule para debugging (agent)
    const debuggingRule = `---
description: "Apply this rule when user is debugging issues, investigating errors, or troubleshooting code problems. Use when they mention bugs, errors, unexpected behavior, or ask for help finding problems in their code."
globs: ""
alwaysApply: false
---

# Debugging Strategies

## Critical Rules

- Start with understanding the expected vs actual behavior
- Check for common issues first (typos, imports, syntax)
- Use console.log strategically to trace data flow
- Verify assumptions about data types and values
- Check network requests and responses in browser dev tools
- Look for error messages in browser console and terminal
- Use debugger breakpoints for complex logic flow
- Test with minimal reproducible examples
- Check for version conflicts in dependencies

## Examples

<example>
User: "My React component isn't updating when state changes"

AI: Let's debug this step by step:
1. First, let's verify the state is actually changing with console.log
2. Check if the component is using the state correctly
3. Verify you're updating state immutably
4. Let me see your component code to identify the issue

console.log('State before update:', currentState);
console.log('State after update:', newState);
</example>

<example type="invalid">
User: "My code has a bug"

AI: You should fix the bug in your code.
[No systematic debugging approach or specific guidance]
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "tool-rules", "debugging-strategies-agent.mdc"),
      debuggingRule
    );

    console.log(chalk.green("     ✓ Rule types configurados"));
  }

  /**
   * 📝 Configura templates para rules
   */
  async setupRuleTemplates() {
    const templatesDir = path.join(this.cursorDir, "templates");
    await fs.ensureDir(templatesDir);

    const ruleTemplate = `---
description: "ONLY fill this for agent rules - describe when this rule should be applied"
globs: ["*.ts", "*.tsx"] OR "" 
alwaysApply: true OR false
---

# Rule Title

## Critical Rules

- Actionable rule that agent MUST follow
- Another specific directive
- Clear, measurable requirement

## Examples

<example>
Valid example of following this rule properly
</example>

<example type="invalid">
Invalid example showing what NOT to do
</example>
`;

    await fs.writeFile(
      path.join(templatesDir, "rule-template.mdc"),
      ruleTemplate
    );

    // Template para workflows
    const workflowTemplate = `---
description: "Describe when this workflow should be triggered and what it accomplishes"
globs: ""
alwaysApply: false
---

# Workflow Name

## Context

- When to use this workflow
- What problem it solves
- Prerequisites needed

## Critical Rules

- Step-by-step process
- Required actions at each stage
- Validation criteria
- Success indicators

## Examples

<example>
User triggers workflow scenario and expected AI response
</example>

<example type="invalid">
Scenario where workflow should NOT be used
</example>
`;

    await fs.writeFile(
      path.join(templatesDir, "workflow-template.mdc"),
      workflowTemplate
    );

    console.log(chalk.green("     ✓ Rule templates criados"));
  }

  /**
   * ⚙️ Configura workflows básicos
   */
  async setupBasicWorkflows() {
    // Git workflow
    const gitWorkflow = `---
description: "Apply when user wants to commit, push, or perform git operations. Use when they mention saving work, version control, or git commands."
globs: ""
alwaysApply: false
---

# Git Workflow

## Context

- Use when user wants to commit and push changes
- Apply for git-related operations and version control
- Ensure proper commit message formatting

## Critical Rules

- Always run \`git add .\` from workspace root to stage changes
- Review staged changes before committing
- Format commit messages as \`type: brief description\`
  - feat: new feature
  - fix: bug fix  
  - docs: documentation changes
  - refactor: code restructuring
  - test: adding tests
  - chore: maintenance tasks
- Keep commit title under 72 characters
- Include detailed body explaining what and why
- Push changes to current remote branch

## Examples

<example>
User: "Save my changes to git"

AI: I'll help you commit and push your changes. Let me stage the files and create a proper commit message.

\`git add .\`
\`git commit -m "feat: add user authentication system

Implemented JWT-based authentication with secure password hashing
and token refresh functionality. Added login/logout endpoints and
middleware for protected routes."\`

\`git push\`
</example>

<example type="invalid">
User: "Save changes"

AI: \`git commit -m "updated stuff"\`
[Bad commit message without proper format or explanation]
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "workflow-rules", "git-workflow-agent.mdc"),
      gitWorkflow
    );

    // Testing workflow
    const testingWorkflow = `---
description: "Apply when user asks about testing, wants to write tests, or mentions test coverage. Use for test-driven development and quality assurance scenarios."
globs: ""
alwaysApply: false
---

# Testing Workflow

## Context

- Use when implementing test-driven development
- Apply for writing unit, integration, or e2e tests
- Ensure proper test coverage and quality

## Critical Rules

- Write tests before implementing features (TDD when requested)
- Follow naming convention: \`describe('FeatureName', () => {})\`
- Test both happy path and error scenarios
- Mock external dependencies properly
- Ensure tests are isolated and independent
- Run tests before marking features complete
- Maintain test coverage above 80% for critical paths
- Use appropriate testing tools for the stack

## Examples

<example>
User: "I need tests for my user service"

AI: I'll create comprehensive tests for your user service. Let me write both unit tests and integration tests:

\`\`\`typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Test implementation
    });
    
    it('should throw error with invalid email', async () => {
      // Error scenario test
    });
  });
});
\`\`\`
</example>

<example type="invalid">
User: "Add some tests"

AI: \`it('test', () => { expect(true).toBe(true); })\`
[Meaningless test that doesn't validate actual functionality]
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "workflow-rules", "testing-workflow-agent.mdc"),
      testingWorkflow
    );

    console.log(chalk.green("     ✓ Basic workflows configurados"));
  }

  /**
   * 🤖 Configura rule generator
   */
  async setupRuleGenerator() {
    const ruleGeneratorRule = `---
description: "Apply when user requests creation of new rules, asks to remember certain behaviors, wants to modify existing rules, or requests future behavior changes. This rule ensures proper rule creation and organization."
globs: ""
alwaysApply: false
---

# Rule Generation System

## Context

- Use when user wants to create new rules for future behavior
- Apply when modifying existing rules or rule structure
- Ensure proper organization and naming conventions

## Critical Rules

- Always check existing rules in all .cursor/rules subfolders before creating new ones
- Use proper naming convention: \`rule-name-{auto|agent|manual|always}.mdc\`
- Place rules in appropriate organizational folders
- Fill front matter fields correctly based on rule type:
  - Auto Rule: description blank, specific globs, alwaysApply false
  - Agent Rule: detailed description, globs blank, alwaysApply false  
  - Always Rule: description blank, globs blank, alwaysApply true
  - Manual Rule: description blank, globs blank, alwaysApply false
- Include both valid and invalid examples
- Focus on actionable directives, not explanations
- After creating rule, confirm with user: path, type, and description

## Examples

<example>
User: "Create a rule to always use TypeScript strict mode"

AI: I'll create an auto rule for TypeScript strict mode. This will apply to all TypeScript files.

[Creates .cursor/rules/stack-rules/typescript-strict-auto.mdc with proper front matter and content]

Rule created successfully:
- Path: .cursor/rules/stack-rules/typescript-strict-auto.mdc
- Type: Auto Rule
- Description: [blank - auto applies to *.ts, *.tsx files]
</example>

<example type="invalid">
User: "Remember to use async/await"

AI: I'll remember that for you.
[No actual rule created, just verbal acknowledgment]
</example>
`;

    await fs.writeFile(
      path.join(this.rulesDir, "core-rules", "rule-generator-agent.mdc"),
      ruleGeneratorRule
    );

    console.log(chalk.green("     ✓ Rule generator configurado"));
  }

  /**
   * 🎯 Gera rule específica do stack
   */
  generateStackSpecificRule() {
    const stackRules = {
      nextjs: `---
description: ""
globs: ["app/**/*", "pages/**/*", "*.config.js", "*.config.ts"]
alwaysApply: false
---

# Next.js Development Standards

## Critical Rules

- Use App Router over Pages Router for new projects
- Prefer Server Components by default, Client Components only for interactivity
- Implement proper loading.tsx and error.tsx for better UX
- Use next/image for all images and next/font for fonts
- Create API routes in app/api/ following RESTful conventions
- Implement proper metadata for SEO in layout.tsx files
- Use TypeScript for type safety in all components
- Follow Next.js naming conventions for special files

## Examples

<example>
// Good: Server Component with proper metadata
export const metadata = {
  title: 'Dashboard',
  description: 'User dashboard overview'
};

export default async function DashboardPage() {
  const data = await fetch('/api/dashboard');
  return <DashboardContent data={data} />;
}
</example>

<example type="invalid">
// Bad: Using useEffect for data fetching in Server Component
'use client';
export default function DashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/dashboard').then(res => setData(res));
  }, []);
}
</example>
`,

      react: `---
description: ""
globs: ["src/**/*.tsx", "src/**/*.jsx", "**/*.test.tsx", "**/*.test.jsx"]
alwaysApply: false
---

# React Development Standards

## Critical Rules

- Use functional components with hooks over class components
- Implement proper TypeScript interfaces for all props
- Use useCallback and useMemo appropriately for performance
- Handle loading and error states in components
- Follow React hooks rules (don't call in loops/conditions)
- Use React.memo for expensive components
- Implement proper error boundaries for production apps
- Follow consistent naming conventions for components and hooks

## Examples

<example>
// Good: Functional component with TypeScript and proper hooks
interface UserProfileProps {
  userId: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUser = useCallback(async () => {
    try {
      const userData = await userService.getUser(userId);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) return <LoadingSpinner />;
  return <div>{user?.name}</div>;
};
</example>

<example type="invalid">
// Bad: No TypeScript, no error handling, class component
class UserProfile extends Component {
  componentDidMount() {
    fetch('/api/user').then(res => this.setState({user: res}));
  }
  render() {
    return <div>{this.state.user}</div>;
  }
}
</example>
`,

      "node-api": `---
description: ""
globs: ["src/**/*.ts", "src/**/*.js", "routes/**/*", "controllers/**/*"]
alwaysApply: false
---

# Node.js API Development Standards

## Critical Rules

- Use TypeScript for type safety in API development
- Implement proper error handling middleware
- Use async/await over callbacks and raw promises
- Validate all input data with appropriate schemas
- Follow RESTful conventions for endpoint naming
- Implement proper logging with structured format
- Use environment variables for configuration
- Add proper authentication and authorization middleware

## Examples

<example>
// Good: Properly structured API endpoint with error handling
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = userSchema.parse(req.body);
    const user = await userService.createUser(validatedData);
    
    logger.info('User created successfully', { userId: user.id });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
};
</example>

<example type="invalid">
// Bad: No error handling, no validation, no types
const createUser = (req, res) => {
  const user = userService.createUser(req.body);
  res.json(user);
};
</example>
`,
    };

    return stackRules[this.detection.type] || stackRules["node-api"];
  }
}

export default AdvancedRulesSetup;
