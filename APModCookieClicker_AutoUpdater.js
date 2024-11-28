//AT THE MOMENT ONlY FOR SPECTRE, NOT PUBLIC!

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

//Install this in your Browser using TamperMonkey
//Play on: https://orteil.dashnet.org/cookieclicker/

const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, CREATE_AS_HINT_MODE, CLIENT_STATUS, CONNECTION_STATUS, CLIENT_PACKET_TYPE, SetOperationsBuilder } = await import("https://unpkg.com/archipelago.js@1.0.0/dist/archipelago.js");
'use strict';

const scriptCC = document.createElement('script')
scriptCC.src = 'https://sommer-alexander.de/cc/APModCookieClicker.js';
scriptCC.type = 'text/javascript';
document.head.append(scriptCC);
