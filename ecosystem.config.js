module.exports = {
  apps : [
  {
    name: 'mosca',
    script: 'index.js',
	cwd: './mosca'
  }
  ,
  {
    name: 'mongodb',
    script: 'run.sh',
	cwd: './mongodb'
  }
  ,
  {
    name: 'hermod-react-satellite',
    script: 'npm start',
	cwd: './hermod-react-satellite'
  }
  ,
  {
    name: 'browser-example',
    script: 'npm start',
	cwd: './browser-example'
  }
  ,
  {
    name: 'duckling',
    script: 'run.sh',
	cwd: './duckling'
  }
  ,
  {
    name: 'rasa-nlu',
    script: 'rasa-nlu.sh',
	cwd: './rasa'
  }
  ,
  {
    name: 'rasa-core',
    script: 'rasa-core.sh',
	cwd: './rasa'
  }
  ,
  {
    name: 'rasa-actions',
    script: 'rasa-actions.sh',
	cwd: './rasa'
  }
  ,
  {
    name: 'hermod',
    script: 'index.js',
    interpreter: 'nodemon',
	cwd: './hermod-nodejs'
  }
  
  ]
  //,

  //deploy : {
    //production : {
      //user : 'node',
      //host : '212.83.163.1',
      //ref  : 'origin/master',
      //repo : 'git@github.com:repo.git',
      //path : '/var/www/production',
      //'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    //}
  //}
};
