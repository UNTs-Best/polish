# Polish - AI-Powered Document Editor

## Overview

Polish is a modern web application that leverages artificial intelligence to help users create, edit, and polish professional documents like resumes, cover letters, and other business documents. The app features real time inline editing capabilities and seamless export functionality to multiple formats.

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polish.git
   cd polish
   ```

2. **Install dependencies using docker**
   ```bash
   docker compose
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your OpenAI API key to `.env.local`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   docker run
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run linting
npm run lint
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
