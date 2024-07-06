server {
    listen 80;
    server_name 192.168.111.142;  # Replace with your domain name or IP
    return 301 https://$host$request_uri;

    location / {
        include proxy_params;
        try_files $uri /index.html;
        root /home/a/sock_clint/ui;
        index index.html;
        uwsgi_pass  unix:///home/a/sock_clint/myproject.sock;
        include /home/a/sock_clint/uwsgi_params;  # uWSGI parameters
    }

    location /static {
        alias /home/a/sock_clint/ui/static;
    }
}
server {
    listen 8080;
    server_name 192.168.111.142;  # Replace with your domain name or IP
    return 301 https://$host$request_uri;

    location / {
        include proxy_params;
        try_files $uri /index.html;
        root /home/a/sock_clint/ui;
        index index.html;
        include /home/a/sock_clint/uwsgi_params;  # uWSGI parameters
    }

    location /static {
        alias /home/a/sock_clint/ui/static;
    }
}
# WebSocket and API Server Block (Separate Port)
server {
    listen 8081 ssl;
    server_name 192.168.111.142;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';

location /ws {
        proxy_pass http://localhost:8082;  # Adjust this if your WebSocket server runs on another port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /api {
         include proxy_params;
        uwsgi_pass  unix:///home/a/sock_clint/myproject.sock;
        include /home/a/sock_clint/uwsgi_params;
    }
}
# HTTPS Server Block
server {
    listen 443 ssl;
    server_name 192.168.111.142;  # Replace with your domain name or IP address

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH';

    location / {
        include proxy_params;
        try_files $uri /index.html;
        root /home/a/sock_clint/ui;
        index index.html;
        uwsgi_pass  unix:///home/a/sock_clint/myproject.sock;
        include /home/a/sock_clint/uwsgi_params;
    }

    location /static {
        alias /home/a/sock_clint/ui/static;
    }

location /ws {
        proxy_pass http://localhost:8082;  # Adjust this if your WebSocket server runs on another port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    
    }
}
