#!/bin/bash
apt-get update

wget -qO- https://get.haskellstack.org/ | sh

#apt-get update && \
    #apt-get install -y --no-install-recommends gnupg ca-certificates dirmngr curl git && \
    #echo 'deb http://downloads.haskell.org/debian stretch main' > /etc/apt/sources.list.d/ghc.list && \
    #apt-key adv --keyserver keyserver.ubuntu.com --recv-keys BA3CBA3FFE22B574 && \
    #apt-get update && \
    #apt-get install -y --no-install-recommends ghc-8.6.3 cabal-install-2.4 \
        #zlib1g-dev libtinfo-dev libsqlite3-dev g++ netbase xz-utils make && \
    #curl -fSL https://github.com/commercialhaskell/stack/releases/download/v1.9.1/stack-1.9.1-linux-x86_64.tar.gz -o stack.tar.gz && \
    #curl -fSL https://github.com/commercialhaskell/stack/releases/download/v1.9.1/stack-1.9.1-linux-x86_64.tar.gz.asc -o stack.tar.gz.asc && \
    #export GNUPGHOME="$(mktemp -d)" && \
    #gpg --batch --keyserver ha.pool.sks-keyservers.net --recv-keys C5705533DA4F78D8664B5DC0575159689BEFB442 && \
    #gpg --batch --verify stack.tar.gz.asc stack.tar.gz && \
    #tar -xf stack.tar.gz -C /usr/local/bin --strip-components=1 && \
    #/usr/local/bin/stack config set system-ghc --global true && \
    #/usr/local/bin/stack config set install-ghc --global false && \
    #rm -rf "$GNUPGHOME" /var/lib/apt/lists/* /stack.tar.gz.asc /stack.tar.gz
    
#export PATH=/root/.cabal/bin:/root/.local/bin:/opt/cabal/2.4/bin:/opt/ghc/8.6.3/bin:$PATH

apt-get install -qq -y libpcre3 libpcre3-dev build-essential --fix-missing --no-install-recommends  

rm -rf /var/lib/apt/lists/*

mkdir /log
git clone https://github.com/RasaHQ/duckling.git
mkdir build
cp duckling/stack.yaml build/
cd build 
stack setup
cp -a ../duckling/* .
stack install
