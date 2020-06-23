# bouncy

pipe raw http traffic from incoming http requests to remote endpoints

[![build status](https://secure.travis-ci.org/substack/bouncy.png)](http://travis-ci.org/substack/bouncy)

![trampoline](http://substack.net/images/trampoline.png)

# example

## route.js

Route requests based on the host field to servers on ports 8001 and 8002:

``` js
var bouncy = require('bouncy');

var server = bouncy(function (req, res, bounce) {
    if (req.headers.host === 'beep.example.com') {
        bounce(8001);
    }
    else if (req.headers.host === 'boop.example.com') {
        bounce(8002);
    }
    else {
        res.statusCode = 404;
        res.end('no such host');
    }
});
server.listen(8000);
```

# var server = bouncy(opts={}, cb)

`bouncy(cb)` returns a new net.Server object that you can `.listen()` on.

If you specify `opts.key` and `opts.cert`, the connection will be set to secure
mode using tls. Do this if you want to make an https router.

If the arity of `cb` is 3, you'll get the response object `res` in
`cb(req, res, bounce)`.
Otherwise you just get `cb(req, bounce)`.

If you are using more than one SSL cert, add `opts.SNICallback`.
See the example http-https-sni.js and the
[nodejs tls page](http://nodejs.org/api/tls.html#tls_tls_createserver_options_secureconnectionlistener)
for details.

## bounce(stream, opts={})

Call this function when you're ready to bounce the request to a stream.

The exact request that was received will be written to `stream` and future
incoming data will be piped to and from it.

To send data to a different url path on the destination stream, you can specify
`opts.path`.

To change the http verb you can set `opts.method`.

You can specify header fields to insert into the request with `opts.headers`.

`bounce()` returns the stream object that it uses to connect to the remote host.

## bounce(port, ...), bounce(host, port, ...), bounce(url)

These variants of `bounce()` are sugar for
`bounce(net.connect(port))` and `bounce(net.connect(port, host))`.

Optionally you can pass port and host keys to `opts` and it does the same thing.

Passing `bounce()` a string that looks like a url (with or without `"http://"`)
will set the opts.host, opts.port, and opts.path accordingly.

# usage

```
usage: bouncy FILE PORT

Create a routes FILE like this:

  {
    "beep.example.com" : 8000,
    "boop.example.com" : 8001
  }

Then point the `bouncy` command at this `routes.json` file and give it
a port to listen on: 

  bouncy routes.json 80

The `routes.json` file should just map host names to host/port combos. Use a
colon-separated string to specify a host and port in a route.

Use `""` for the host as a default route.

You can optionally specify a listen address as the third parameter or with
`--address`. It defaults to `0.0.0.0`. Specify `::` to listen on both IPv4 and
IPv6 addresses.
```

# install

With [npm](http://npmjs.org), to get the library do:

```
npm install bouncy
```

or to install the command-line tool do:

```
npm install -g bouncy
```

# license

MIT
