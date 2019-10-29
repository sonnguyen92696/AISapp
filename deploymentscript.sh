echo setting file permissions for WWW access ...
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 700 .git;
chmod 700 .idea;
chmod 700 deploymentscript.sh
echo Done
