# AI Sales Dashboard

A comprehensive web-based dashboard for sales professionals to manage and refine multiple AI-driven research prompts simultaneously. Built with Next.js, TypeScript, and integrated with OpenAI/Anthropic APIs.

## Features

### Core Functionality
- **Trello-style Board Layout**: Manage multiple prompt-answer tiles on a drag-and-drop dashboard
- **Interactive AI Refinement**: Reply to AI outputs within tiles to request updates or further detail
- **Dynamic Context Switching**: Automatically update all prompt answers when switching companies/prospects
- **Real-time Performance**: Fast AI responses matching ChatGPT speed
- **Mobile Responsive**: Fully responsive design for all devices

### User Management
- **Secure Authentication**: Google and Microsoft OAuth integration
- **User Setup**: First-time popup for company and solution information
- **Credit System**: Track and manage AI usage with credits
- **Profile Management**: Update user information and preferences

### Company Management
- **Add Companies**: Manual entry, CSV upload, or CRM integration
- **Auto-generated Dashboards**: Preset AI prompt tiles for new companies
- **Company Profiles**: Store company information, industry, size, location
- **Bulk Operations**: Manage multiple companies efficiently

### Contact Management
- **Contact Profiles**: Add contacts with job titles, LinkedIn profiles
- **AI-generated Insights**: Automatic pain points, triggers, and responsibilities analysis
- **Contact Context**: Use contact information to personalize AI responses

### Dashboard Features
- **Multiple Templates**: Default templates and custom dashboard creation
- **Tile System**: Drag-and-drop, resizable tiles with different types
- **Background Customization**: Solid colors, pre-made designs, or custom images
- **File Attachments**: Upload and manage files, call recordings, documents
- **Search Functionality**: Find content across the dashboard

### AI Integration
- **OpenAI GPT-4**: Primary AI service for content generation
- **Anthropic Claude**: Alternative AI service option
- **Context-aware Responses**: AI considers company, contact, and user context
- **Refinement System**: Iteratively improve AI responses
- **Bulk Processing**: Generate multiple responses simultaneously

### Outreach Automation
- **Generate Outreach**: Create emails, call scripts, LinkedIn DMs
- **Side-by-side Editor**: Compare AI drafts with context
- **Style Adaptation**: Upload examples to influence AI writing style
- **Template Management**: Save and reuse outreach templates

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Beautiful DnD**: Drag and drop functionality
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM
- **PostgreSQL**: Primary database
- **NextAuth.js**: Authentication
- **OpenAI SDK**: AI integration
- **Anthropic SDK**: Alternative AI service

### Infrastructure
- **Vercel**: Deployment platform
- **AWS S3**: File storage
- **Stripe**: Payment processing
- **WebSocket**: Real-time updates

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Google/Microsoft OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-sales-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   Fill in your environment variables in `.env.local`

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_sales_dashboard"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# AI Services
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Payment Processing
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# File Storage
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-s3-bucket-name"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── setup/             # User setup page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── TileGrid.tsx      # Tile management
│   └── TileComponent.tsx # Individual tile component
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── prisma.ts        # Database client
│   ├── auth.ts          # Authentication config
│   └── ai.ts            # AI service integration
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out

### User Management
- `POST /api/user/setup` - Complete user profile setup
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile

### Companies
- `GET /api/companies` - List user's companies
- `POST /api/companies` - Create new company
- `GET /api/companies/[id]` - Get company details
- `PATCH /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get contact details
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Dashboards
- `GET /api/dashboards` - List user's dashboards
- `POST /api/dashboards` - Create new dashboard
- `GET /api/dashboards/[id]` - Get dashboard details
- `PATCH /api/dashboards/[id]` - Update dashboard
- `DELETE /api/dashboards/[id]` - Delete dashboard

### Tiles
- `GET /api/tiles` - List tiles
- `POST /api/tiles` - Create new tile
- `PATCH /api/tiles/[id]` - Update tile
- `DELETE /api/tiles/[id]` - Delete tile
- `POST /api/tiles/bulk` - Create multiple tiles
- `POST /api/tiles/reorder` - Reorder tiles

### AI Services
- `POST /api/ai/generate` - Generate AI content
- `POST /api/ai/refine` - Refine AI content

## Development

### Database Schema
The application uses Prisma with PostgreSQL. Key models include:
- `User` - User accounts and profiles
- `Company` - Company information
- `Contact` - Contact profiles and insights
- `Dashboard` - Dashboard configurations
- `Tile` - Individual dashboard tiles
- `Outreach` - Generated outreach content
- `File` - File attachments

### AI Integration
The AI service supports both OpenAI and Anthropic:
- Automatic context building from user, company, and contact data
- Credit tracking and cost estimation
- Response refinement and iteration
- Bulk processing for multiple prompts

### State Management
- React Context for dashboard state
- Local state for component interactions
- Server state synchronization via API calls

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup
1. Create PostgreSQL database
2. Run `npx prisma db push` to create tables
3. Update `DATABASE_URL` environment variable

### OAuth Setup
1. Create Google OAuth application
2. Create Microsoft Azure AD application
3. Add redirect URIs for your domain
4. Update OAuth credentials in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact the development team.
