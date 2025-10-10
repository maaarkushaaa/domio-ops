# 🏗️ Архитектура DOMIO Ops

## 📋 Обзор

DOMIO Ops - это modern enterprise-grade приложение, построенное на передовом tech stack с фокусом на масштабируемость, безопасность и производительность.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.3+ с TypeScript
- **Build Tool**: Vite 5+ (быстрая сборка, HMR)
- **Routing**: React Router v6 (client-side routing)
- **State Management**: 
  - React Context API для глобального состояния
  - TanStack Query для server state
- **UI Framework**: 
  - Shadcn/ui (customizable components)
  - Radix UI (accessible primitives)
  - Tailwind CSS (utility-first styling)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Drag & Drop**: React Beautiful DnD

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage
- **Edge Functions**: Deno-based serverless functions
- **Real-time**: Supabase Realtime (WebSocket)
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)

### Infrastructure
- **Hosting**: Vercel (Edge Network, Auto-scaling)
- **CDN**: Vercel CDN (global distribution)
- **SSL**: Automatic HTTPS
- **CI/CD**: Vercel Git Integration

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript 5+
- **Code Formatting**: Prettier (implied)

## 📁 Структура проекта

```
domio-ops/
├── public/                      # Статические файлы
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service Worker для PWA
│   ├── icons/                  # App icons
│   └── robots.txt             # SEO
│
├── src/
│   ├── components/            # React компоненты
│   │   ├── ui/               # Base UI components (Shadcn)
│   │   ├── layout/           # Layout компоненты
│   │   ├── modern/           # Enterprise features
│   │   ├── ai/               # AI интеграции
│   │   ├── onboarding/       # Onboarding flows
│   │   ├── tasks/            # Task management
│   │   ├── finance/          # Financial modules
│   │   ├── production/       # Production management
│   │   ├── clients/          # CRM components
│   │   └── ...
│   │
│   ├── pages/                # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Tasks.tsx
│   │   ├── Finance.tsx
│   │   └── ...
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-tasks.ts
│   │   ├── use-ai-assistant.ts
│   │   └── ...
│   │
│   ├── contexts/             # React Context providers
│   │   └── AppContext.tsx
│   │
│   ├── integrations/         # External integrations
│   │   └── supabase/
│   │       ├── client.ts     # Supabase client
│   │       └── types.ts      # Generated types
│   │
│   ├── lib/                  # Utility libraries
│   │   └── utils.ts
│   │
│   ├── services/             # Business logic services
│   │   └── telegram.ts
│   │
│   ├── index.css            # Global styles & design system
│   ├── main.tsx             # App entry point
│   └── App.tsx              # Root component
│
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── ai-chat/         # AI chat endpoint
│   │   ├── ai-assistant/    # AI assistant logic
│   │   └── admin-create-user/ # User management
│   │
│   └── config.toml          # Supabase config
│
├── supabase_migration.sql   # Database schema
├── vercel.json              # Vercel config
├── tailwind.config.ts       # Tailwind config
├── vite.config.ts           # Vite config
└── package.json             # Dependencies
```

## 🎨 Design System

### Color System (HSL-based)
```css
/* Semantic colors */
--primary: 217 91% 60%      /* Brand blue */
--secondary: 263 70% 50%     /* Purple accent */
--accent: 142 76% 36%        /* Success green */
--destructive: 0 84% 60%     /* Error red */
--warning: 38 92% 50%        /* Warning orange */

/* Gradients */
--gradient-primary: linear-gradient(135deg, primary → secondary)
--gradient-mesh: multi-layer radial gradients
```

### Typography
- **Font**: System font stack (antialiased)
- **Scale**: Responsive, fluid typography
- **Features**: OpenType features enabled

### Spacing & Layout
- **Grid**: Flexbox & CSS Grid
- **Spacing**: Tailwind spacing scale
- **Breakpoints**: sm, md, lg, xl, 2xl

### Components
- **Glass morphism effects**: backdrop-blur
- **Hover animations**: lift, glow, scale
- **Transitions**: cubic-bezier easing
- **Shadows**: Layered, colored shadows

## 🔐 Безопасность

### Authentication & Authorization
```
User → Supabase Auth → JWT Token → RLS Policies
```

**Row Level Security (RLS):**
- Все таблицы защищены RLS
- Политики на уровне строк
- Role-based access control (RBAC)

**Roles:**
- `admin` - Полный доступ
- `manager` - Управление проектами
- `user` - Базовый доступ

### Data Security
- **Encryption**: HTTPS everywhere
- **JWT**: Secure token-based auth
- **RLS**: Database-level security
- **Input Validation**: Zod schemas
- **XSS Protection**: React auto-escaping
- **CSRF**: Token validation

### Edge Function Security
- JWT verification (configurable)
- CORS headers
- Input sanitization
- Secret management via Supabase Vault

## 📊 Data Flow

### Client → Server

```
Component
  ↓
Custom Hook (use-tasks.ts)
  ↓
TanStack Query (caching, invalidation)
  ↓
Supabase Client
  ↓
PostgreSQL (with RLS)
```

