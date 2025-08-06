# StudyBuddy API Documentation

This directory contains the complete API documentation for the StudyBuddy backend application.

## Files

- `swagger.yaml` - Complete OpenAPI 3.0 specification for the StudyBuddy API

## How to Use

### Option 1: Swagger UI (Recommended)

1. **Online Swagger Editor:**
   - Go to [https://editor.swagger.io/](https://editor.swagger.io/)
   - Copy the contents of `swagger.yaml` and paste it into the editor
   - The documentation will be rendered with an interactive interface

2. **Local Swagger UI:**
   - Install Swagger UI locally or use a Docker container
   - Serve the `swagger.yaml` file through Swagger UI

### Option 2: VS Code Extension

1. Install the "Swagger Viewer" extension in VS Code
2. Open the `swagger.yaml` file
3. Use the command palette (Ctrl/Cmd + Shift + P) and run "Swagger: Preview"

### Option 3: Redoc

1. Go to [https://redocly.github.io/redoc/](https://redocly.github.io/redoc/)
2. Enter the URL to your `swagger.yaml` file or paste the content

## API Overview

The StudyBuddy API provides the following functionality:

### Authentication
- **POST /auth/login** - User login
- **POST /auth/register** - User registration (Admin only)

### Chat Features
- **GET /chat** - Get AI-powered educational responses
- **GET /chat/chat-history** - Retrieve chat history
- **GET /chat/heat-map** - Get chat activity data for visualization
- **GET /chat/chat-streak** - Get user's learning streak

### User Management
- **GET /users** - Get all users (Admin only)
- **PUT /users** - Update user (Admin only)
- **DELETE /users** - Delete user (Admin only)
- **POST /users/user-details** - Create user profile details
- **GET /users/user-details** - Get user profile details
- **PUT /users/user-details** - Update user profile details
- **GET /users/subjects** - Get all subjects for users
- **GET /users/quizzes** - Get quizzes for users with filtering

### Leaderboard
- **GET /leaderboard** - Get leaderboard rankings with filtering
- **GET /leaderboard/user-rank** - Get current user's rank and stats
- **GET /leaderboard/search** - Search users in leaderboard
- **GET /leaderboard/top-performers** - Get top 3 performers for podium view

### Feedback System
- **POST /feedback** - Submit feedback
- **GET /feedback/my-feedbacks** - Get user's feedback
- **GET /feedback/my-feedbacks/{id}** - Get specific feedback
- **GET /feedback/admin** - Get all feedback (Admin only)
- **GET /feedback/admin/{id}** - Get feedback by ID (Admin only)
- **PUT /feedback/admin/{id}** - Update feedback status (Admin only)
- **DELETE /feedback/admin/{id}** - Delete feedback (Admin only)

### Admin - Subject Management
- **GET /admin/subjects** - Get all subjects
- **POST /admin/subjects** - Create subject
- **GET /admin/subjects/{id}** - Get subject by ID
- **PUT /admin/subjects/{id}** - Update subject
- **DELETE /admin/subjects/{id}** - Delete subject

### Admin - Topic Management
- **POST /admin/topics** - Add topic to subject
- **PUT /admin/topics** - Update topic
- **DELETE /admin/topics** - Delete topic

### Admin - Quiz Management
- **GET /admin/quizzes** - Get all quizzes with filtering
- **POST /admin/quizzes** - Create quiz
- **GET /admin/quizzes/{id}** - Get quiz by ID
- **PUT /admin/quizzes/{id}** - Update quiz
- **DELETE /admin/quizzes/{id}** - Delete quiz

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Admin Endpoints

Some endpoints require admin privileges. These are clearly marked in the documentation with "Admin only" in the summary.

## Server Configuration

- **Development Server:** http://localhost:3000
- **Production Server:** https://api.studybuddy.com (update as needed)

## Data Models

The API uses the following main data models:

- **User** - User account information
- **UserDetails** - Extended user profile information
- **ChatHistory** - Chat conversation history
- **Subject** - Educational subjects
- **Topic** - Topics within subjects
- **Quiz** - Quiz questions and answers
- **Feedback** - User feedback and support tickets

## Error Handling

All endpoints return standardized error responses with:
- `message` - Human-readable error description
- `statusCode` - HTTP status code
- `error` - Error type/category

## Rate Limiting

Please refer to the server configuration for any rate limiting policies that may be in place.

## Support

For API support, please contact: support@studybuddy.com
