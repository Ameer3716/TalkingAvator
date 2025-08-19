# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install system-level dependencies, including ffmpeg
# This is the step Vercel cannot do
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install app dependencies
RUN yarn install --production

# Copy the rest of your backend application code into the container
COPY . .

# Make the Rhubarb binary executable
# This is a critical step
RUN chmod +x ./bin/rhubarb

# Make port 3000 available to the world outside this container
# Railway will automatically use this port
EXPOSE 3000

# Define the command to run your app
CMD ["node", "server.js"]