### Real-time Updates

```
Database Change
  ↓
Supabase Realtime
  ↓
WebSocket Connection
  ↓
React Component (auto re-render)
```

### AI Integration

```
User Input
  ↓
Edge Function (ai-chat/ai-assistant)
  ↓
Lovable AI Gateway
  ↓
Google Gemini API
  ↓
Streamed Response
  ↓
Client (SSE)
```

## 🚀 Performance Optimizations

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Vite eliminates dead code
- **Asset Optimization**: 
  - Image lazy loading
  - CSS/JS minification
  - Gzip compression
- **Caching**: 
  - TanStack Query cache
  - Service Worker cache (PWA)
  - Browser cache headers

### Backend
- **Edge Functions**: Globally distributed, low latency
- **Connection Pooling**: Supabase Postgres
- **Query Optimization**: Proper indexes
- **CDN**: Vercel Edge Network

### Database
```sql
-- Indexes на часто используемые поля
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_projects_user_id ON projects(user_id);
```

## 🔄 State Management

### Global State (Context)
```typescript
AppContext:
  - user (User | null)
  - theme (light | dark)
  - language (string)
  - signIn/signOut functions
```

### Server State (TanStack Query)
```typescript
useQuery:
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Error handling
```

### Local State
```typescript
useState: Component-level state
useReducer: Complex state logic
useRef: Mutable refs
```

## 🌐 API Structure

### REST Endpoints (Supabase)
```
GET    /rest/v1/tasks
POST   /rest/v1/tasks
PATCH  /rest/v1/tasks?id=eq.123
DELETE /rest/v1/tasks?id=eq.123
```

### Edge Functions
```
POST /functions/v1/ai-chat
POST /functions/v1/ai-assistant
POST /functions/v1/admin-create-user
```

### Real-time Channels
```typescript
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public' }, handler)
  .subscribe()
```

## 📱 Progressive Web App (PWA)

### Features
- **Offline Support**: Service Worker caching
- **Installable**: Add to Home Screen
- **Fast**: Pre-cached assets
- **Responsive**: Mobile-first design

### Service Worker Strategy
```javascript
// Network-first for API calls
// Cache-first for static assets
// Cache-then-network for dynamic content
```

## 🧪 Testing Strategy (Recommended)

### Unit Tests
- React components (React Testing Library)
- Utility functions (Jest)
- Custom hooks (React Hooks Testing Library)

### Integration Tests
- Page flows
- Form submissions
- API interactions

### E2E Tests
- Critical user journeys
- Cross-browser testing

## 📈 Monitoring & Analytics

### Performance Monitoring
- Vercel Analytics
- Web Vitals tracking
- Lighthouse CI

### Error Tracking
- Console logs
- Supabase logs
- Edge function logs

### User Analytics
- Page views
- Feature usage
- Conversion tracking

## 🔧 Configuration Management

### Environment Variables
```bash
# Frontend (.env)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# Backend (Supabase Secrets)
LOVABLE_API_KEY=
RESEND_API_KEY=
```

### Feature Flags (Future)
```typescript
{
  "ai_assistant": true,
  "video_calls": true,
  "advanced_analytics": false
}
```

## 🌍 Internationalization (i18n) (Future)

### Structure
```typescript
{
  "en": { "dashboard": "Dashboard" },
  "ru": { "dashboard": "Дашборд" }
}
```

## 🔌 Integration Points

### Current Integrations
- **Lovable AI**: AI assistant & chat
- **Supabase**: Full backend
- **Vercel**: Deployment & hosting

### Potential Integrations
- **Stripe**: Payments
- **SendGrid**: Email
- **Twilio**: SMS
- **Google Calendar**: Calendar sync
- **Slack**: Notifications

## 📦 Build & Deployment

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
# Output: dist/
```

### Deployment Flow
```
Git Push → GitHub
  ↓
Vercel Webhook
  ↓
Build (npm run build)
  ↓
Deploy to Edge Network
  ↓
Live Production URL
```

## 🎯 Scalability Considerations

### Horizontal Scaling
- Stateless edge functions
- Database connection pooling
- CDN for static assets

### Vertical Scaling
- Database upgrades (Supabase tiers)
- Function memory limits
- Vercel bandwidth limits

### Performance Targets
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1
- **TTI**: < 3s

## 🔮 Future Architecture Improvements

### Microservices
- Split edge functions into specialized services
- Independent deployment

### Caching Layer
- Redis for session storage
- API response caching

### Message Queue
- Background job processing
- Event-driven architecture

### GraphQL
- Alternative to REST
- Better data fetching

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn/ui](https://ui.shadcn.com)

---

**Архитектура DOMIO Ops спроектирована для:**
- ⚡ Высокой производительности
- 🔒 Максимальной безопасности
- 📈 Горизонтального масштабирования
- 🛠️ Легкого обслуживания
- 🚀 Быстрой разработки новых feature
