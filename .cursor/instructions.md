# GENERIC Project Instructions

## Project Overview
Modern generic application with latest best practices and patterns.

## Technology Stack

### Frontend Technologies
- **React 19**: Modern hooks and concurrent features
- **TypeScript**: Strict configuration for type safety
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Responsive design system

### Backend Technologies  
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Database**: PostgreSQL with modern ORM
- **API**: RESTful design with OpenAPI documentation

### Development Tools
- **ESLint + Prettier**: Code quality standards
- **Jest + RTL**: Unit and integration testing
- **Storybook**: Component development and documentation
- **CI/CD**: Automated testing and deployment

## Architecture Patterns
- **Component Composition**: Reusable, composable UI building blocks
- **Custom Hooks**: Shared logic extraction and reusability
- **Context + Reducer**: Global state management for complex state
- **Error Boundaries**: Graceful error handling and recovery
- **Code Splitting**: Lazy loading for performance optimization

## Development Standards

### Code Quality
- **TypeScript Strict Mode**: Enabled for maximum type safety
- **ESLint + Prettier**: Automated code formatting and quality
- **Husky Pre-commit Hooks**: Quality gates before commits
- **Conventional Commits**: Standardized commit message format

### Testing Strategy
- **Unit Testing**: Jest with comprehensive coverage
- **Component Testing**: React Testing Library for UI components
- **Integration Testing**: API and database integration tests
- **E2E Testing**: Playwright for critical user journeys

### Performance Standards
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size**: Monitor and optimize chunk sizes
- **Image Optimization**: Use next/image or optimized formats
- **Code Splitting**: Lazy loading for non-critical code

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: Full accessibility support
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions

## Build and Deployment

### Development Workflow
1. `npm install` - Install all dependencies
2. `npm run dev` - Start development server with hot reload
3. `npm run build` - Create optimized production build
4. `npm run test` - Run complete test suite
5. `npm run lint` - Perform code quality checks

### Quality Gates
- All tests must pass before deployment
- ESLint errors must be resolved
- TypeScript compilation must succeed
- Performance budgets must be met
- Accessibility tests must pass

## Project Structure
```
src/
├── components/           # React components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   ├── layout/          # Layout components
│   └── pages/           # Page-specific components
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useApi.ts        # API integration hook
│   └── useLocalStorage.ts # Local storage hook
├── utils/               # Utility functions
│   ├── api.ts           # API client
│   ├── auth.ts          # Authentication utilities
│   └── formatting.ts   # Data formatting
├── types/               # TypeScript definitions
│   ├── user.ts          # User types
│   ├── api.ts           # API types
│   └── common.ts        # Common types
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication context
│   └── ThemeContext.tsx # Theme context
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── hooks/           # Hook tests
│   └── utils/           # Utility tests
├── App.tsx              # Main App component
└── main.tsx             # Application entry point
public/                   # Static assets
├── images/              # Image assets
└── icons/               # Icon files
```

## Development Guidelines

### Component Development
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow component composition patterns
- Add comprehensive error boundaries
- Include loading and error states

### State Management
- Use built-in React state for local state
- Implement Context + useReducer for complex state
- Consider Zustand for global client state
- Use Server State libraries (React Query/SWR) for server data

### API Integration
- Use modern fetch patterns with error handling
- Implement proper loading and error states
- Add request/response interceptors
- Include retry logic for failed requests
- Cache responses appropriately

### Security Practices
- Validate all user inputs
- Sanitize data before rendering
- Implement proper authentication flows
- Use HTTPS in production
- Follow OWASP security guidelines
