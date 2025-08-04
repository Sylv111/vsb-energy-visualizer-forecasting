module.exports = {
  apps: [
    {
      name: 'electricity-backend',
      script: 'server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    },
    {
      name: 'electricity-frontend',
      script: 'node_modules/@vue/cli-service/bin/vue-cli-service.js',
      args: 'serve',
      cwd: './client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      }
    }
  ]
} 