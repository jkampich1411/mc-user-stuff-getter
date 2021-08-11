/**
 * @author Jakob Kampichler <jakobkampichler+dev@gmail.com>
 * @file This script uses some APIs to get more information about a Minecraft user. It is developed for future-events, but if you know how to modify it, you can use it for yourself.
 * @copyright JakobKampichler Dev (2021) - FutureEvents
 * other meta:
 * @version 0.1.0
*/

const moduleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===\n";
const advancedModuleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\n(Yes I couldn't think of a better name.)\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===\n\n(c) 2021 - theJakobcraft\n";

// CustomLogger
function deblog(text, lvl) {
    if(!(lvl)) lvl===1;
    if(lvl ===1) {
        console.log(`INFO: ${text}`);
    }
    else if(lvl ===2) {
        console.log(`WARN: ${text}`);
    }
    else if(lvl ===3) {
        console.log(`ERROR: ${text}`);
    }
    else if(lvl ===4) {
        console.log(`CRITICAL: ${text}`);
    }
}

const fs = require('fs');
const https = require('https');
const nodefetch = require('node-fetch');
const sqlcon = require('mysql');
const exp = require('express');
const web = exp();
const app = require('http').createServer(web)
const hdb = require('handlebars');
const e = require('express');
const path = require('path');

var skin;
var sknTempl;

require('dotenv').config()

// Check if critical files exist!
function checkFiles() {
    
    try {
        if (!(fs.existsSync('./skintemp'))) fs.mkdirSync('./skintemp');
        if (!(fs.existsSync('./skintemp/html'))) fs.mkdirSync('./skintemp/html');
        if (!(fs.existsSync('./templ'))) fs.mkdirSync('./templ');
    } catch (e) { throw e; }

    try {
        if (!(fs.existsSync('./templ/.env'))) {
            let dl = fs.createWriteStream("./templ/.env");
            let req = https.get("https://raw.githubusercontent.com/jkampich1411/mc-user-stuff-getter/templ/env", async (res) => {
                res.pipe(dl);

                res.on('end', () => {
                    copyEnv();
                })
            });
        };

        if (!(fs.existsSync("./templ/showskin.html"))) {
            let dl = fs.createWriteStream("./templ/showskin.html")
            let req = https.get("https://raw.githubusercontent.com/jkampich1411/mc-user-stuff-getter/templ/showskin.html", async (res) => {
                res.pipe(dl);

                res.on('end', () => {
                    createSkinTemplate();
                });
            });
        }
    } catch (e) { throw e; }
}
function copyEnv() {
    try {
        if(!fs.existsSync('./.env')) {
            let envTempl = fs.readFileSync('templ/.env', 'utf-8');
            fs.writeFileSync('./.env', envTempl, err => {
                if (err) throw err;
            });
        }
    } catch (e) { throw e; }
}

function createSkinTemplate() {
    sknTempl = fs.readFileSync('templ/showskin.html', 'utf-8');
    skin = hdb.compile(sknTempl);
}

checkFiles()

var port = process.env.PORT || 8080;

// Use this script in other scripts!
module.exports = {
    fetch: function(mcPN) {
        fetchUUID(mcPN);
    },
    startServer: function() {
        // Webserver to display Skin
        app.listen(port, () => {
            console.log(`Server running on port: ${port}`)
        });
        web.use('utils/skin', exp.static(__dirname + '/skintemp/html'));        
    },
    moduleInfo: function() {
        return deblog(moduleDescription, 1)
    },
    secretModuleInfo: function(){
        return deblog(advancedModuleDescription, 1)
    }
}

// Get the UUID of the User to do other stuff with it.
function fetchUUID(name) {
    let opts = {
        hostname: 'crafthead.net',
        port: 443,
        path: `/profile/${name}`,
        method: 'GET'
    }
    
    let req = https.request(opts, res => {
        console.log(`statuscode: ${res.statusCode}`);

        let datachunks = [];
        res.on('data', d => {
            datachunks.push(d);
        }).on('end', function() {
            let dat = Buffer.concat(datachunks);
            let data = JSON.parse(dat);
            prepUUID(data.id, name)
        });
    });

    req.on('error', err => {
        console.error(err);
    });

    req.end();
}

// Get a users skin in a HTML file
function fetchSkin(playername) {
    let data = skin({uname: playername});
    let outputFileString = `skintemp/html/${playername}.html`;

    fs.writeFile(outputFileString, data, err => {
        if (err) throw err;

        console.log(`File saved to \'${outputFileString}\'`);
    });
}

// Prepare UUID to use in MyWl
function prepUUID(str, usrname) {
    let uid = str;
    let localdata = [8, 12, 16, 20, "-"];

    if (!(uid)) return;
    else {
        let uuid1 = `${uid.slice(0,localdata[0])}${localdata[4]}`;
        let uuid2 = `${uid.slice(localdata[0],localdata[1])}${localdata[4]}`;
        let uuid3 = `${uid.slice(localdata[1],localdata[2])}${localdata[4]}`;
        let uuid4 = `${uid.slice(localdata[2],localdata[3])}${localdata[4]}${uid.slice(localdata[3])}`;
        let uuid = `${uuid1}${uuid2}${uuid3}${uuid4}`
        cb(uid, uuid, usrname)
    }
}


function cb(nodash, dash, usr) {
    fetchSkin(usr)
    console.log(nodash);
    console.log(dash);
    console.log(usr);
}

process.on('SIGTERM', () => {
    app.close();
});