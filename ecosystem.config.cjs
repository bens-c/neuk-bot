module.exports = {
  apps: [
    {
      name: 'discord-mass-bot',
      script: './src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
