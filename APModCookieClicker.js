// ==UserScript==
// @name         AP_CookieClicker
// @namespace    http://tampermonkey.net/
// @version      2024-10-16
// @description  Archipelago
// @author       SX
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @require    
// @grant        none
// ==/UserScript==

//const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, CREATE_AS_HINT_MODE, CLIENT_STATUS, CONNECTION_STATUS, CLIENT_PACKET_TYPE, SetOperationsBuilder } = await import("https://unpkg.com/archipelago.js@1.0.0/dist/archipelago.js");
//'use strict';

alert("loaded");

//this startet as cookieclicker, but should work as a template for all browsergames
//therefore code is splitted into Archipelago stuff, and Game specific Stuff
//so you just need to change Game Specific stuff 

//ToastLibary, for Announcement on some Sites
const cssToast = document.createElement('link')
cssToast.href = 'https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css';
cssToast.type = 'text/css';
cssToast.rel = "stylesheet";
document.head.append(cssToast);

const scriptToast = document.createElement('script')
scriptToast.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
scriptToast.type = 'text/javascript';
document.head.append(scriptToast);

/* Usage
    Toastify({
        text: "This is a toast",
        duration: 3000
    }).showToast();
*/

// input fields
const connectionContainer = document.createElement("div");
const hostname = document.createElement("input");   
const port = document.createElement("input");
const name = document.createElement("input");
const password = document.createElement("input");
const connect = document.createElement("button");
const consoleInput = document.createElement("input");
consoleInput.disabled = true;
connect.onclick = function () {
    connectAP();
};
const text = document.createElement("span");
var client = null; //after connection there will be a client

connectionContainer.style.display = "flex";
connectionContainer.style.margin = "0";
connectionContainer.style.padding = "0";
connectionContainer.style.position = "absolute";
connectionContainer.style.top = "8.5rem";
connectionContainer.style.right = "0";
connectionContainer.style.left = "0";
connectionContainer.style.zIndex = "99999";
connectionContainer.style.justifyContent = "center";
connectionContainer.style.gap = "1rem";
connectionContainer.append(
    text, hostname, port, name, password, connect, consoleInput
);

text.innerText = "AP Conn: ";
hostname.placeholder = "Address";
hostname.style.width = "120px";
port.placeholder = "Port";
port.style.width = "64px";
name.placeholder = "Slot Name";
name.style.width = "120px";
password.placeholder = "Password";
password.type = "password";
password.style.width = "100px";
connect.innerText = "Connect";
consoleInput.placeholder = "!hint"

//console
consoleInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        window.client.say(consoleInput.value);
        consoleInput.value = "";
    }
});

document.body.prepend(
    connectionContainer
);

function typeToText(element) {
    var id = -1;
    id = Number(element.text);
    var playerId = window.client.data.slotData.player_id;
    
    if(element.player !== undefined){
      playerId = Number(element.player);
    }
    if (element.type === "player_id" && !isNaN(id)) {
      return window.client.players.name(Number(id));
    } else if (element.type === "item_id" && !isNaN(id)) {
      return window.client.items.name(window.client.players.game(Number(playerId)), Number(id))
    } else if (element.type === "location_id" && !isNaN(id)) {
      return window.client.locations.name(window.client.players.game(Number(playerId)), Number(id))
    }
    else if (element.text !== undefined){
      return element.text;
    } else {
      return element;
    }
  }

function packetToText(packet) {
    if (packet === undefined) {
        return "";
    }
    var msg = "";
    packet.forEach(element => {
        msg += typeToText(element) + " ";
    });
    return msg;
}

function getPlayerId(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value.name === searchValue)
            return key;
    }
}

function sendCheckIdToAp(id) {
    window.client.locations.check(id);
}

function releaseAll() {
    window.client.locations.autoRelease()
}


