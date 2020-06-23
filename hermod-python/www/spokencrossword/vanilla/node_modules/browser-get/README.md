# browser-get [![Build Status](https://secure.travis-ci.org/contolini/browser-get.png?branch=master)](http://travis-ci.org/contolini/browser-get)

> IE8+ compatible GET requests for the browser. Includes an ES6 promise polyfill.

## Installation

Grab the `dist/browser-get.js` file and include it at the bottom of your page:

```html
<script src="browser-get.js"></script>
```

Or use [Browserify](http://browserify.org/):

```sh
npm install browser-get --save
var get = require('browser-get');
```

## Usage

```js

// Returns an ES6 promise.
var promise = get('foo/bar/something-or-other.whatever');

// When request completes.
promise.then(function( resp ){
  console.log( resp );
});

// If request fails.
promise.catch(function( resp ){
  console.log( resp );
});

```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 Chris Contolini  
Licensed under the MIT license.
