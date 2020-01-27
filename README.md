# README #

This will explain how to setup you the AISapp Website.

### How do I use the website ###

*You will need to host the site using a web server for it to function correctly.
*You can add query parameters to the query string and they will be forwarded to the AIS web service, e.g., "?session=3"

### How do I use local data ###

Include "?local=true" in your query string when you access the website.
If you want to use different local data, then change the contents of "sample_data.js". Specifically, change the value of the global "ais_messages" variable.

### How do I deploy the website to maritime-n.latrobe.edu.au ###


1. Merge any changes to the branch * maritime-n-production *
1. Log on to maritime-n.latrobe.edu.au through putty (port 6022)
1. If the website is not present, use git to clone it on to the web server ```git clone https://{YOUR BITBUCKET USER NAME}@bitbucket.org/latrobepmiteam/aisapp.git``` then ```git fetch && git checkout n-maritime-production```
1. Navigate to ```/var/www/api/aisapp```
1. If you are not Jason, then you need to change the url of the origin ```git remote set-url origin https://{YOUR BITBUCKET USER NAME}@bitbucket.org/latrobepmiteam/aisapp.git```
1. Type the command ```git pull```
1. run ```source deploymentscript.sh``` to setup the permissions for the website.


### TODO: Arrange the steps for the app ###
### TODO: Add exception handlings for each component ### 
### TODO: BUG: app crashes when switch between types of visualization - to investigate further ###
### TODO: top left icon is broken @TOOLS UI ###
### TODO: Setting wheel not implemented ###
### TODO: UPDATE LEFT PANEL <OUTDATED> ###
### TODO: BUG: components don't have callbacks to each other, fix this ###
### TODO: Visualization refresh button doens't work - TBD ###
### Jason Incident is corrupted @Playlists ### 
# scan for ships in the range of the close encounters
# TODO: Create scenario button isn't implemented

### DONE ###
# Set up LAMP server to deploy the dev aisapp on local machine (8hrs)
# set the html charset (.5hr)
# utils.js:132:2 : unreachable code after return (.5hr)

