/*
 * browser-get
 * http://github.com/contolini/browser-get
 *
 * Copyright (c) 2014 Chris Contolini
 * Licensed under the MIT license.
 */

'use strict';

var Promise = require('es6-promise').Promise;

var get = function( url, verb ) {

  return new Promise(function( resolve, reject ) {

    var req = new XMLHttpRequest();
    req.open( verb || 'GET', url, true );

    req.onreadystatechange = function() {
      if ( this.readyState === 4 ){
        if ( this.status >= 200 && this.status < 400 ){
          resolve( req.responseText );
        } else {
          reject( new Error( req.statusText ) );
        }
      }
    };

    req.send();

  });

};

module.exports = get;
