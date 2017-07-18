module.exports = {
  apps: [{
    name: 'tutorial-2',
    script: './index.js'
  }],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'ec2-13-58-116-193.us-east-2.compute.amazonaws.com',
      key: '~/.ssh/hoangxcao.pem',
      ref: 'origin/master',
      repo: 'git@github.com:hoangxcao/nodejs-source-code.git',
      path: '/home/ubuntu/tutorial-2',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js'
    }
  }
}
