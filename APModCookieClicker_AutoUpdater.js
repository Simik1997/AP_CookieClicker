// ==UserScript==
// @name         AP_CookieClicker
// @namespace    http://tampermonkey.net/
// @version      2024-12-02
// @description  Archipelago
// @author       SX
// @match        https://orteil.dashnet.org/cookieclicker/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dashnet.org
// @require
// @grant        none
// ==/UserScript==

//Install this in your Browser using TamperMonkey
//Play on: https://orteil.dashnet.org/cookieclicker/

'use strict';

await import('https://cdn.jsdelivr.net/gh/Simik1997/AP_CookieClicker@latest/APModCookieClicker.js'); //jsdelivr is a cdn for github

//if it doesnt Update, purge the cdn cache
//https://www.jsdelivr.com/tools/purge
//Purge > https://cdn.jsdelivr.net/gh/Simik1997/AP_CookieClicker@latest/APModCookieClicker.js
