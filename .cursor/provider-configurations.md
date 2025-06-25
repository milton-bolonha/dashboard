# 🏢 Provider-Specific Configurations

## 🤖 **OPENAI CONFIGURATION**

### Setup Steps
1. **Create Account**: [OpenAI Platform](https://platform.openai.com/)
2. **Generate API Key**: API Keys section
3. **Set Usage Limits**: Prevent overuse
4. **Add to Cursor**: Settings > Models > OpenAI API Key

### Models Available
```
gpt-4-turbo-preview → Latest GPT-4 with 128k context
gpt-4 → Standard GPT-4 with 8k context  
gpt-3.5-turbo → Fast and cost-effective
gpt-3.5-turbo-16k → Extended context version
```

### Best Practices
- **Set monthly limits** para prevent overspend
- **Use gpt-3.5-turbo** para quick tasks
- **Use gpt-4** para complex reasoning
- **Monitor usage** no OpenAI dashboard

### Cost Optimization
```javascript
// Estimated costs per session (1000 messages)
gpt-3.5-turbo: $5-10
gpt-4: $50-100
gpt-4-turbo: $30-60
```

## 🧠 **ANTHROPIC (CLAUDE) CONFIGURATION**

### Setup Steps
1. **Create Account**: [Anthropic Console](https://console.anthropic.com/)
2. **Request Access**: May need waitlist
3. **Generate API Key**: Keys section
4. **Add to Cursor**: Settings > Models > Anthropic API Key

### Models Available
```
claude-3-5-sonnet-20241022 → Best for code (recommended)
claude-3-opus-20240229 → Highest intelligence
claude-3-sonnet-20240229 → Balanced performance
claude-3-haiku-20240307 → Fastest and cheapest
```

### Best Use Cases
- **Code generation**: Claude 3.5 Sonnet excels
- **Large context**: All models handle 200k tokens
- **Code analysis**: Superior understanding
- **Refactoring**: Maintains functionality well

### Cost Optimization
```javascript
// Most cost-effective for code tasks
claude-3-haiku: $0.25/$1.25 per 1M tokens
claude-3-5-sonnet: $3/$15 per 1M tokens (best value)
claude-3-opus: $15/$75 per 1M tokens (premium)
```

## 🌐 **GOOGLE (GEMINI) CONFIGURATION**

### Setup Steps
1. **Google AI Studio**: [aistudio.google.com](https://aistudio.google.com/)
2. **Create API Key**: Get API key button
3. **Enable Billing**: For production use
4. **Add to Cursor**: Settings > Models > Google API Key

### Models Available
```
gemini-1.5-pro → High performance with 2M context
gemini-1.5-flash → Fast with 1M context
gemini-1.5-flash-500k → Extended context version
```

### Best Use Cases
- **Large codebases**: 1-2M token context window
- **Cost-effective**: Lowest cost per token
- **Multimodal**: Can process images (future)
- **Fast iteration**: Flash models respond quickly

### Cost Optimization
```javascript
// Most cost-effective option
gemini-1.5-flash: $0.075/$0.30 per 1M tokens
gemini-1.5-pro: $3.50/$10.50 per 1M tokens
```

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
```json
{
  "azure_endpoint": "https://your-resource.openai.azure.com/",
  "api_key": "your-api-key",
  "api_version": "2024-02-15-preview",
  "deployment_name": "gpt-4-deployment"
}
```

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
```json
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
```

## 🔄 **PROVIDER SWITCHING STRATEGY**

### Automatic Fallback
```
Primary: Claude 3.5 Sonnet (code tasks)
Fallback 1: GPT-4 Turbo (if Claude unavailable)
Fallback 2: Gemini 1.5 Flash (if both unavailable)
```

### Task-Specific Routing
```javascript
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
```

### Cost-Based Routing
```
Budget Tier 1: Gemini 1.5 Flash only
Budget Tier 2: + Claude 3 Haiku  
Budget Tier 3: + Claude 3.5 Sonnet
Premium: All models available
```
