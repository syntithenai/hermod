# must be in root vanilla folder
# create in vanilla folder
browserify -v -o static/bundle.js index.js
# copy to react source folder
cp static/bundle.js ../src/hermodwebclient.js
