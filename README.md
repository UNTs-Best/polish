# Polish - AI-Powered Document Editor

## Overview

Polish is a modern web application that leverages artificial intelligence to help users create, edit, and polish professional documents like resumes, cover letters, and other business documents. The app features real-time inline editing capabilities and seamless export functionality to multiple formats.

## Key Features

### 🤖 AI-Powered Content Generation
- **Smart Document Creation**: Generate professional documents from scratch using AI
- **Content Suggestions**: Get intelligent suggestions for improving existing content
- **Style Optimization**: AI-powered recommendations for better formatting and structure
- **Grammar and Tone Enhancement**: Automatic grammar checking and tone adjustments

### ✏️ Advanced Inline Editing
- **Real-time Editing**: Edit documents directly with instant visual feedback
- **Rich Text Formatting**: Full formatting capabilities including bold, italic, lists, and more
- **Collaborative Editing**: Multiple users can edit documents simultaneously
- **Version History**: Track changes and revert to previous versions

### 📄 Document Templates
- **Professional Templates**: Pre-built templates for resumes, cover letters, and business documents
- **Customizable Layouts**: Easily modify templates to match your personal style
- **Industry-Specific Options**: Templates tailored for different industries and roles

### 📤 Export Capabilities
- **Multiple Formats**: Export to PDF, DOCX, HTML, and plain text
- **Custom Styling**: Maintain formatting and styling across all export formats
- **Batch Export**: Export multiple documents at once
- **Cloud Integration**: Save directly to Google Drive, Dropbox, and other cloud services

### 💾 Data Management
- **Local Storage**: Save documents locally for offline access
- **Cloud Backup**: Automatic cloud backup for data security
- **Document Organization**: Organize documents with folders and tags
- **Search Functionality**: Quickly find documents using full-text search

## Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS for responsive design
- **Language**: TypeScript for type safety
- **AI Integration**: OpenAI GPT API for content generation
- **Export**: PDF generation with jsPDF, DOCX with docx.js
- **Storage**: Local storage with IndexedDB, cloud storage integration
- **Testing**: Jest for unit tests, Playwright for E2E testing

## Project Structure

```
polish/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── editor/         # Document editor components
│   │   ├── ui/             # Basic UI components
│   │   ├── layout/         # Layout components
│   │   └── export/         # Export-related components
│   ├── pages/              # Application pages
│   │   ├── dashboard/      # Main dashboard
│   │   ├── editor/         # Document editor page
│   │   └── templates/      # Template selection page
│   ├── services/           # Business logic services
│   │   ├── ai/             # AI service integration
│   │   ├── export/         # Export functionality
│   │   └── storage/        # Data storage services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── styles/             # CSS styles
├── tests/                  # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Documentation
│   ├── api/                # API documentation
│   └── user-guide/         # User guides
└── config/                 # Configuration files
```

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polish.git
   cd polish
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## Usage

### Creating a New Document

1. **Start from a Template**: Choose from professional templates for resumes, cover letters, or business documents
2. **AI Generation**: Use the AI assistant to generate initial content based on your requirements
3. **Inline Editing**: Edit content directly in the document with real-time formatting
4. **AI Suggestions**: Get suggestions for improvements, better wording, or formatting
5. **Export**: Save your document in your preferred format (PDF, DOCX, etc.)

### AI Features

- **Content Generation**: Describe what you need, and AI will generate professional content
- **Style Suggestions**: Get recommendations for improving document structure and flow
- **Grammar Enhancement**: Automatic grammar and spelling corrections
- **Tone Adjustment**: Modify the tone of your document (professional, casual, formal, etc.)
- **Job Description Keyword Adder**: Modify your resume to specific job descriptions adding nessecary keywords

### Export Options

- **PDF**: High-quality PDF export with preserved formatting
- **DOCX**: Microsoft Word compatible format
- **HTML**: Web-friendly format for online sharing
- **Plain Text**: Simple text format for basic use

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

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

## Support

- **Documentation**: Check our [user guide](docs/user-guide/getting-started.md)
- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/yourusername/polish/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/yourusername/polish/discussions)

## Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced AI writing styles
- [ ] Integration with job boards
- [ ] Mobile app development
- [ ] Advanced analytics and insights
- [ ] Custom AI model training

---

**Made with ❤️ for better document creation**
