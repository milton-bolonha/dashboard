/**
 * 🔑 Custom API Keys Setup - Configuração de provedores de LLM
 * Baseado na documentação oficial: docs.cursor.com/settings/custom-api-keys
 */

import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export class CustomAPISetup {
  constructor(detection) {
    this.detection = detection;
    this.projectRoot = process.cwd();
    this.cursorDir = path.join(this.projectRoot, ".cursor");
  }

  /**
   * 🔑 Setup completo de Custom API Keys
   */
  async setup() {
    console.log(chalk.blue("🔑 Configurando Custom API Keys..."));

    try {
      // 1. Guia de configuração de API Keys
      await this.setupAPIKeysGuide();

      // 2. Configuração por provider
      await this.setupProviderConfigurations();

      // 3. Estratégias de modelo por task
      await this.setupModelStrategies();

      // 4. Security e cost management
      await this.setupSecurityAndCosts();

      // 5. Troubleshooting guide
      await this.setupTroubleshooting();

      console.log(chalk.green("   ✓ Custom API Keys configurados"));
    } catch (error) {
      console.log(
        chalk.yellow(
          "   ⚠ Custom API Keys setup não foi configurado completamente"
        )
      );
      console.log(chalk.gray(`     ${error.message}`));
    }
  }

  /**
   * 📋 Configura guia principal de API Keys
   */
  async setupAPIKeysGuide() {
    const apiKeysGuide = `# 🔑 Custom API Keys Configuration Guide

## 🎯 **POR QUE USAR CUSTOM API KEYS?**

### ✅ **Vantagens**
- **Unlimited requests**: Sem rate limits do Cursor
- **Latest models**: Acesso a modelos mais recentes (GPT-4, Claude 3.5, Gemini Pro)
- **Cost control**: Pague apenas pelo que usar
- **Enterprise features**: Modelos empresariais e specialized
- **Performance**: Directly connected aos providers

### ⚠️ **Limitações**
- **Tab Completion**: Requer modelos especializados (não funciona com custom keys)
- **Reasoning models**: o1, o1-mini, o3-mini não suportados
- **Routing**: Requests passam pelo backend do Cursor
- **API format**: Apenas providers compatíveis com OpenAI API

## 🚀 **SETUP INSTRUCTIONS**

### Step 1: Acessar Settings
1. Abra **Cursor Settings**
2. Vá para **Models**
3. Encontre seção **Custom API Keys**

### Step 2: Configurar Providers
1. **Insira API Key** do provider desejado
2. **Click "Verify"** para validar
3. **Enable** após validação bem-sucedida

### Step 3: Verificar Funcionamento
- Teste com diferentes modelos
- Monitor usage e costs
- Confirme que features funcionam

## 🏢 **PROVIDERS SUPORTADOS**

### 🤖 **OpenAI**
- **Models**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **API Key**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Cost**: ~$0.03/1K tokens (GPT-4)
- **Best for**: General development, code generation

### 🧠 **Anthropic (Claude)**
- **Models**: Claude 3.5 Sonnet, Claude 3 Haiku, Claude 3 Opus
- **API Key**: [Anthropic Console](https://console.anthropic.com/)
- **Cost**: ~$0.015/1K tokens (Claude 3.5 Sonnet)
- **Best for**: Code analysis, complex reasoning, large contexts

### 🌐 **Google (Gemini)**
- **Models**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 1.5 Flash-500k
- **API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Cost**: ~$0.0075/1K tokens (Gemini 1.5 Flash)
- **Best for**: Large context windows, multimodal tasks

### ☁️ **Azure OpenAI**
- **Models**: GPT-4, GPT-3.5 Turbo (via Azure)
- **Setup**: Azure portal + deployment
- **Cost**: Similar ao OpenAI, com enterprise features
- **Best for**: Enterprise environments, compliance

### 🏗️ **AWS Bedrock**
- **Models**: Claude 3, Llama 2, Titan
- **Setup**: AWS access keys ou IAM roles
- **Cost**: Pay-per-use do AWS
- **Best for**: AWS-native environments, enterprise

## 🎯 **MODEL SELECTION STRATEGY**

### 📝 **Por Task Type**

#### Code Generation & Completion
- **Primary**: Claude 3.5 Sonnet (melhor for code)
- **Secondary**: GPT-4 Turbo
- **Budget**: Claude 3 Haiku, Gemini 1.5 Flash

#### Large Codebase Analysis
- **Primary**: Gemini 1.5 Flash-500k (2M context)
- **Secondary**: Claude 3.5 Sonnet (200k context)
- **Budget**: Gemini 1.5 Flash

#### Complex Reasoning
- **Primary**: Claude 3 Opus (highest reasoning)
- **Secondary**: GPT-4
- **Budget**: Claude 3.5 Sonnet

#### Quick Tasks & Iteration
- **Primary**: Claude 3 Haiku (fastest)
- **Secondary**: Gemini 1.5 Flash
- **Budget**: GPT-3.5 Turbo

### 💰 **Por Budget**

#### High Performance (No Budget Limits)
\`\`\`
Primary: Claude 3 Opus
Secondary: GPT-4
Quick tasks: Claude 3.5 Sonnet
Large context: Gemini 1.5 Pro
\`\`\`

#### Balanced Performance/Cost
\`\`\`
Primary: Claude 3.5 Sonnet
Secondary: Gemini 1.5 Flash
Quick tasks: Claude 3 Haiku
Large context: Gemini 1.5 Flash-500k
\`\`\`

#### Budget Conscious
\`\`\`
Primary: Gemini 1.5 Flash
Secondary: Claude 3 Haiku
Large context: Gemini 1.5 Flash-500k
Enterprise: Azure GPT-3.5 Turbo
\`\`\`

## 🔧 **CONFIGURATION TEMPLATES**

### Development Team Setup
\`\`\`json
{
  "primary_model": "claude-3-5-sonnet-20241022",
  "secondary_model": "gpt-4-turbo",
  "quick_model": "claude-3-haiku-20240307",
  "large_context_model": "gemini-1.5-flash-500k",
  "providers": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "google": "AI..."
  }
}
\`\`\`

### Enterprise Setup
\`\`\`json
{
  "primary_model": "azure-gpt-4",
  "secondary_model": "aws-bedrock-claude-3",
  "compliance_model": "azure-gpt-3.5-turbo",
  "providers": {
    "azure": {
      "api_key": "...",
      "endpoint": "https://your-resource.openai.azure.com/"
    },
    "aws": {
      "access_key": "...",
      "secret_key": "...",
      "region": "us-east-1"
    }
  }
}
\`\`\`

### Freelancer/Solo Setup
\`\`\`json
{
  "primary_model": "gemini-1.5-flash",
  "reasoning_model": "claude-3-5-sonnet-20241022",
  "large_context_model": "gemini-1.5-flash-500k",
  "providers": {
    "google": "AI...",
    "anthropic": "sk-ant-..."
  }
}
\`\`\`

## 📊 **COST COMPARISON (per 1M tokens)**

| Provider | Model | Input | Output | Context | Best For |
|----------|-------|--------|--------|---------|----------|
| Anthropic | Claude 3.5 Sonnet | $3 | $15 | 200k | Code quality |
| Anthropic | Claude 3 Haiku | $0.25 | $1.25 | 200k | Quick tasks |
| OpenAI | GPT-4 Turbo | $10 | $30 | 128k | General dev |
| Google | Gemini 1.5 Flash | $0.075 | $0.30 | 1M | Large context |
| Google | Gemini 1.5 Flash-500k | $0.075 | $0.30 | 2M | Huge context |
| Azure | GPT-4 | $30 | $60 | 128k | Enterprise |

## 🎯 **USAGE RECOMMENDATIONS**

### Daily Development Workflow
\`\`\`
1. Quick questions → Claude 3 Haiku
2. Code generation → Claude 3.5 Sonnet
3. Large file analysis → Gemini 1.5 Flash-500k
4. Complex debugging → Claude 3 Opus
5. Documentation → GPT-4 (good at explanations)
\`\`\`

### Team Collaboration
\`\`\`
- Standardize on 2-3 models maximum
- Share API key budgets
- Monitor usage patterns
- Set up cost alerts
\`\`\`

### Enterprise Environment
\`\`\`
- Use Azure/AWS for compliance
- Set up IAM roles properly
- Monitor usage and costs
- Regular security reviews
\`\`\`

## 🚨 **IMPORTANT NOTES**

### Security
- **API keys são enviadas** para servers do Cursor
- **Não são stored**, mas passam pelo backend
- **Use environment variables** para keys sensitive
- **Regular rotation** de API keys

### Limitations
- **Tab completion** não funciona com custom keys
- **Reasoning models** (o1, o3) não suportados
- **Local LLMs** não suportados
- **Custom API formats** não suportados

### Troubleshooting
- **Verify API keys** regularly
- **Check rate limits** do provider
- **Monitor costs** para avoid surprises
- **Test fallback models** quando primary falha
`;

    await fs.writeFile(
      path.join(this.cursorDir, "custom-api-keys-guide.md"),
      apiKeysGuide
    );
    console.log(chalk.green("     ✓ API Keys guide criado"));
  }

  /**
   * 🏢 Configura configurações específicas por provider
   */
  async setupProviderConfigurations() {
    const providerConfig = `# 🏢 Provider-Specific Configurations

## 🤖 **OPENAI CONFIGURATION**

### Setup Steps
1. **Create Account**: [OpenAI Platform](https://platform.openai.com/)
2. **Generate API Key**: API Keys section
3. **Set Usage Limits**: Prevent overuse
4. **Add to Cursor**: Settings > Models > OpenAI API Key

### Models Available
\`\`\`
gpt-4-turbo-preview → Latest GPT-4 with 128k context
gpt-4 → Standard GPT-4 with 8k context  
gpt-3.5-turbo → Fast and cost-effective
gpt-3.5-turbo-16k → Extended context version
\`\`\`

### Best Practices
- **Set monthly limits** para prevent overspend
- **Use gpt-3.5-turbo** para quick tasks
- **Use gpt-4** para complex reasoning
- **Monitor usage** no OpenAI dashboard

### Cost Optimization
\`\`\`javascript
// Estimated costs per session (1000 messages)
gpt-3.5-turbo: $5-10
gpt-4: $50-100
gpt-4-turbo: $30-60
\`\`\`

## 🧠 **ANTHROPIC (CLAUDE) CONFIGURATION**

### Setup Steps
1. **Create Account**: [Anthropic Console](https://console.anthropic.com/)
2. **Request Access**: May need waitlist
3. **Generate API Key**: Keys section
4. **Add to Cursor**: Settings > Models > Anthropic API Key

### Models Available
\`\`\`
claude-3-5-sonnet-20241022 → Best for code (recommended)
claude-3-opus-20240229 → Highest intelligence
claude-3-sonnet-20240229 → Balanced performance
claude-3-haiku-20240307 → Fastest and cheapest
\`\`\`

### Best Use Cases
- **Code generation**: Claude 3.5 Sonnet excels
- **Large context**: All models handle 200k tokens
- **Code analysis**: Superior understanding
- **Refactoring**: Maintains functionality well

### Cost Optimization
\`\`\`javascript
// Most cost-effective for code tasks
claude-3-haiku: $0.25/$1.25 per 1M tokens
claude-3-5-sonnet: $3/$15 per 1M tokens (best value)
claude-3-opus: $15/$75 per 1M tokens (premium)
\`\`\`

## 🌐 **GOOGLE (GEMINI) CONFIGURATION**

### Setup Steps
1. **Google AI Studio**: [aistudio.google.com](https://aistudio.google.com/)
2. **Create API Key**: Get API key button
3. **Enable Billing**: For production use
4. **Add to Cursor**: Settings > Models > Google API Key

### Models Available
\`\`\`
gemini-1.5-pro → High performance with 2M context
gemini-1.5-flash → Fast with 1M context
gemini-1.5-flash-500k → Extended context version
\`\`\`

### Best Use Cases
- **Large codebases**: 1-2M token context window
- **Cost-effective**: Lowest cost per token
- **Multimodal**: Can process images (future)
- **Fast iteration**: Flash models respond quickly

### Cost Optimization
\`\`\`javascript
// Most cost-effective option
gemini-1.5-flash: $0.075/$0.30 per 1M tokens
gemini-1.5-pro: $3.50/$10.50 per 1M tokens
\`\`\`

## ☁️ **AZURE OPENAI CONFIGURATION**

### Setup Steps
1. **Azure Subscription**: Create or use existing
2. **Create OpenAI Resource**: Azure portal
3. **Deploy Models**: Choose GPT-4, GPT-3.5 etc.
4. **Get Endpoint & Key**: Resource overview
5. **Add to Cursor**: Settings > Models > Azure

### Enterprise Benefits
- **Compliance**: SOC 2, HIPAA, PCI DSS
- **Data residency**: Keep data in specific regions
- **Private networking**: VNet integration
- **Enterprise billing**: Unified with Azure

### Configuration Example
\`\`\`json
{
  "azure_endpoint": "https://your-resource.openai.azure.com/",
  "api_key": "your-api-key",
  "api_version": "2024-02-15-preview",
  "deployment_name": "gpt-4-deployment"
}
\`\`\`

## 🏗️ **AWS BEDROCK CONFIGURATION**

### Setup Steps
1. **AWS Account**: With appropriate permissions
2. **Enable Bedrock**: In target region
3. **Request Model Access**: For Claude, Llama etc.
4. **Create IAM Role**: With Bedrock permissions
5. **Add to Cursor**: Access key or IAM role

### Enterprise Benefits
- **Native AWS integration**: Works with existing AWS setup
- **Multiple model providers**: Claude, Llama, Titan
- **Enterprise controls**: IAM, CloudTrail, monitoring
- **Global availability**: Multiple regions

### IAM Policy Example
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
\`\`\`

## 🔄 **PROVIDER SWITCHING STRATEGY**

### Automatic Fallback
\`\`\`
Primary: Claude 3.5 Sonnet (code tasks)
Fallback 1: GPT-4 Turbo (if Claude unavailable)
Fallback 2: Gemini 1.5 Flash (if both unavailable)
\`\`\`

### Task-Specific Routing
\`\`\`javascript
// Pseudocode for model selection
if (task.type === 'large_codebase') {
  model = 'gemini-1.5-flash-500k';
} else if (task.type === 'code_generation') {
  model = 'claude-3-5-sonnet';
} else if (task.type === 'quick_question') {
  model = 'claude-3-haiku';
} else {
  model = 'gpt-4-turbo'; // default
}
\`\`\`

### Cost-Based Routing
\`\`\`
Budget Tier 1: Gemini 1.5 Flash only
Budget Tier 2: + Claude 3 Haiku  
Budget Tier 3: + Claude 3.5 Sonnet
Premium: All models available
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "provider-configurations.md"),
      providerConfig
    );
    console.log(chalk.green("     ✓ Provider configurations criadas"));
  }

  /**
   * 🎯 Configura estratégias de modelo por task
   */
  async setupModelStrategies() {
    const modelStrategies = `# 🎯 Model Selection Strategies

## 📊 **TASK-BASED MODEL SELECTION**

### 💻 **Code Generation Tasks**

#### Best Models
1. **Claude 3.5 Sonnet** → Superior code understanding
2. **GPT-4 Turbo** → Good general coding
3. **Claude 3 Haiku** → Quick code snippets

#### Examples
\`\`\`
"Create a React component with TypeScript"
→ Claude 3.5 Sonnet (best code quality)

"Fix this small bug in JavaScript" 
→ Claude 3 Haiku (fast and cheap)

"Implement complex algorithm"
→ Claude 3 Opus (highest reasoning)
\`\`\`

### 📖 **Code Analysis & Understanding**

#### Best Models
1. **Gemini 1.5 Flash-500k** → Massive context (2M tokens)
2. **Claude 3.5 Sonnet** → Deep code understanding
3. **Gemini 1.5 Pro** → Large context with high quality

#### Examples
\`\`\`
"Analyze this entire codebase structure"
→ Gemini 1.5 Flash-500k (can fit huge codebases)

"Explain how this authentication system works"
→ Claude 3.5 Sonnet (excellent at explaining code)

"Find patterns across multiple files"
→ Gemini 1.5 Pro (good pattern recognition)
\`\`\`

### 🐛 **Debugging & Troubleshooting**

#### Best Models
1. **Claude 3 Opus** → Complex reasoning
2. **GPT-4** → Good debugging skills
3. **Claude 3.5 Sonnet** → Code-focused debugging

#### Examples
\`\`\`
"Why is my React app re-rendering unnecessarily?"
→ Claude 3 Opus (complex performance debugging)

"Fix this TypeScript error"
→ Claude 3.5 Sonnet (understands TS well)

"Debug this async/await issue"
→ GPT-4 (good at async patterns)
\`\`\`

### 📝 **Documentation & Explanation**

#### Best Models
1. **GPT-4** → Excellent at explanations
2. **Claude 3.5 Sonnet** → Good technical writing
3. **Gemini 1.5 Flash** → Fast documentation

#### Examples
\`\`\`
"Write comprehensive API documentation"
→ GPT-4 (best at structured documentation)

"Explain this code to a junior developer"
→ Claude 3.5 Sonnet (clear technical explanations)

"Generate README for this project"
→ Gemini 1.5 Flash (fast, good enough quality)
\`\`\`

### 🏗️ **Architecture & Design**

#### Best Models
1. **Claude 3 Opus** → Systems thinking
2. **GPT-4** → Design patterns knowledge
3. **Claude 3.5 Sonnet** → Code architecture

#### Examples
\`\`\`
"Design microservices architecture"
→ Claude 3 Opus (complex system design)

"Suggest design patterns for this problem"
→ GPT-4 (extensive pattern knowledge)

"Refactor this monolith into modules"
→ Claude 3.5 Sonnet (code structure expert)
\`\`\`

## ⚡ **SPEED-BASED SELECTION**

### 🚀 **Ultra Fast (< 2 seconds)**
- **Claude 3 Haiku** → Fastest overall
- **Gemini 1.5 Flash** → Fast with large context

#### Use Cases
\`\`\`
- Quick syntax questions
- Simple code fixes
- Basic explanations
- Rapid iteration
\`\`\`

### ⚡ **Fast (2-5 seconds)**
- **Claude 3.5 Sonnet** → Good balance
- **GPT-3.5 Turbo** → OpenAI fast option

#### Use Cases
\`\`\`
- Code generation
- Medium explanations
- Refactoring
- Testing
\`\`\`

### 🐌 **Thorough (5+ seconds)**
- **Claude 3 Opus** → Highest quality
- **GPT-4** → Comprehensive responses

#### Use Cases
\`\`\`
- Complex problems
- Architecture decisions
- Deep analysis
- Critical code
\`\`\`

## 💰 **COST-BASED SELECTION**

### 💸 **Ultra Budget (< $0.01 per request)**
- **Gemini 1.5 Flash** → $0.075/$0.30 per 1M tokens
- **Claude 3 Haiku** → $0.25/$1.25 per 1M tokens

### 💵 **Balanced ($0.01-0.05 per request)**
- **Claude 3.5 Sonnet** → $3/$15 per 1M tokens
- **GPT-3.5 Turbo** → $0.5/$1.5 per 1M tokens

### 💎 **Premium ($0.05+ per request)**
- **Claude 3 Opus** → $15/$75 per 1M tokens
- **GPT-4** → $30/$60 per 1M tokens

## 🎯 **CONTEXT SIZE STRATEGY**

### 📄 **Small Context (< 10k tokens)**
Any model works well:
- **Claude 3 Haiku** → Cheapest
- **GPT-3.5 Turbo** → Fast
- **Gemini 1.5 Flash** → Balanced

### 📖 **Medium Context (10k-100k tokens)**
Need capable models:
- **Claude 3.5 Sonnet** → 200k context
- **GPT-4 Turbo** → 128k context
- **Gemini 1.5 Flash** → 1M context

### 📚 **Large Context (100k+ tokens)**
Specialized models only:
- **Gemini 1.5 Flash-500k** → 2M context (cheapest)
- **Gemini 1.5 Pro** → 2M context (higher quality)
- **Claude 3.5 Sonnet** → 200k context (max)

## 🔄 **DYNAMIC MODEL SWITCHING**

### Conversation-Based Switching
\`\`\`
Start: Claude 3 Haiku (quick understanding)
↓
Deep dive: Claude 3.5 Sonnet (detailed analysis)
↓
Complex issue: Claude 3 Opus (maximum reasoning)
↓
Implementation: Claude 3.5 Sonnet (best code)
\`\`\`

### Context-Size Escalation
\`\`\`
Small request: Claude 3 Haiku
↓
Need more context: Claude 3.5 Sonnet
↓
Large codebase: Gemini 1.5 Flash-500k
\`\`\`

### Budget-Aware Switching
\`\`\`
Try cheap first: Gemini 1.5 Flash
↓
If unsatisfactory: Claude 3.5 Sonnet
↓
Critical task: Claude 3 Opus
\`\`\`

## 📋 **MODEL SELECTION CHECKLIST**

### Before Choosing Model
- [ ] What's the task complexity?
- [ ] How much context is needed?
- [ ] Speed vs quality tradeoff?
- [ ] Budget constraints?
- [ ] Fallback options available?

### For Code Tasks
- [ ] Generation → Claude 3.5 Sonnet
- [ ] Analysis → Gemini 1.5 Flash-500k
- [ ] Debugging → Claude 3 Opus
- [ ] Quick fixes → Claude 3 Haiku

### For Large Codebases
- [ ] Full analysis → Gemini 1.5 Flash-500k
- [ ] Specific questions → Claude 3.5 Sonnet
- [ ] Architecture review → Claude 3 Opus
- [ ] Documentation → GPT-4

## 🎯 **RECOMMENDED SETUPS**

### Solo Developer
\`\`\`
Primary: Claude 3.5 Sonnet (code quality)
Quick: Claude 3 Haiku (fast iteration)
Large: Gemini 1.5 Flash-500k (big projects)
Budget: ~$50-100/month
\`\`\`

### Development Team
\`\`\`
Primary: Claude 3.5 Sonnet (standardized)
Secondary: GPT-4 (fallback)
Large context: Gemini 1.5 Pro (quality)
Quick: Gemini 1.5 Flash (cost-effective)
Budget: ~$200-500/month
\`\`\`

### Enterprise Team
\`\`\`
Primary: Azure GPT-4 (compliance)
Secondary: AWS Bedrock Claude (enterprise)
Fallback: Claude 3.5 Sonnet (quality)
Budget: ~$1000+/month with enterprise features
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "model-strategies.md"),
      modelStrategies
    );
    console.log(chalk.green("     ✓ Model strategies configuradas"));
  }

  /**
   * 🔒 Configura security e cost management
   */
  async setupSecurityAndCosts() {
    const securityGuide = `# 🔒 Security & Cost Management

## 🛡️ **SECURITY CONSIDERATIONS**

### API Key Security
- **Keys são enviadas** para Cursor servers com cada request
- **Não são stored** localmente, mas passam pelo backend
- **Backend routing** para prompt building final
- **No encryption** garantida entre device e Cursor

### Best Practices
\`\`\`
✅ Use separate API keys for different projects
✅ Set monthly spending limits on all providers
✅ Regular key rotation (monthly/quarterly)
✅ Monitor usage patterns for anomalies
✅ Use enterprise accounts with better security
\`\`\`

### Risk Mitigation
\`\`\`
🔒 Never share API keys in code/repos
🔒 Use environment variables for key storage
🔒 Set up billing alerts on all providers
🔒 Regular audit of API key permissions
🔒 Use IAM roles for AWS/Azure when possible
\`\`\`

### Enterprise Security
\`\`\`
- Use Azure/AWS for compliance requirements
- Implement proper IAM policies
- Enable audit logging
- Set up network restrictions where possible
- Regular security reviews
\`\`\`

## 💰 **COST MANAGEMENT**

### Setting Up Budgets

#### OpenAI
\`\`\`
1. Go to OpenAI Platform → Billing
2. Set "Monthly budget" limit
3. Configure "Email alerts" at 50%, 80%, 100%
4. Enable "Hard limit" to stop usage
\`\`\`

#### Anthropic
\`\`\`
1. Go to Anthropic Console → Billing
2. Set "Monthly spend limit"
3. Configure notification emails
4. Monitor usage dashboard
\`\`\`

#### Google AI
\`\`\`
1. Go to Google Cloud Console → Billing
2. Set "Budget alerts"
3. Configure "Budget actions"
4. Monitor AI Studio usage
\`\`\`

### Cost Monitoring Tools

#### Real-Time Tracking
\`\`\`javascript
// Example usage tracking
const trackUsage = {
  daily_budget: 10, // $10/day
  current_spend: 0,
  model_costs: {
    'claude-3-5-sonnet': 0.003, // per 1k tokens input
    'gpt-4': 0.03,
    'gemini-1.5-flash': 0.000075
  }
};

// Before each request
if (trackUsage.current_spend >= trackUsage.daily_budget) {
  console.warn('Daily budget exceeded, switching to cheaper model');
}
\`\`\`

#### Weekly Reports
\`\`\`
Monitor these metrics:
- Total spend per model
- Requests per model
- Average cost per conversation
- Peak usage times
- Most expensive tasks
\`\`\`

### Cost Optimization Strategies

#### Model Cascading
\`\`\`javascript
// Start cheap, escalate if needed
async function smartModelSelection(task) {
  try {
    // Try cheapest first
    return await callModel('claude-3-haiku', task);
  } catch (error) {
    // Escalate to better model
    return await callModel('claude-3-5-sonnet', task);
  }
}
\`\`\`

#### Context Optimization
\`\`\`
- Trim unnecessary context
- Use @Code instead of @Files when possible
- Start new conversations for new topics
- Avoid sending large files repeatedly
\`\`\`

#### Task Batching
\`\`\`
Instead of: 5 separate questions
Do: "Please answer these 5 questions: 1) ... 2) ... 3) ..."
Saves: 4 request charges
\`\`\`

### Budget Planning

#### Solo Developer
\`\`\`
Light usage: $20-50/month
- Claude 3 Haiku for quick tasks
- Claude 3.5 Sonnet for code
- Gemini 1.5 Flash for large context

Medium usage: $50-150/month
- Mix of models based on task
- Occasional premium model usage
- Good balance of speed/quality

Heavy usage: $150-500/month
- Premium models for complex tasks
- Large codebase analysis
- Extensive documentation generation
\`\`\`

#### Team Environment
\`\`\`
Small team (2-5 devs): $200-800/month
Medium team (5-15 devs): $500-2000/month
Large team (15+ devs): $1000+/month

Factors affecting cost:
- Number of active developers
- Complexity of projects
- Frequency of usage
- Model selection strategy
\`\`\`

## 📊 **COST TRACKING TEMPLATES**

### Daily Usage Log
\`\`\`
Date: 2024-01-15
Total Requests: 45
Total Cost: $12.50

Model Breakdown:
- claude-3-haiku: 25 requests, $2.50
- claude-3-5-sonnet: 15 requests, $7.50
- gemini-1.5-flash: 5 requests, $2.50

Task Breakdown:
- Code generation: $8.00
- Debugging: $3.00
- Documentation: $1.50
\`\`\`

### Monthly Budget Planning
\`\`\`
Monthly Budget: $200
Week 1: $45 (22.5% used)
Week 2: $52 (26% used)
Week 3: $48 (24% used)
Week 4: $55 (27.5% used)

Projected month: $200 ✅ On budget

Optimization opportunities:
- Use more Haiku for quick questions
- Batch similar requests
- Optimize context size
\`\`\`

## ⚠️ **COST ALERTS & THRESHOLDS**

### Immediate Alerts (Same Day)
\`\`\`
Daily > $50: Review usage patterns
Daily > $100: Switch to cheaper models
Daily > $200: Investigate unusual activity
\`\`\`

### Weekly Reviews
\`\`\`
Weekly > $300: Optimize model selection
Weekly > $500: Review team usage patterns
Weekly > $1000: Implement stricter controls
\`\`\`

### Monthly Actions
\`\`\`
Monthly > $1000: Evaluate ROI
Monthly > $2000: Consider enterprise plans
Monthly > $5000: Implement usage quotas
\`\`\`

## 🚨 **EMERGENCY PROCEDURES**

### Unexpected High Costs
\`\`\`
1. Check billing dashboard immediately
2. Identify unusual usage patterns
3. Disable API keys if necessary
4. Contact provider support
5. Review recent team activity
\`\`\`

### API Key Compromise
\`\`\`
1. Immediately disable/delete key
2. Generate new API key
3. Update Cursor configuration
4. Monitor usage for unauthorized activity
5. Report to security team if enterprise
\`\`\`

### Service Outages
\`\`\`
1. Check provider status pages
2. Switch to backup provider
3. Notify team of model changes
4. Monitor for service restoration
5. Post-incident review
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "security-and-costs.md"),
      securityGuide
    );
    console.log(chalk.green("     ✓ Security and cost management configurado"));
  }

  /**
   * 🔧 Configura troubleshooting guide
   */
  async setupTroubleshooting() {
    const troubleshootingGuide = `# 🔧 Custom API Keys Troubleshooting

## 🚨 **COMMON ISSUES & SOLUTIONS**

### ❌ **"API Key Verification Failed"**

#### Possible Causes
- Invalid or expired API key
- Incorrect format
- Insufficient permissions
- Rate limiting

#### Solutions
\`\`\`
1. Double-check API key format
2. Regenerate key from provider dashboard
3. Verify account has sufficient credits
4. Check for any account restrictions
5. Wait a few minutes and retry
\`\`\`

### ❌ **"Model Not Available"**

#### Possible Causes
- Model name typo
- Model not available in region
- Insufficient API tier
- Model deprecated

#### Solutions
\`\`\`
1. Check exact model name in provider docs
2. Verify model availability in your region
3. Upgrade API tier if needed
4. Use alternative model
5. Check provider status page
\`\`\`

### ❌ **"Rate Limit Exceeded"**

#### Possible Causes
- Too many requests per minute
- Exceeded monthly quota
- Insufficient tier limits

#### Solutions
\`\`\`
1. Wait for rate limit reset
2. Upgrade to higher tier
3. Implement request throttling
4. Use multiple API keys
5. Switch to different provider temporarily
\`\`\`

### ❌ **"Requests Taking Too Long"**

#### Possible Causes
- Large context size
- Model overloaded
- Network issues
- Complex prompts

#### Solutions
\`\`\`
1. Reduce context size
2. Use faster model (Claude Haiku, Gemini Flash)
3. Break large requests into smaller ones
4. Check network connectivity
5. Simplify prompts
\`\`\`

## 🔍 **DIAGNOSTIC STEPS**

### Step 1: Verify Basic Setup
\`\`\`
✅ API key correctly entered in Cursor
✅ Key verification shows green checkmark
✅ Selected model is available
✅ Account has sufficient credits
\`\`\`

### Step 2: Test Simple Request
\`\`\`
Send simple prompt: "Hello, can you respond?"
Expected: Quick response from selected model
If fails: API key or model issue
\`\`\`

### Step 3: Check Provider Dashboard
\`\`\`
✅ Login to provider dashboard
✅ Check API usage statistics
✅ Verify billing status
✅ Review any error logs
\`\`\`

### Step 4: Test Different Models
\`\`\`
Try different models from same provider
Try different providers
Identify if issue is model-specific
\`\`\`

## 🛠️ **PROVIDER-SPECIFIC ISSUES**

### OpenAI Issues
\`\`\`
Common problems:
- GPT-4 access requires paid account
- Rate limits are strict for new accounts
- Some models require specific tiers

Debugging:
1. Check OpenAI status page
2. Verify payment method
3. Check usage limits in dashboard
4. Try GPT-3.5 if GPT-4 fails
\`\`\`

### Anthropic Issues
\`\`\`
Common problems:
- Claude access may be waitlisted
- Regional availability varies
- Beta features may be unstable

Debugging:
1. Check Anthropic console
2. Verify account approval status
3. Try different Claude model
4. Check regional availability
\`\`\`

### Google Issues
\`\`\`
Common problems:
- Billing must be enabled
- API quotas are separate from free tier
- Model names change frequently

Debugging:
1. Enable billing in Google Cloud
2. Check AI Studio quotas
3. Verify exact model names
4. Check Google Cloud status
\`\`\`

### Azure Issues
\`\`\`
Common problems:
- Deployment required before use
- Regional capacity limits
- Complex endpoint configuration

Debugging:
1. Check Azure OpenAI resource status
2. Verify deployment is running
3. Check endpoint URL format
4. Review API version compatibility
\`\`\`

## 🔧 **PERFORMANCE OPTIMIZATION**

### Slow Response Times
\`\`\`
Immediate fixes:
- Switch to faster model (Haiku, Flash)
- Reduce context size
- Use more specific prompts

Long-term fixes:
- Implement response caching
- Pre-process large contexts
- Use model cascading strategy
\`\`\`

### High Costs
\`\`\`
Immediate fixes:
- Switch to cheaper models
- Reduce context size
- Batch multiple questions

Long-term fixes:
- Implement usage tracking
- Set up automated budget controls
- Optimize prompt engineering
\`\`\`

### Inconsistent Quality
\`\`\`
Solutions:
- Use more powerful model for complex tasks
- Improve prompt specificity
- Implement multi-step reasoning
- Use model voting for critical decisions
\`\`\`

## 📊 **MONITORING & ALERTS**

### Usage Monitoring
\`\`\`javascript
// Example monitoring setup
const monitoring = {
  daily_requests: 0,
  daily_cost: 0,
  error_count: 0,
  avg_response_time: 0,
  
  checkLimits() {
    if (this.daily_cost > 50) {
      console.warn('Daily cost limit exceeded');
    }
    if (this.error_count > 10) {
      console.warn('High error rate detected');
    }
  }
};
\`\`\`

### Error Tracking
\`\`\`javascript
// Common error patterns to track
const errorTypes = {
  'rate_limit': 0,
  'auth_failed': 0,
  'model_unavailable': 0,
  'timeout': 0,
  'unknown': 0
};
\`\`\`

## 🚀 **OPTIMIZATION RECOMMENDATIONS**

### For New Users
\`\`\`
1. Start with one provider (Anthropic recommended)
2. Use cheaper models initially (Claude Haiku)
3. Set low budget limits ($20-50/month)
4. Monitor usage patterns closely
5. Gradually add more providers
\`\`\`

### For Teams
\`\`\`
1. Standardize on 2-3 models maximum
2. Implement shared monitoring
3. Set up team budget alerts
4. Regular usage pattern reviews
5. Document best practices
\`\`\`

### For Enterprise
\`\`\`
1. Use enterprise providers (Azure, AWS)
2. Implement proper governance
3. Set up detailed monitoring
4. Regular cost optimization reviews
5. Security audits and compliance
\`\`\`

## 📞 **GETTING HELP**

### Provider Support
\`\`\`
OpenAI: help.openai.com
Anthropic: support@anthropic.com
Google: AI Studio help center
Azure: Azure support portal
AWS: AWS support
\`\`\`

### Cursor Support
\`\`\`
Note: Cursor provides limited support for custom API setups
Best effort support for officially supported providers
No support for local LLMs or custom API formats
\`\`\`

### Community Resources
\`\`\`
Cursor Discord/Forum
Provider-specific communities
Stack Overflow
GitHub issues for specific tools
\`\`\`
`;

    await fs.writeFile(
      path.join(this.cursorDir, "api-troubleshooting.md"),
      troubleshootingGuide
    );
    console.log(chalk.green("     ✓ Troubleshooting guide criado"));
  }
}

export default CustomAPISetup;
