#!/usr/bin/env bash

function execute() {
    clear
    echo "$@"
    eval "$@"
}

execute "$@"

inotifywait --quiet --recursive --monitor --event modify --format "%w%f" . \
| while read change; do
    execute "$@"
done

