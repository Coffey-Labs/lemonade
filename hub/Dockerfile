# The front door for games.jcoffey.dev. Static, no build step: adding a game is
# one more card in index.html.
FROM nginx:alpine
COPY hub/nginx.conf /etc/nginx/conf.d/default.conf
COPY hub/public /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
