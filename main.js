const fs = require('fs');
const https = require('https');
const nodefetch = require('node-fetch');

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

// Get the Users Skin
function fetchSkin(id, playername) {
    let skurl = `https://crafthead.net/skin/${id}`;
    let skargs = `/skin/${id}`;

    async function dlskin(url, plname) {
        let res = await nodefetch(url);
        let buff = await res.buffer();

        fs.writeFile(`${plname}.png`, buff, () => {
            console.log('dl finished, test');
        });
    }
    dlskin(skurl, playername)
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
    fetchSkin(nodash, usr)
    console.log(nodash)
    console.log(dash)
    console.log(usr)
}

fetchUUID("thejakobcraft")