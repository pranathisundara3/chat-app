# Chat App

A real-time chat application built with React, Node.js, Express, and Socket.io. Features user authentication, real-time messaging, and profile management.

## Features

- **Real-time Messaging**: Instant messaging with Socket.io
- **User Authentication**: Secure login and registration with JWT
- **Profile Management**: Update user profiles with image uploads
- **Online Status**: See which users are online
- **Responsive Design**: Works on desktop and mobile devices
- **Image Uploads**: Cloudinary integration for profile pictures

## Tech Stack

### Frontend

- React 19
- Vite
- React Router DOM
- Socket.io Client
- Axios
- React Hot Toast

### Backend

- Node.js
- Express.js
- Socket.io
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Cloudinary for image uploads

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd chat-app
```

2. Install client dependencies:

```bash
cd client
npm install
```

3. Install server dependencies:

```bash
cd ../server
npm install
```

4. Set up environment variables:

Create a `.env` file in the server directory with:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

5. Start the server:

```bash
cd server
npm run server
```

6. Start the client (in a new terminal):

```bash
cd client
npm run dev
```

The application will be running at `http://localhost:5173` (client) and `http://localhost:5000` (server).

## Usage

1. Register a new account or login with existing credentials
2. Update your profile in the profile page
3. Start chatting with other online users
4. Messages are sent and received in real-time

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check authentication status

### Messages

- `GET /api/message/:userId` - Get messages with a specific user
- `POST /api/message/send/:userId` - Send a message to a user

### Users

- `GET /api/auth/allusers` - Get all users (excluding current user)

## Project Structure

```
chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   └── assets/         # Static assets
│   ├── public/             # Public files
│   └── package.json
├── server/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── lib/                # Utility libraries
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── server.js           # Main server file
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
