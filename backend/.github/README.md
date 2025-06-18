# GitHub Actions CI/CD Pipelines

This directory contains GitHub Actions workflows for continuous integration and deployment of the Run AI application.

## Workflows

### 1. Next.js Frontend CI/CD (`nextjs-ci-cd.yml`)

This workflow builds, tests, and deploys the Next.js frontend application.

Steps:
1. Build and test the Next.js application
2. Build and push a Docker image to Docker Hub
3. Deploy the application to the production server

### 2. Backend CI/CD (`backend-ci-cd.yml`)

This workflow builds, tests, and deploys the Node.js backend application.

Steps:
1. Run tests on the backend code
2. Build and push a Docker image to Docker Hub
3. Deploy the application to the production server

## Required Secrets

The following secrets need to be configured in your GitHub repository:

- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token
- `SSH_HOST`: The hostname or IP address of your production server
- `SSH_USERNAME`: The SSH username for your production server
- `SSH_PRIVATE_KEY`: The SSH private key for authentication

## How to Set Up Secrets

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the required secrets

## Deployment

The workflows will automatically deploy to production when changes are pushed to the `main` branch. 