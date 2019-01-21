1. Run docker-compose up -d
2. Go to http://localhost:8000/wp-admin/
3. Enter site info
4. Log in
5. Go to Settings > Permalinks
6. Select a scheme other than "Plain" (to enable clean JSON URLs)
7. Go to Plugins page
8. Search for, install, and activate "Proxy Cache Purge" plugin
9. Search for, install, and activate "FakerPress" plugin


docker exec server_wordpress_1 php -r "echo gethostbyname('node');"