function connectAP() {
    window.client = new Client();
    connect.disabled = true;
    hostname.disabled = true;
    port.disabled = true;
    name.disabled = true;
    password.disabled = true;
    consoleInput.disabled = false;

    if(parseInt(port.value) !== parseInt(localStorage.getItem('port'))){
        if (confirm("Your Port changed, so this might be a new Game. DELETE LOCAL SAVE GAME?") == true) {
            Game.HardReset(2);
            recievedItems = [];
        }
    }

    var self = this;
    const connectionInfo = {
        hostname: hostname.value,
        port: parseInt(port.value),
        game: gamename,
        name: name.value,
        password: password.value,
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    };

    //if connected
    window.client.disconnect();

    // Set up event listeners
    window.client.addListener(SERVER_PACKET_TYPE.CONNECTED, (packet) => {
        console.log("Connected to server: ", packet);
        appendFunctions();
        save();
    });

    window.client.addListener(SERVER_PACKET_TYPE.ROOM_UPDATE, (packet) => {
        console.log("Room update: ", packet);
    });

    window.client.addListener(SERVER_PACKET_TYPE.RECEIVED_ITEMS, (packet) => {
        console.log("Recieved Items: ", packet);

        //when items.length > 1 its an reconnect
        if(packet.items.length>1){
            var serverItems = [];

            //execute Items with firstTime = false > only Unlocks, no Traps or Items
            packet.items.forEach(item => {
                recieveItem(item.item, false);
                serverItems.push(item.item);
            });
            
            //compare serverItems with local saved(and executed Items)
            let difference = serverItems.filter(x => !recievedItems.includes(x));
            console.log("serverItems")
            console.log(serverItems)

            console.log("recievedItems")
            console.log(recievedItems)

            console.log("difference")
            console.log(difference)

            difference.forEach(id => {
                recieveItem(id, true);
            });

        } else { //Just one Item means its new > alwaye use
            recieveItem(packet.items[0].item, true);
        }
    });

    window.client.addListener(SERVER_PACKET_TYPE.LOCATION_INFO, (packet) => {
        console.log("Hint: ", packet);
        //self.hints.concat(packet.items);
    });

    window.client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet) => {
        console.log("Print JSON: ", packet);

        var msg = packetToText(packet.data);
        if (msg === "") {
            return;
        }
        console.log("MSG: " + msg);
        toast(msg);
    });

    // Connect to the Archipelago server
    window.client
        .connect(connectionInfo)
        .then(() => {
            console.log("Connected to the server");
        })
        .catch((error) => {
            console.error("Failed to connect:", error);
            toast(error);
        });

    // Disconnect from the server when unloading window.
    window.addEventListener("beforeunload", () => {
        window.client.disconnect();
    });
};


//forDev
hostname.value = "archipelago.gg";
//port.value = "51981";
//name.value = "Alex_CC";

/*                                   */
/*                                   */
/* GAME SPECIFIC FUNCTIONS DOWN HERE */
/*                                   */
/*                                   */

var gamename = "Cookie Clicker"
var checkIdOffset = 42069001;
var goalAchievmentCount = 99;
var recievedItems = []


/* On Site Loaded */
//disable CookieClicker
document.getElementById("wrapper").style.visibility = "hidden";

function save() {
    localStorage.setItem('recievedItems', JSON.stringify(recievedItems))
    localStorage.setItem('host', hostname.value);
    localStorage.setItem('port', port.value);
    localStorage.setItem('name', name.value);
    localStorage.setItem('password', password.value);
}

function load() {
    recievedItems = JSON.parse(localStorage.getItem('recievedItems')) || [];

    let urlParams = new URLSearchParams(window.location.search);
    hostname.value = urlParams.get('host') || urlParams.get('Host') || localStorage.getItem('host') || hostname.value || 'archipelago.gg';
    port.value = urlParams.get('port') || urlParams.get('Port') || localStorage.getItem('port') || port.value || '';
    name.value = urlParams.get('name') || urlParams.get('Name') || localStorage.getItem('name') || name.value || '';
    password.value = urlParams.get('password') || urlParams.get('Password') || localStorage.getItem('password') || password.value || '';
}
load();

