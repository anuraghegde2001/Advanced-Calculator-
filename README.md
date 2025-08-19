# Advanced Calculator with Database Integration

A modern, full-stack web calculator application that provides basic arithmetic operations with persistent calculation history stored in a MySQL database. Built with Express.js backend and vanilla JavaScript frontend.

## Features

### Core Calculator Functions
- **Basic Arithmetic**: Addition (+), Subtraction (-), Multiplication (*), Division (/)
- **Real-time Display**: Live input display with immediate feedback
- **Keyboard Support**: Full keyboard input support for enhanced usability
- **Error Handling**: Division by zero protection and input validation
- **Responsive Design**: Mobile-friendly interface that adapts to different screen sizes

### Database Integration
- **Persistent History**: All calculations are automatically saved to MySQL database
- **Session Management**: Unique session tracking for individual users
- **History Panel**: View and interact with previous calculations
- **Statistics Tracking**: Monitor calculation patterns and usage statistics

### User Interface
- **Modern Design**: Clean, gradient-based UI with glassmorphism effects
- **History Toggle**: Expandable side panel for calculation history
- **Visual Feedback**: Hover effects and smooth transitions
- **Clear/Delete Functions**: Easy input management and history clearing

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with flexbox, grid, and CSS variables
- **Vanilla JavaScript**: ES6+ features, async/await, and DOM manipulation

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework for API routes
- **MySQL2**: Database driver with promise support
- **CORS**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advanced-calculator-db
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=calculator_app
   PORT=3000
   NODE_ENV=development
   ```

4. **Setup the database**
   ```bash
   # Create database and tables
   npm run setup-db
   
   # Or manually run the schema
   mysql -u root -p < database/schema.sql
   ```

5. **Start the application**
   ```bash
   # Production mode
   npm start
   
   # Development mode with auto-reload
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
advanced-calculator-db/
├── backend/
│   └── server.js           # Express server with API routes
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── script.js           # Calculator logic and API integration
│   └── styles.css          # Styling and responsive design
├── database/
│   └── schema.sql          # MySQL database schema
├── package.json            # Project configuration and dependencies
├── .env                    # Environment variables (create this)
└── README.md              # Project documentation
```

## API Endpoints

### Session Management
- `POST /api/session` - Initialize a new user session
- **Body**: `{ "sessionId": "unique_session_id" }`

### Calculations
- `POST /api/calculations` - Save a new calculation
- **Body**: `{ "sessionId": "session_id", "expression": "2 + 3", "result": "5", "operationType": "+" }`

- `GET /api/calculations/:sessionId` - Retrieve calculation history
- **Query Parameters**: `limit` (optional, default: 50)

- `DELETE /api/calculations/:sessionId` - Clear calculation history

### Statistics
- `GET /api/stats/:sessionId` - Get calculation statistics
- **Returns**: Total calculations, operation counts, date ranges

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Calculations Table
```sql
CREATE TABLE calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    expression VARCHAR(500) NOT NULL,
    result VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Usage

### Calculator Operations
1. **Basic Calculations**: Click number buttons and operators or use keyboard input
2. **Keyboard Shortcuts**:
   - Numbers: `0-9`, decimal point: `.`
   - Operators: `+`, `-`, `*`, `/`
   - Calculate: `Enter` or `=`
   - Clear: `Escape`
   - Delete: `Backspace`

3. **History Panel**: Click the "History" button to view previous calculations
4. **Clear History**: Use the "Clear" button in the history panel to remove all saved calculations

### API Usage
```javascript
// Initialize session
const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: 'your_session_id' })
});

// Save calculation
await fetch('/api/calculations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        sessionId: 'your_session_id',
        expression: '5 + 3',
        result: '8',
        operationType: '+'
    })
});
```

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run setup-db` - Initialize database schema
- `npm test` - Run test suite
- `npm run lint` - Run ESLint code analysis

### Development Guidelines
1. Follow ES6+ JavaScript standards
2. Use async/await for asynchronous operations
3. Implement proper error handling
4. Maintain responsive design principles
5. Write meaningful commit messages

## Testing

Run the test suite:
```bash
npm test
```

For manual testing:
1. Verify all calculator operations work correctly
2. Test keyboard input functionality
3. Check history persistence across sessions
4. Validate responsive design on different screen sizes
5. Test error scenarios (division by zero, invalid input)

## Deployment

### Production Considerations
1. **Environment Variables**: Ensure all required environment variables are set
2. **Database Security**: Use strong passwords and limit database access
3. **HTTPS**: Enable SSL/TLS in production
4. **Process Management**: Use PM2 or similar for process management
5. **Monitoring**: Implement logging and monitoring solutions

### Docker Deployment (Optional)
Create a `Dockerfile` for containerized deployment:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues
1. **Database Connection Errors**: Verify MySQL is running and credentials are correct
2. **Port Conflicts**: Change the PORT environment variable if 3000 is occupied
3. **Frontend Not Loading**: Check that static file serving is properly configured
4. **History Not Saving**: Verify database tables are created and accessible

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Support

For issues, questions, or contributions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include error messages, browser information, and steps to reproduce

## Changelog

### Version 1.0.0
- Initial release with basic calculator functionality
- Database integration for calculation history
- Session management system
- Responsive web design
- API endpoints for all major operations

---

**Built with ❤️ using Node.js, Express, and MySQL**
