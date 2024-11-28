// ==UserScript==
// @name         AP_CookieClicker
// @namespace    http://tampermonkey.net/
// @version      2024-10-15
// @description  try to take over the world!
// @author       You
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const script = document.createElement('script')
    script.src = 'https://sommer-alexander.de/APHelper/archipelago.min.js';
    script.type = 'text/javascript';
    document.head.append(script);

    document.body.style.border = "5px solid red";
    document.body.style.minHeight = "100vh";

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
    // connectionContainer.style.width = "100vw";
    connectionContainer.style.top = "8.5rem";
    connectionContainer.style.right = "0";
    connectionContainer.style.left = "0";
    connectionContainer.style.zIndex = "99999";
    connectionContainer.style.justifyContent = "center";
    connectionContainer.style.gap = "1rem";
    connectionContainer.append(
        text, hostname, port, name, password, connect, consoleInput
    );

    text.innerText = "AP Conn Info: ";
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
    consoleInput.addEventListener("keypress", function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            client.send({ "cmd": "Say", "text": consoleInput.value })
            consoleInput.value = "";
        }
    });

    //forDev
    hostname.value = "archipelago.gg";
    port.value = "51981";
    name.value = "Player1";

    document.body.prepend(
        connectionContainer
    );

    const rules = document.getElementsByClassName("rule");
    if (rules.length > 0) {
        location.reload();
    }

    function typeToText(element) {
        var id = -1;
        if (element.type === "player_id") {
            id = Number(element.text);
            return client._dataManager._players.get(id).name
        } else if (element.type === "item_id") {
            id = Number(element.text);
            return client._dataManager._items.get(id)
        } else if (element.type === "location_id") {
            id = Number(element.text);
            return client._dataManager._locations.get(id)
        }
        else {
            return element.text;
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

    function randomProperty(obj) {
        var keys = Object.keys(obj);
        return obj[keys[keys.length * Math.random() << 0]];
    };

    function overwriteFunctions() {

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
                        client.send({ "cmd": "LocationChecks", "locations": [it.id + 42069001] })

                        if (Game.AchievementsOwned > 100) {//TODO WIN COUNT?
                            this.client.locations.auto_release();
                        }
                    }
                }
            }
            else { for (var i in what) { Game.Win(what[i]); } }
        }

    }

    function connectAP() {
        client = new archipelagoJS.ArchipelagoClient();
        connect.disabled = true;
        hostname.disabled = true;
        port.disabled = true;
        name.disabled = true;
        password.disabled = true;
        consoleInput.disabled = false;

        try {
            client.connect({
                game: "Cookie Clicker",
                name: name.value,
                password: password.value,
                uuid: "",
                version: {
                    major: 0,
                    minor: 4,
                    build: 2,
                },
                items_handling: archipelagoJS.ItemsHandlingFlags.LOCAL_ONLY
            }, hostname.value, parseInt(port.value))
                .then(() => {
                    Game.Notify("Archipelago", 'You Connected now! You cant Buy Upgrades, you get them from other Players now.');

                    overwriteFunctions();

                    //disable Buying of Upgrades
                    document.getElementById("upgrades").style.pointerEvents = "none";

                    client._socket.onmessage = function (data) {
                        var packet = JSON.parse(data.data);

                        console.log("packet");
                        console.log(packet);

                        if (packet.length === 0) {
                            return;
                        }

                        //PRINT JSON
                        if (packet[0].cmd === "PrintJSON") {
                            if (packet[0].type === "ItemSend" && packet[0].receiving === getPlayerId(client._dataManager._players, name.value)) {
                                var id = packet[0].item.item;
                                console.log("I got an item!" + id);

                                var building = randomProperty(Game.Objects);

                                if (id < 42069649) {
                                    id = id - 42069001;
                                    // execute upgrade
                                    Game.UpgradesById[id].basePrice = 1;
                                    Game.UpgradesById[id].buy();
                                } else if (id === 42069649) { // -1 Gebäude
                                    if (building.amount >= 1) {
                                        building.amount -= 1;
                                    } else {
                                        building.amount = 0;
                                    }
                                    Game.Notify("Archipelago", '-1 ' + building.name);
                                    console.log("-1 Gebäude");
                                } else if (id === 42069650) { // -10 Gebäude
                                    if (building.amount >= 10) {
                                        building.amount -= 10;
                                    } else {
                                        building.amount = 0;
                                    }
                                    Game.Notify("Archipelago", '-10 ' + building.name);
                                    console.log("-10 Gebäude");
                                } else if (id === 42069651) { // -100 Gebäude
                                    if (building.amount >= 100) {
                                        building.amount -= 100;
                                    } else {
                                        building.amount = 0;
                                    }
                                    Game.Notify("Archipelago", '-100 ' + building.name);
                                    console.log("-100 Gebäude");
                                } else if (id === 42069652) { // -10% Cookies
                                    Game.cookies = Game.cookies * 0.9;
                                    console.log("-10% Cookies");
                                } else if (id === 42069653) { // -20% Cookies
                                    Game.cookies = Game.cookies * 0.8;
                                    console.log("-20% Cookies");
                                } else if (id === 42069654) { // -30% Cookies
                                    Game.cookies = Game.cookies * 0.7;
                                    console.log("-30% Cookies");
                                } else if (id === 42069655) { // -40% Cookies
                                    Game.cookies = Game.cookies * 0.6;
                                    console.log("-40% Cookies");
                                } else if (id === 42069656) { // -50% Cookies
                                    Game.cookies = Game.cookies * 0.5;
                                    console.log("-50% Cookies");
                                } else if (id === 42069657) { // -60% Cookies
                                    Game.cookies = Game.cookies * 0.4;
                                    console.log("-60% Cookies");
                                } else if (id === 42069658) { // -70% Cookies
                                    Game.cookies = Game.cookies * 0.3;
                                    console.log("-70% Cookies");
                                } else if (id === 42069659) { // -80% Cookies
                                    Game.cookies = Game.cookies * 0.2;
                                    console.log("-80% Cookies");
                                } else if (id === 42069660) { // -90% Cookies
                                    Game.cookies = Game.cookies * 0.1;
                                    console.log("-90% Cookies");
                                } else if (id === 42069661) { // -100% Cookies
                                    Game.cookies = 0;
                                    console.log("-100% Cookies");
                                }

                                //unnötig?
                                //Game.Notify("Archipelago", "You Recieved "+Game.UpgradesById[id].name);
                            }
                            var msg = packetToText(packet[0].data);
                            if (msg === "") {
                                return;
                            }
                            console.log("MSG: " + msg);
                            Game.Notify("Archipelago", msg);
                        }
                    }
                })
                .catch((error) => {
                    alert(error);
                    connect.disabled = null;
                    hostname.disabled = null;
                    port.disabled = null;
                    name.disabled = null;
                    password.disabled = null;
                })
        } catch (error) {
            connect.disabled = null;
            hostname.disabled = null;
            port.disabled = null;
            name.disabled = null;
            password.disabled = null;
            alert(error);
        }
    };
})();