function randomProperty(obj) {
    var keys = Object.keys(obj);
    return obj[keys[keys.length * Math.random() << 0]];
};

//for This game we Use the Games Chat, not the default Toast
function toast(message) {
    Game.Notify("Archipelago", message);
    /* 
    Toastify({
        text: message,
        duration: 5000
    }).showToast(); 
    */
}

function recieveItem(id, firstTime) {
    var building = randomProperty(Game.Objects);

    
    if(firstTime){
        recievedItems.push(id);
        console.log("I apply a new item!" + id);
    }

    save();

    //cookie Multiplyer
    if (id === 42069644 && firstTime) {
        Game.cookies = Game.cookies * 2;
        console.log("*2 Cookies");
    } else if (id === 42069645 && firstTime) {
        Game.cookies = Game.cookies * 999;
        console.log("*999 Cookies");
    } else if (id === 42069646 && firstTime) {
        Game.cookies = Game.cookies * 9999;
        console.log("*9999 Cookies");
    } else if (id === 42069647 && firstTime) {
        Game.cookies = Game.cookies * 9999999;
        console.log("*9999999 Cookies");
    } else if (id === 42069648 && firstTime) {
        Game.cookies = Game.cookies * 0.5;
        console.log("*0.5 Cookies");
    } else if (id === 42069465) { //Unlock Cursor
        document.getElementById("product0").style.display = "";
    } else if (id === 42069466) { //Unlock Farm
        document.getElementById("product2").style.display = "";
    } else if (id === 42069467) { //Unlock Mine
        document.getElementById("product3").style.display = "";
    } else if (id === 42069468) { //Unlock Factory
        document.getElementById("product4").style.display = "";
    } else if (id === 42069469) { //Unlock Bank
        document.getElementById("product5").style.display = "";
    } else if (id === 42069470) { //Unlock Temple
        document.getElementById("product6").style.display = "";
    } else if (id === 42069471) { //Unlock Wizard Tower
        document.getElementById("product7").style.display = "";
    } else if (id === 42069472) { //Unlock Shipment
        document.getElementById("product8").style.display = "";
    } else if (id === 42069473) { //Unlock Alchemy Lab
        document.getElementById("product9").style.display = "";
    } else if (id === 42069474) { //Unlock Portal
        document.getElementById("product10").style.display = "";
    } else if (id === 42069475) { //Unlock Time Machine
        document.getElementById("product11").style.display = "";
    } else if (id === 42069476) { //Unlock Antimatter Condenser
        document.getElementById("product12").style.display = "";
    } else if (id === 42069477) { //Unlock Prism
        document.getElementById("product13").style.display = "";
    } else if (id === 42069478) { //Unlock Chancemaker
        document.getElementById("product14").style.display = "";
    } else if (id === 42069479) { //Unlock Fractal Engine
        document.getElementById("product15").style.display = "";
    } else if (id === 42069480) { //Unlock Javascript Console
        document.getElementById("product16").style.display = "";
    } else if (id === 42069481) { //Unlock Idleverse
        document.getElementById("product17").style.display = "";
    } else if (id === 42069482) { //Unlock Cortex Baker
        document.getElementById("product18").style.display = "";
    } else if (id === 42069483) { //Unlock You
        document.getElementById("product19").style.display = "";
    } else if (id < 42069649) { // UPGRADES
        Game.UpgradesById[id - checkIdOffset].basePrice = 1;
        Game.UpgradesById[id - checkIdOffset].buy();
    } else if (id === 42069649 && firstTime) { // TRAPS  -1 Gebäude
        if (building.amount >= 1) {
            building.amount -= 1;
        } else {
            building.amount = 0;
        }
        Game.Notify("Archipelago", '-1 ' + building.name);
        console.log("-1 Gebäude");
    } else if (id === 42069650 && firstTime) { // -10 Gebäude
        if (building.amount >= 10) {
            building.amount -= 10;
        } else {
            building.amount = 0;
        }
        Game.Notify("Archipelago", '-10 ' + building.name);
        console.log("-10 Gebäude");
    } else if (id === 42069651 && firstTime) { // -100 Gebäude
        if (building.amount >= 100) {
            building.amount -= 100;
        } else {
            building.amount = 0;
        }
        Game.Notify("Archipelago", '-100 ' + building.name);
        console.log("-100 Gebäude");
    } else if (id === 42069652 && firstTime) { // -10% Cookies
        Game.cookies = Game.cookies * 0.9;
        console.log("-10% Cookies");
    } else if (id === 42069653 && firstTime) { // -20% Cookies
        Game.cookies = Game.cookies * 0.8;
        console.log("-20% Cookies");
    } else if (id === 42069654 && firstTime) { // -30% Cookies
        Game.cookies = Game.cookies * 0.7;
        console.log("-30% Cookies");
    } else if (id === 42069655 && firstTime) { // -40% Cookies
        Game.cookies = Game.cookies * 0.6;
        console.log("-40% Cookies");
    } else if (id === 42069656 && firstTime) { // -50% Cookies
        Game.cookies = Game.cookies * 0.5;
        console.log("-50% Cookies");
    } else if (id === 42069657 && firstTime) { // -60% Cookies
        Game.cookies = Game.cookies * 0.4;
        console.log("-60% Cookies");
    } else if (id === 42069658 && firstTime) { // -70% Cookies
        Game.cookies = Game.cookies * 0.3;
        console.log("-70% Cookies");
    } else if (id === 42069659 && firstTime) { // -80% Cookies
        Game.cookies = Game.cookies * 0.2;
        console.log("-80% Cookies");
    } else if (id === 42069660 && firstTime) { // -90% Cookies
        Game.cookies = Game.cookies * 0.1;
        console.log("-90% Cookies");
    } else if (id === 42069661 && firstTime) { // -100% Cookies
        Game.cookies = 0;
        console.log("-100% Cookies");
    }
}

