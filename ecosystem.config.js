module.exports = {
  apps : [
  {
    name: 'mosca',
    script: 'index.js',
	cwd: './mosca'
  }
  ,
  {
    name: 'hermod',
    script: 'npm run test',
  //  interpreter: 'nodemon',
	cwd: './hermod-nodejs'
  }
  
  ]
};
