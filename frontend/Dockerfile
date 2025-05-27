# frontend/Dockerfile

FROM node:20-alpine as build

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

COPY frontend/ ./

# Create .env file from environment variables
RUN echo "REACT_APP_API_URL=${REACT_APP_API_URL}" > .env

RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]