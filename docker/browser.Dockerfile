FROM node:21.0.0 as browser
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
RUN pnpm run check-types:browser
# Run testing
RUN pnpm run test:browser
# Run dist packages
RUN pnpm run build:browser