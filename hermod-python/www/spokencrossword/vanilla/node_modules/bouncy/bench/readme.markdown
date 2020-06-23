Tests performed on node 0.8.12 on a dual core 1.6 GHz AMD E-350.

## tests performed

* T0. serve the string "beep boop"
* T1. serve a 4 M in-memory buffer

All tests run with `ab -n 5000 -c 10`.

## results

## raw http server on 0.8.12 with no proxying and no header insertion

### T0

```
Requests per second:    2558.10 [#/sec] (mean)
Time per request:       3.909 [ms] (mean)
Time per request:       0.391 [ms] (mean, across all concurrent requests)
Transfer rate:          217.34 [Kbytes/sec] received
```

### T1

```
Requests per second:    135.47 [#/sec] (mean)
Time per request:       73.816 [ms] (mean)
Time per request:       7.382 [ms] (mean, across all concurrent requests)
Transfer rate:          554903.05 [Kbytes/sec] received
```

## [http-proxy](https://github.com/nodejitsu/node-http-proxy)

### T0

```
Requests per second:    537.30 [#/sec] (mean)
Time per request:       18.612 [ms] (mean)
Time per request:       1.861 [ms] (mean, across all concurrent requests)
Transfer rate:          45.65 [Kbytes/sec] received
```

### T1

```
Requests per second:    36.72 [#/sec] (mean)
Time per request:       272.327 [ms] (mean)
Time per request:       27.233 [ms] (mean, across all concurrent requests)
Transfer rate:          150410.37 [Kbytes/sec] received
```

## bouncy

### T0

```
Requests per second:    522.69 [#/sec] (mean)
Time per request:       19.132 [ms] (mean)
Time per request:       1.913 [ms] (mean, across all concurrent requests)
Transfer rate:          44.41 [Kbytes/sec] received
```

### T1

```
Requests per second:    38.03 [#/sec] (mean)
Time per request:       262.985 [ms] (mean)
Time per request:       26.298 [ms] (mean, across all concurrent requests)
Transfer rate:          155753.29 [Kbytes/sec] received
```
