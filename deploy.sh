#!/bin/bash

# Stock Price Predictor Deployment Script
# This script helps with deploying the Stock Price Predictor application

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo -e "\n${YELLOW}==== $1 ====${NC}\n"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_section "Checking Requirements"
    
    # Check for Python
    if command -v python3 &>/dev/null; then
        print_success "Python is installed"
        python3 --version
    else
        print_error "Python is not installed"
        exit 1
    fi
    
    # Check for Node.js
    if command -v node &>/dev/null; then
        print_success "Node.js is installed"
        node --version
    else
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check for npm
    if command -v npm &>/dev/null; then
        print_success "npm is installed"
        npm --version
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check for Docker (optional)
    if command -v docker &>/dev/null; then
        print_success "Docker is installed"
        docker --version
    else
        echo "Docker is not installed (optional for containerized deployment)"
    fi
}

# Prepare the application for deployment
prepare_app() {
    print_section "Preparing Application for Deployment"
    
    # Install Python dependencies
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    pip install gevent gevent-websocket
    
    # Build the frontend
    echo "Building the frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    print_success "Application prepared for deployment"
}

# Deploy using Docker
deploy_docker() {
    print_section "Deploying with Docker"
    
    # Build the Docker image
    echo "Building Docker image..."
    docker build -t stock-price-predictor .
    
    # Run the Docker container
    echo "Running Docker container..."
    docker run -d -p 8080:8080 --name stock-price-predictor stock-price-predictor
    
    print_success "Application deployed with Docker"
    echo "The application is now running at http://localhost:8080"
}

# Deploy to Heroku
deploy_heroku() {
    print_section "Deploying to Heroku"
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &>/dev/null; then
        print_error "Heroku CLI is not installed"
        echo "Please install the Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check if logged in to Heroku
    if ! heroku whoami &>/dev/null; then
        echo "Please log in to Heroku:"
        heroku login
    fi
    
    # Create a new Heroku app if app name is provided
    if [ -n "$1" ]; then
        echo "Creating Heroku app: $1"
        heroku create $1
    else
        echo "Creating Heroku app with a random name"
        heroku create
    fi
    
    # Add buildpacks
    echo "Adding buildpacks..."
    heroku buildpacks:add heroku/python
    
    # Set environment variables
    echo "Setting environment variables..."
    heroku config:set SECRET_KEY=$(openssl rand -hex 32)
    heroku config:set DEBUG=False
    
    # Deploy to Heroku
    echo "Deploying to Heroku..."
    git push heroku main
    
    # Scale the dyno
    echo "Scaling the dyno..."
    heroku ps:scale web=1
    
    print_success "Application deployed to Heroku"
    echo "You can open the application with: heroku open"
}

# Main menu
main_menu() {
    print_section "Stock Price Predictor Deployment"
    echo "Please select a deployment option:"
    echo "1. Prepare application for deployment"
    echo "2. Deploy with Docker"
    echo "3. Deploy to Heroku"
    echo "4. Exit"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            check_requirements
            prepare_app
            main_menu
            ;;
        2)
            check_requirements
            prepare_app
            deploy_docker
            ;;
        3)
            check_requirements
            prepare_app
            read -p "Enter Heroku app name (leave blank for random name): " app_name
            deploy_heroku $app_name
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            main_menu
            ;;
    esac
}

# Start the script
main_menu 