# README #

This will explain how to setup you the AISapp Website.

### How do I use the website ###

*You will need to host the site using a web server for it to function correctly.
*You can add query parameters to the query string and they will be forwarded to the AIS web service, e.g., "?session=3"

### How do I use local data ###

Include "?local=true" in your query string when you access the website.
If you want to use different local data, then change the contents of "sample_data.js". Specifically, change the value of the global "ais_messages" variable.

### How do I deploy the website to maritime-n.latrobe.edu.au ###

1. If you want to (you will need to) deploy this on your own dev server, you need a proper web server for it to work properly.
2. Currently this version of the app is being developed on my Linux machine with the LAMP stack (Linux Apache MySQL PHP)
3. After setting up your LAMP server, go to root folder (can be accessed within the terminal with cd /var/www/)
4. Clone the App to the server, in /www/ folder.
5. Move the default directory to the app folder (as the apache server would have its own hello page):   
    https://askubuntu.com/questions/337874/change-apache-document-root-folder-to-secondary-hard-drive

6. If anything refer to an earlier version of the the guide right below:

### How do I deploy the website to maritime-n.latrobe.edu.au (OLD) ###


1. Merge any changes to the branch * maritime-n-production *
1. Log on to maritime-n.latrobe.edu.au through putty (port 6022)
1. If the website is not present, use git to clone it on to the web server ```git clone https://{YOUR BITBUCKET USER NAME}@bitbucket.org/latrobepmiteam/aisapp.git``` then ```git fetch && git checkout n-maritime-production```
1. Navigate to ```/var/www/api/aisapp```
1. If you are not Jason, then you need to change the url of the origin ```git remote set-url origin https://{YOUR BITBUCKET USER NAME}@bitbucket.org/latrobepmiteam/aisapp.git```
1. Type the command ```git pull```
1. run ```source deploymentscript.sh``` to setup the permissions for the website.


