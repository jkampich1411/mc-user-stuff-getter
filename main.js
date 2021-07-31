/**
 * @author Jakob Kampichler <jakobkampichler+dev@gmail.coms>
 * @file This script uses some APIs to get more information about a Minecraft user. It is developed for future-events, but if you know how to modify it, you can use it for yourself, that is why .
 * @copyright JakobKampichler Dev (2021) - FutureEvents
 * other meta:
 * @version 0.1.0
*/

const fs = require('fs');
const https = require('https');
const nodefetch = require('node-fetch');
const sqlcon = require('mysql');
var debug = 2;

// MySQL conn (insert into Whitelist)
function inpSQLWL(uuid, uname) {
    let conn = sqlcon.createConnection({
        host: 'itm-hof.tk',
        user: 'jkampichler_db3',
        password: 'Future@1227',
        database: 'jkampichler_db3'
    });
    conn.connect();
    conn.query(`INSERT INTO \`mysqlwl_players\` (\`UUID\`, \`user\`) VALUES (\'${uuid}\', \'${uname}\');`, (err, ress, fields) => {
        if (err) throw err;
    });
    conn.end();
}

// MySQL conn (remove from Whitelist)
function delSQLWL(uuid, uname) {
    let conn = sqlcon.createConnection({
        host: 'itm-hof.tk',
        user: 'jkampichler_db3',
        password: 'Future@1227',
        database: 'jkampichler_db3'
    });
    conn.connect();
    conn.query(`DELETE FROM \`mysqlwl_players\` WHERE \`UUID\` = \'${uuid}\'`, (err, ress, fields) => {
        if (err) throw err;
    });
    conn.end();
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

// Get the Users Skin
function fetchSkin(id, playername) {
    let skurl = `https://crafthead.net/skin/${id}`;
    let skargs = `/skin/${id}`;

    async function dlskin(url, plname) {
        let res = await nodefetch(url);
        let buff = await res.buffer();

        fs.writeFile(`${plname}.png`, buff, () => {
            console.log('dl finished');
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
    if (debug === 0) return;
    if (debug === 1) inpSQLWL(dash, usr);
    if (debug === 2) delSQLWL(dash, usr);
    console.log(nodash);
    console.log(dash);
    console.log(usr);
}

return fetchUUID("thejakobcraft")