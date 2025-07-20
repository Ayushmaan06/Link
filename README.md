# Link Saver + Auto Summary

A modern web application for saving, organizing, and automatically summarizing your favorite links with AI-powered content analysis.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 🔖 **Bookmark Management** - Save and organize links with ease
- 🤖 **AI-Powered Summaries** - Automatic content summarization using Groq AI
- 🏷️ **Tag System** - Organize bookmarks with custom tags
- 🎯 **Drag & Drop Reordering** - Intuitive bookmark organization
- 🌓 **Dark/Light Mode** - Theme switching support
- 📱 **Responsive Design** - Works on all devices
- 🔍 **Tag Filtering** - Filter bookmarks by tags
- 🎨 **Modern UI** - Clean interface with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with bcryptjs
- **AI Integration**: Groq SDK for content summarization
- **Styling**: Tailwind CSS with HeadlessUI components
- **Icons**: Heroicons
- **Drag & Drop**: @dnd-kit
- **Type Safety**: TypeScript with Zod validation
- **Deployment**: Vercel-ready configuration

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm or yarn
- PostgreSQL database

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd link
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/link_saver"
   
   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key"
   
   # Groq AI API Key (for summaries)
   GROQ_API_KEY="your-groq-api-key"
   ```

4. **Set up the database**
   ```bash
   # Push the schema to your database
   npm run db:push
   
   # Generate Prisma client
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run validate-env` - Validate environment variables

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── bookmarks/     # Bookmark CRUD operations
│   ├── dashboard/         # Main dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── AddBookmarkForm.tsx
│   ├── AuthForm.tsx
│   ├── BookmarkCard.tsx
│   ├── TagFilter.tsx
│   └── ThemeProvider.tsx
├── lib/                  # Utility libraries
│   ├── auth.ts           # Auth utilities
│   ├── middleware.ts     # Auth middleware
│   ├── prisma.ts         # Database client
│   └── utils.ts          # General utilities
├── prisma/               # Database schema and migrations
├── types/                # TypeScript type definitions
└── scripts/              # Build and utility scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Bookmarks
- `GET /api/bookmarks` - Get user's bookmarks
- `POST /api/bookmarks` - Create new bookmark
- `PUT /api/bookmarks/[id]` - Update bookmark
- `DELETE /api/bookmarks/[id]` - Delete bookmark
- `GET /api/bookmarks/[id]/summary` - Get bookmark summary
- `POST /api/bookmarks/reorder` - Reorder bookmarks

## Features in Detail

### Bookmark Management
- Add bookmarks by URL with automatic metadata extraction
- Automatic favicon fetching
- Custom tagging system
- Drag-and-drop reordering

### AI Summaries
- Automatic content summarization using Groq AI
- Smart content extraction from web pages
- Summary caching to avoid redundant API calls

### User Experience
- Responsive design for all devices
- Dark/light theme toggle
- Intuitive drag-and-drop interface
- Real-time filtering by tags

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `GROQ_API_KEY` | Groq AI API key for summaries | Yes |

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## Database Schema

### Users Table
- `id` - Unique identifier
- `email` - User email (unique)
- `password` - Hashed password
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Bookmarks Table
- `id` - Unique identifier
- `title` - Bookmark title
- `url` - Bookmark URL
- `favicon` - Favicon URL
- `summary` - AI-generated summary
- `tags` - Array of tags
- `order` - Sort order
- `userId` - Associated user ID
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.
