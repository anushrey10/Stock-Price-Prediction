# Deployment Guide for Stock Price Predictor

This guide provides instructions for deploying the Stock Price Predictor application to various cloud platforms. The application consists of a Flask backend and a React frontend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Preparing for Deployment](#preparing-for-deployment)
3. [Deployment Options](#deployment-options)
   - [Option 1: Deploying to Heroku](#option-1-deploying-to-heroku)
   - [Option 2: Deploying to AWS](#option-2-deploying-to-aws)
   - [Option 3: Deploying to Render](#option-3-deploying-to-render)
   - [Option 4: Deploying with Docker](#option-4-deploying-with-docker)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Git installed
- Node.js and npm installed (for frontend)
- Python 3.8+ installed (for backend)
- Account on your chosen cloud platform (Heroku, AWS, Render, etc.)
- Cloud platform CLI tools installed (if applicable)

## Preparing for Deployment

### 1. Backend Preparation

1. Create a `Procfile` in the project root:

```
web: gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 backend.app:app
```

2. Install additional dependencies:

```bash
pip install gevent gevent-websocket
pip freeze > requirements.txt
```

3. Update the backend to use environment variables for configuration:

```python
# In backend/app.py
import os
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key')
socketio = SocketIO(app, cors_allowed_origins="*")

# Update port configuration
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    socketio.run(app, debug=os.environ.get('DEBUG', 'True') == 'True', 
                 host='0.0.0.0', port=port)
```

### 2. Frontend Preparation

1. Update the API service to use relative URLs or environment variables:

```javascript
// In frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

2. Update the WebSocket connection in App.js:

```javascript
// In frontend/src/App.js
const socketUrl = process.env.REACT_APP_SOCKET_URL || window.location.origin;
const newSocket = io(socketUrl);
```

3. Build the frontend for production:

```bash
cd frontend
npm run build
```

## Deployment Options

### Option 1: Deploying to Heroku

#### Backend and Frontend Together

1. Create a new Heroku app:

```bash
heroku create stock-price-predictor
```

2. Add buildpacks:

```bash
heroku buildpacks:add heroku/python
```

3. Configure environment variables:

```bash
heroku config:set SECRET_KEY=your-secret-key
heroku config:set DEBUG=False
```

4. Deploy the application:

```bash
git push heroku main
```

5. Scale the dyno:

```bash
heroku ps:scale web=1
```

6. Open the application:

```bash
heroku open
```

### Option 2: Deploying to AWS

#### Backend on AWS Elastic Beanstalk

1. Initialize Elastic Beanstalk:

```bash
eb init -p python-3.8 stock-price-predictor
```

2. Create an environment:

```bash
eb create stock-price-predictor-env
```

3. Configure environment variables:

```bash
eb setenv SECRET_KEY=your-secret-key DEBUG=False
```

4. Deploy the application:

```bash
eb deploy
```

#### Frontend on AWS Amplify

1. Connect your repository to AWS Amplify
2. Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/build
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. Configure environment variables in the Amplify Console

### Option 3: Deploying to Render

#### Backend on Render

1. Create a new Web Service
2. Connect your repository
3. Configure the service:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 backend.app:app`
4. Add environment variables

#### Frontend on Render

1. Create a new Static Site
2. Connect your repository
3. Configure the service:
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`
4. Add environment variables

### Option 4: Deploying with Docker

1. Create a `Dockerfile` in the project root:

```dockerfile
FROM node:16 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
COPY --from=frontend-build /app/frontend/build /app/frontend/build

EXPOSE 8080
CMD gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 -b 0.0.0.0:8080 backend.app:app
```

2. Create a `.dockerignore` file:

```
venv/
node_modules/
.git/
__pycache__/
*.pyc
*.pyo
*.pyd
```

3. Build and run the Docker image:

```bash
docker build -t stock-price-predictor .
docker run -p 8080:8080 -e SECRET_KEY=your-secret-key -e DEBUG=False stock-price-predictor
```

## Environment Variables

Configure these environment variables for your deployment:

- `SECRET_KEY`: A secret key for the Flask application
- `DEBUG`: Set to 'False' in production
- `PORT`: The port to run the application on (set by the platform in most cases)
- `REACT_APP_API_URL`: The URL of the backend API (for separate deployments)
- `REACT_APP_SOCKET_URL`: The URL for WebSocket connections (for separate deployments)

## Post-Deployment Steps

1. Verify the application is running correctly
2. Set up monitoring and logging
3. Configure a custom domain (if applicable)
4. Set up SSL/TLS certificates

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failures**
   - Ensure your deployment platform supports WebSockets
   - Check CORS settings and allowed origins

2. **Missing Dependencies**
   - Verify all dependencies are in requirements.txt
   - Check for platform-specific dependencies

3. **Environment Variable Issues**
   - Confirm all required environment variables are set
   - Check for typos in variable names

4. **Build Failures**
   - Check build logs for errors
   - Ensure compatible Node.js and Python versions

For additional help, refer to the documentation of your chosen deployment platform. 