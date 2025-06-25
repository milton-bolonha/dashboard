# 🔑 Custom API Keys Configuration Guide

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
```
Primary: Claude 3 Opus
Secondary: GPT-4
Quick tasks: Claude 3.5 Sonnet
Large context: Gemini 1.5 Pro
```

#### Balanced Performance/Cost
```
Primary: Claude 3.5 Sonnet
Secondary: Gemini 1.5 Flash
Quick tasks: Claude 3 Haiku
Large context: Gemini 1.5 Flash-500k
```

#### Budget Conscious
```
Primary: Gemini 1.5 Flash
Secondary: Claude 3 Haiku
Large context: Gemini 1.5 Flash-500k
Enterprise: Azure GPT-3.5 Turbo
```

## 🔧 **CONFIGURATION TEMPLATES**

### Development Team Setup
```json
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
```

### Enterprise Setup
```json
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
```

### Freelancer/Solo Setup
```json
{
  "primary_model": "gemini-1.5-flash",
  "reasoning_model": "claude-3-5-sonnet-20241022",
  "large_context_model": "gemini-1.5-flash-500k",
  "providers": {
    "google": "AI...",
    "anthropic": "sk-ant-..."
  }
}
```

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
```
1. Quick questions → Claude 3 Haiku
2. Code generation → Claude 3.5 Sonnet
3. Large file analysis → Gemini 1.5 Flash-500k
4. Complex debugging → Claude 3 Opus
5. Documentation → GPT-4 (good at explanations)
```

### Team Collaboration
```
- Standardize on 2-3 models maximum
- Share API key budgets
- Monitor usage patterns
- Set up cost alerts
```

### Enterprise Environment
```
- Use Azure/AWS for compliance
- Set up IAM roles properly
- Monitor usage and costs
- Regular security reviews
```

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
