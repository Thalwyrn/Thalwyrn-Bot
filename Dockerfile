FROM node:latest

# # Install Yarn
# RUN npm install -g yarn

# Install FFmpeg & redis
RUN apt-get update && \
  apt-get install -y ffmpeg

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./


# Install the dependencies
RUN yarn install

# Copy the rest of the application files
COPY . .

# Set the command to start the app
CMD [ "npx", "tsx", "src/Bot.ts" ]