//append Functions which need to be set or overwritten after Connection during Runtime
function appendFunctions() {

    //enable CookieClicker
    document.getElementById("wrapper").style.visibility = "visible";

    //disable Buying of Upgrades
    document.getElementById("upgrades").style.pointerEvents = "none";

    //lock all Stores
    document.getElementById("product0").style.display = "none";
    //document.getElementById("product1").style.display = "none"; Grandmas are enabled from start
    document.getElementById("product2").style.display = "none";
    document.getElementById("product3").style.display = "none";
    document.getElementById("product4").style.display = "none";
    document.getElementById("product5").style.display = "none";
    document.getElementById("product6").style.display = "none";
    document.getElementById("product7").style.display = "none";
    document.getElementById("product8").style.display = "none";
    document.getElementById("product9").style.display = "none";
    document.getElementById("product10").style.display = "none";
    document.getElementById("product11").style.display = "none";
    document.getElementById("product12").style.display = "none";
    document.getElementById("product13").style.display = "none";
    document.getElementById("product14").style.display = "none";
    document.getElementById("product15").style.display = "none";
    document.getElementById("product16").style.display = "none";
    document.getElementById("product17").style.display = "none";
    document.getElementById("product18").style.display = "none";
    document.getElementById("product19").style.display = "none";

    //set AchievementCount as Goal
    if (window.client.data.slotData.advancement_goal !== null) {
        goalAchievmentCount = window.client.data.slotData.advancement_goal;
    }

    //overwrite for Win Function CookieClicker
    Game.Win = function (what) {
        if (typeof what === 'string') {
            if (Game.Achievements[what]) {
                var it = Game.Achievements[what];
                if (it.won == 0) {
                    var name = it.shortName ? it.shortName : it.dname;
                    it.won = 1;
                    Game.Notify(loc("Achievement unlocked"), '<div class="title" style="font-size:18px;margin-top:-2px;">' + name + '</div>', it.icon);
                    Game.NotifyTooltip('function(){return Game.crateTooltip(Game.AchievementsById[' + it.id + ']);}');
                    if (Game.CountsAsAchievementOwned(it.pool)) Game.AchievementsOwned++;
                    Game.recalculateGains = 1;
                    if (App && it.vanilla) App.gotAchiev(it.id);

                    //send AchievementID to AP
                    sendCheckIdToAp(it.id + checkIdOffset)

                    if (Game.AchievementsOwned >= goalAchievmentCount) {//TODO WIN COUNT?
                        releaseAll();
                    }
                }
            }
        }
        else { for (var i in what) { Game.Win(what[i]); } }
    }

    //overwrite Cookies
    //10x Shimmers
    var shimmersFactor = 10;

    Game.updateShimmers=function()//run shimmer functions, kill overtimed shimmers and spawn new ones
    {
        for (var i in Game.shimmers)
        {
            Game.shimmers[i].update();
        }
        
        //cookie storm!
        if (Game.hasBuff('Cookie storm') && Math.random()<0.5)
        {
            var newShimmer=new Game.shimmer('golden',{type:'cookie storm drop'},1);
            newShimmer.dur=Math.ceil(Math.random()*4+1);
            newShimmer.life=Math.ceil(Game.fps*newShimmer.dur);
            //newShimmer.force='cookie storm drop';
            newShimmer.sizeMult=Math.random()*0.75+0.25;
        }
        
        //spawn shimmers
        for (var i in Game.shimmerTypes)
        {
            var me=Game.shimmerTypes[i];
            if (me.spawnsOnTimer && me.spawnConditions())//only run on shimmer types that work on a timer
            {
                if (!me.spawned)//no shimmer spawned for this type? check the timer and try to spawn one
                {
                    //me.time++;
                    me.time = me.time + shimmersFactor;

                    if (Math.random()<Math.pow(Math.max(0,(me.time-me.minTime)/(me.maxTime-me.minTime)),5))
                    {
                        var newShimmer=new Game.shimmer(i);
                        newShimmer.spawnLead=1;
                        if (Game.Has('Distilled essence of redoubled luck') && Math.random()<0.01) var newShimmer=new Game.shimmer(i);
                        me.spawned=1;
                    }
                }
            }
        }
    }

    Game.Reincarnate=function(bypass)
    {
        if (!bypass) Game.Prompt('<id Reincarnate><h3>'+loc("Reincarnate")+'</h3><div class="block">'+loc("Are you ready to return to the mortal world?")+'</div>',[[loc("Yes"),'Game.ClosePrompt();Game.Reincarnate(1);'],loc("No")]);
        else
        {
            Game.ascendUpgradesl.innerHTML='';
            Game.ascensionMode=Game.nextAscensionMode;
            Game.nextAscensionMode=0;
            Game.Reset();
            if (Game.HasAchiev('Rebirth'))
            {
                Game.Notify('Reincarnated',loc("Hello, cookies!"),[10,0],4);
            }
            if (Game.resets>=1000) Game.Win('Endless cycle');
            if (Game.resets>=100) Game.Win('Reincarnation');
            if (Game.resets>=10) Game.Win('Resurrection');
            if (Game.resets>=1) Game.Win('Rebirth');
            
            var prestigeUpgradesOwned=0;
            for (var i in Game.Upgrades)
            {
                if (Game.Upgrades[i].bought && Game.Upgrades[i].pool=='prestige') prestigeUpgradesOwned++;
            }
            if (prestigeUpgradesOwned>=100) Game.Win('All the stars in heaven');
            
            Game.removeClass('ascending');
            Game.OnAscend=0;
            //trigger the reincarnate animation
            Game.ReincarnateTimer=1;
            Game.addClass('reincarnating');
            Game.BigCookieSize=0;
            
            Game.runModHook('reincarnate');
        }
    }
}
