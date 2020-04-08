#1
#openssl req -x509 -newkey rsa:4096 -keyout ./certs/key.pem -out ./certs/cert.pem -days 365 -nodes -subj '/CN=localhost'

#2
#openssl req -x509 -out ./certs/cert.pem -keyout ./certs/key.pem \
  #-newkey rsa:2048 -nodes -sha256 \
  #-subj '/CN=localhost' -extensions EXT -config <( \
   #printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")


#3
# RootCA
#openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout ./certs/RootCA.key -out ./certs/RootCA.pem -subj "/C=US/CN=Example-Root-CA"
#openssl x509 -outform pem -in ./certs/RootCA.pem -out ./certs/RootCA.crt
##Generate localhost.key, localhost.csr, and localhost.crt:
openssl req -new -nodes -newkey rsa:2048 -keyout ./certs/hermod.key -out ./certs/hermod.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=localhost.local"
openssl x509 -req -sha256 -days 1024 -in ./certs/hermod.csr -CA ./certs/RootCA.pem -CAkey ./certs/RootCA.key -CAcreateserial -extfile genkey_domains.txt -out ./certs/hermod.crt
