module.exports = {
  apps: [
    {
      name: 'did-driver',
      script: 'src/server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env_file: '.env',
      error_file: '/var/log/did-driver/error.log',
      out_file: '/var/log/did-driver/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
