module.exports = {
  apps: [
    {
      name: 'impacto-calhas-backend',
      script: 'C:/Docker/docker/impacto-calhas/backend/dist/backend/src/app.js',
      cwd: 'C:/Docker/docker/impacto-calhas/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
