openssl genrsa -des3 -out ./certs/m2mqtt_ca.key 2048

openssl req -new -x509 -days 3650 -key ./certs/m2mqtt_ca.key -out ./certs/m2mqtt_ca.crt

openssl genrsa -out ./certs/m2mqtt_srv.key 2048
openssl req -new -out ./certs/m2mqtt_srv.csr -key ./certs/m2mqtt_srv.key
openssl x509 -req -in ./certs/m2mqtt_srv.csr -CA ./certs/m2mqtt_ca.crt -CAkey ./certs/m2mqtt_ca.key -CAcreateserial -out ./certs/m2mqtt_srv.crt -days 3650
cp ./certs/* /home/stever/Downloads/certs/



#openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout ./certs/RootCA.key -out ./certs/RootCA.pem -subj "/C=US/CN=Example-Root-CA"
#openssl x509 -outform pem -in ./certs/RootCA.pem -out ./certs/RootCA.crt

#openssl req -new -nodes -newkey rsa:2048 -keyout ./certs/hermod.key -out ./certs/hermod.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=localhost.local"
#openssl x509 -req -sha256 -days 1024 -in ./certs/hermod.csr -CA ./certs/RootCA.pem -CAkey ./certs/RootCA.key -CAcreateserial -extfile genkey_domains.txt -out ./certs/hermod.crt

