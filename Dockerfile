FROM node:18-alpine
WORKDIR /app
ADD . /app/
RUN npm install && npx prisma migrate dev -y && npm run build
EXPOSE 3000

ENTRYPOINT npm run start:prod