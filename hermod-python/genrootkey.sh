openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout ./certs/RootCA.key -out ./certs/RootCA.pem -subj "/C=US/CN=Example-Root-CA"
openssl x509 -outform pem -in ./certs/RootCA.pem -out ./certs/RootCA.crt
