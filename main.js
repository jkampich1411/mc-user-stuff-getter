/**
 * @author Jakob Kampichler <jakobkampichler+dev@gmail.com>
 * @file This script uses some APIs to get more information about a Minecraft user.
 * @copyright JakobKampichler Dev (2021) - FutureEvents
 * @version 0.1.0
*/

var nodeArgs = process.argv.slice(2);

// === [Custom Logger] ===
function deblog(text, lvl) {
    if(!(lvl)) lvl=1;
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
// ===// [Custom Logger] \\===

// === [Error Processor] ===
var errorCausedOn = "";

process.on('SIGTERM', () => {
    if(errorCausedOn === "") {
        process.exitCode = 0;
        process.kill(process.pid);
    } else if(errorCausedOn === "loadingCriticalFiles") {
        deblog("An error occoured while trying to download some files.\nPlease check your Internet connection and\nalso if you have got enough space on your drive left!", 4);
        process.exitCode = 5;
        process.kill(process.pid);
    }
});
// ===// [Error Processor] \\===

require('dotenv').config();

const fs = require('fs');
const https = require('https');
const nodefetch = require('node-fetch');
const hdb = require('handlebars');
const config = JSON.parse(fs.readFileSync('./cfg.json', 'utf-8'));
const exp = require('express');
const web = exp();

var getWebKeys = (_call, privatekey = null, publickey = null) => {
    if(privatekey) if (fs.existsSync(privatekey)) return _call(privatekey);
    if(publickey) if (fs.existsSync(publickey)) return _call(publickey);
};

const app = https.createServer({
    key: getWebKeys((key) => fs.readFileSync(key, 'utf-8'), config.privatekey),
    cert: getWebKeys((key) => fs.readFileSync(key, 'utf-8'), config.publickey)
});
const proc = require('process');

var skin;
var sknTempl;
var port = process.env.PORT || 8080;
var os = proc.platform;

// === [Check if critical files exist!] ===
function checkFiles() {
    
    try {
        /* Directory Check */
        if (!(fs.existsSync('./skintemp'))) fs.mkdirSync('./skintemp');
        if (!(fs.existsSync('./skintemp/html'))) fs.mkdirSync('./skintemp/html');
        if (!(fs.existsSync('./templ'))) fs.mkdirSync('./templ');

        /* Skin Webpage Template Check */
        if (!(fs.existsSync("./templ/showskin.html"))) {
            let dl = fs.createWriteStream("./templ/showskin.html");
            let req = https.get("https://raw.githubusercontent.com/jkampich1411/mc-user-stuff-getter/templ/showskin.html", async (res) => {
                res.pipe(dl);

                res.on('end', () => {
                    loadSkinTemplate();
                });
            });
        }
        /* .env Template Check */
        if (!(fs.existsSync("./templ/.env"))) {
            let dl = fs.createWriteStream("./templ/.env");
            let req = https.get("https://raw.githubusercontent.com/jkampich1411/mc-user-stuff-getter/templ/env", async (res) => {
                res.pipe(dl);

                res.on('end', () => {
                    copyEnv();
                });
            });
        }
    } catch (e) {
        /* Error Log just because */
        errorCausedOn = "loadingCriticalFiles";
        process.kill(process.pid, 'SIGTERM');
    }
}
function copyEnv() {
    try {
        if(!fs.existsSync('./.env')) {
            let envTempl = fs.readFileSync('./templ/.env', 'utf-8');
            fs.writeFileSync('./.env', envTempl, err => {
                if (err) throw err;
            });
        }
    } catch (e) { throw e; }
}
function loadSkinTemplate() {
    sknTempl = fs.readFileSync('templ/showskin.html', 'utf-8');
    skin = hdb.compile(sknTempl);
}
// ===// [Check if critical files exist!] \\===

// === [Web Server] ===
function startWebServer() {
    app.listen(port, () => {
        deblog(`Webserver running on ${port}!`, 1);
    });

    web.use('/skin', exp.static(__dirname + '/skintemp/html'));
}
// ===// [Web Server] \\===

// Get the UUID of the User to do other stuff with it.
function fetchUUID(name, cb) {
    let opts = {
        hostname: 'crafthead.net',
        port: 443,
        path: `/profile/${name}`,
        method: 'GET'
    };
    
    let req = https.request(opts, res => {

        let datachunks = [];
        res.on('data', d => {
            datachunks.push(d);
        }).on('end', function() {
            let dat = Buffer.concat(datachunks);
            let data = JSON.parse(dat);
            let uid = data.id;
            let localdata = [8, 12, 16, 20, "-"];
            var idRes = [];

            /* Convert the UUID into a DASHED Format */
            if (!(uid)) return;
            else {
                let uuid1 = `${uid.slice(0,localdata[0])}${localdata[4]}`;
                let uuid2 = `${uid.slice(localdata[0],localdata[1])}${localdata[4]}`;
                let uuid3 = `${uid.slice(localdata[1],localdata[2])}${localdata[4]}`;
                let uuid4 = `${uid.slice(localdata[2],localdata[3])}${localdata[4]}${uid.slice(localdata[3])}`;
                var uuid = `${uuid1}${uuid2}${uuid3}${uuid4}`;

                idRes[0] = uid;
                idRes[1] = uuid;

            }
            return cb(idRes);
        });
    });
    req.on('error', err => console.error(err));

    req.end();
}

// Get a users skin in a HTML file
function fetchSkin(playername, urlPrefix, cb) {
    let data = skin({uname: playername});
    let outputFileString = `skintemp/html/${playername}.html`;

    fs.writeFile(outputFileString, data, err => {
        if (err) throw err;
    });

    let link = `${urlPrefix}/${playername}.html`;
    return cb(link);
}

// Get a users names
function fetchNames(uuid, cb) {
    let opts = {
        hostname: 'api.ashcon.app',
        port: 443,
        path: `/mojang/v2/user/${uuid}`,
        method: 'GET'
    };
    
    let req = https.request(opts, res => {

        let datachunks = [];
        res.on('data', d => {
            datachunks.push(d);
        }).on('end', function() {
            let dat = Buffer.concat(datachunks);
            let data = JSON.parse(dat);
            var playerNames = [];

            /* Add past player names into an array */
            for(let i=0; i < data.username_history.length; i++) {
                playerNames.push(data.username_history[i].username);
            }

            return cb(playerNames);
        });
    });

    req.on('error', err => console.error(err));

    req.end();
}

// Function to do stuff
var getStuff = (playername, webPrefix, cb) => {
    loadSkinTemplate();
    var response = [];

    var playerUUIDs = [];
    var skinUrl = "";
    var pastUserNames = [];

    var playerIDs = fetchUUID(playername, (IDs) => {
        playerUUIDs[0] = IDs[0];
        playerUUIDs[1] = IDs[1];

        var skin = fetchSkin(playername, webPrefix, (URL) => {
            skinUrl = URL;
    
            var names = fetchNames(playerUUIDs[0], (NamesArray) => {
                for(let i = 0; i<NamesArray.length; i++) {
                    pastUserNames.push(NamesArray[i]);
                }

                response[0] = playerUUIDs;
                response[1] = skinUrl;
                response[2] = pastUserNames;
                return cb(response);
            });
        });
    });
};

switch (nodeArgs[0].toLowerCase()) {
    case 'webserver':
        if (os === "win32" || os === "linux") {
            deblog(`Starting Webserver on ${port};`);
            startWebServer();
            break;
        } else break;

    case 'fetch':
        if (os === "win32" || os === "linux") {
            if (nodeArgs[1]) {
                getStuff(nodeArgs[1], nodeArgs[2], (call) => {
                    console.log(`${call.join(', ')}`);
                });
            }
            break;
        } else break;

    case 'info': 
        const moduleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===";
        deblog(moduleDescription, 1);
        break;

    case 'noinfo':
        const advancedModuleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\n(Yes I couldn't think of a better name.)\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===\n\n(c) 2021 - theJakobcraft";
        deblog(advancedModuleDescription, 1);
        break;

    default:
        checkFiles();
}

// Use this script in other scripts!
module.exports.fetch = (mcPN, urlPrefix, cb) => {
    return getStuff(mcPN, urlPrefix, cb);
};
module.exports.moduleInfo = () => {
    const moduleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===\n";
    return deblog(moduleDescription, 1);
};
module.exports.secretModuleInfo = () => {
    const advancedModuleDescription = "===[ MC User Stuff Getter ]===\nThank you for using \'MC User Stuff Getter\'!\n(Yes I couldn't think of a better name.)\nGitHub Repository: \'jkampich1411/mc-user-stuff-getter\'\n===[ MC User Stuff Getter ]===\n\n(c) 2021 - theJakobcraft\n";
    return deblog(advancedModuleDescription, 1);
};
