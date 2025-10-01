module.exports = {
  apps: [{
    name: 'budget-app',
    script: 'node_modules\\.bin\\next.cmd',
    args: 'start',
    cwd: 'D:\\budget-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false
  }]
};