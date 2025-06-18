# Nginx Configuration for Run AI

This directory contains the Nginx configuration files for the Run AI application.

## Directory Structure

- `conf/`: Contains the Nginx configuration files
- `ssl/`: Contains the SSL certificates for HTTPS
- `www/`: Contains static web content

## SSL Certificates

To enable HTTPS, you need to place your SSL certificates in the `ssl/` directory:

1. `fullchain.pem`: The full certificate chain
2. `privkey.pem`: The private key

You can obtain SSL certificates from Let's Encrypt using Certbot:

```bash
certbot certonly --standalone -d runaii.cloud -d www.runaii.cloud
```

Then copy the certificates to the `ssl/` directory:

```bash
cp /etc/letsencrypt/live/runaii.cloud/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/runaii.cloud/privkey.pem nginx/ssl/
```

## Configuration

The main configuration file is `conf/default.conf`. It sets up:

1. HTTP to HTTPS redirection
2. Reverse proxy for the frontend (Next.js) application
3. Reverse proxy for the backend API
4. Security headers and GZIP compression 