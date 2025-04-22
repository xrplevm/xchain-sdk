FROM node:21.0.0 as node 
WORKDIR /project
# Install pnpm
RUN npm install -g pnpm@9.7.0
# Install package and app dependencies
COPY . .
RUN pnpm install
COPY [".prettierrc", "./"]
# Run linting
RUN pnpm run lint
# Run checking types
RUN pnpm run check-types:node
# Run testing
RUN pnpm run test:node
# Run dist packages
RUN pnpm run build:node