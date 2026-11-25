module.exports = {
  apps: [
    {
      name: 'whitehouse-crm-backend',
      script: './backend/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-backend-error.log',
      out_file: './logs/pm2-backend-out.log',
      merge_logs: true,
    },
  ],
};
