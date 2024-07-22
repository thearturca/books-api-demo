ssh-keygen -t rsa -b 4096 -m PEM -f key
openssl rsa -in key -pubout -outform PEM -out key.pub
cat key
cat key.pub
