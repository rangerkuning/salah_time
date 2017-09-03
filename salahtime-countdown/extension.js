/* Library Imports */

const St        = imports.gi.St;
const Main      = imports.ui.main;
const Lang      = imports.lang;
const Mainloop  = imports.mainloop;
const Clutter   = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Soup      = imports.gi.Soup;

/* API and String Formatter */

let stMenu, now, tomorrow;
let field = ["fajr", "shurooq", "dhuhr", "asr", "maghrib", "isha"];
let label = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

function addZero(val) {
    return (val < 10) ? "0" + val : val;
}
function convertTo24Hour(time) {
    var hours = parseInt(time.substr(0, 2));
    if(time.indexOf('am') != -1 && hours == 12) { time = time.replace('12', '0'); }
    if(time.indexOf('pm')  != -1 && hours < 12) { time = time.replace(hours, (hours + 12)); }
    return time.replace(/(am|pm)/, '');
}
function formatDate(date, schedule) {
    schedule = convertTo24Hour(schedule.toLowerCase());
    return new Date((date.getMonth() + 1) + " " + (date.getDate()) + "," + date.getFullYear() + " " + schedule + ":00").getTime();
}
function formatTimeDiff(startTime, endTime, text) {
    const diffs   = Math.abs  (endTime - startTime) / 1000,
          hours   = Math.floor(diffs / 60 / 60 % 24),
          minutes = Math.floor(diffs / 60 % 60),
          seconds = Math.floor(diffs % 60);
    return addZero(hours)   + ":" + addZero(minutes) + ":" + addZero(seconds) + " to " + text;
}

/* Query Builder */

let stOptions = {
    location: null, //auto detect
    times   : "monthly",
    daylight: null, //auto select
    method  : null, //auto select
    api_key : "021d58478a157cd9fca97deb38626bbd"
};

// Location: city, country, state
// Times: daily, weekly, monthly, yearly
// Daylight Saving: true / false (string)
// Method: [1-7]
// 1 = Egyptian General Authority of Survey 
// 2 = University Of Islamic Sciences, Karachi (Shafi)
// 3 = University Of Islamic Sciences, Karachi (Hanafi) 
// 4 = Islamic Circle of North America 
// 5 = Muslim World League
// 6 = Umm Al-Qura 
// 7 = Fixed Isha
// API Key: user input at http://muslimsalat.com/panel/signup.php 
// or using developer api key as mentioned above

function buildAPIQuery () {
    // Example : 
    // http://muslimsalat.com/london/weekly/12-01-2013/true/5.json?key=api_key

    let url = "http://muslimsalat.com";
        url += (stOptions.location) ? '/' + stOptions.location : '';
        url += (stOptions.times)    ? '/' + stOptions.times    : '';
        url += (stOptions.daylight) ? '/' + stOptions.daylight : '';
        url += (stOptions.method)   ? '/' + stOptions.method   : '';

    return url + ".json";
}

/* Main App */

const stApp = new Lang.Class({
    Name   : 'stApp',
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent(0.0, "Salah Time", false);
        this.buttonText = new St.Label({
            text       : _("Salah Time"),
            y_align    : Clutter.ActorAlign.CENTER,
            style_class: "panel-button-salah"
        });
        this.actor.add_actor(this.buttonText);
        this._loadData();
    },

    _loadData: function () {
        let link    = buildAPIQuery();
        let params  = { api_key: stOptions.api_key };
        let message = Soup.form_request_new_from_hash('GET', link, params);
        let session = new Soup.Session();
            session.queue_message(
                message, 
                Lang.bind(this, function (session, message) {
                    let json = JSON.parse(message.response_body.data);

                    // Add today schedules to popup-menu
                    for(let i = 0; i < field.length; i++) {
                        this.menu.addMenuItem(
                            new PopupMenu.PopupMenuItem(
                                _(label[i] + " " + json.items[0][field[i]])
                            )
                        );
                    }

                    this._refreshUI(json);
                })
            );
    },

    _refreshUI: function (data) {
        delete data.items[0]["date_for"];
        delete data.items[1]["date_for"];
        global.todaySch    = data.items[0];
        global.tomorrowSch = data.items[1];
        this._refresh();
    },

    _refresh: function () {
        now      = new Date();
        tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        
        for (let i = 0; i < 6; i++) {
            now = new Date();

            const curSch = formatDate(now, global.todaySch[field[i]]);
            const endSch = formatDate(now, global.todaySch[field[5]]);
            const tomSch = formatDate(tomorrow, global.tomorrowSch[field[0]])

            // If current time is before the next schedule
            // -> get next schedule
            if (now.getTime() < curSch) {
                let txt = formatTimeDiff(now.getTime(), curSch, label[i]);
                this.buttonText.set_text(txt);
                break;
            }
            // If current time is after end of the day (isha)
            // -> get tomorrow schedule
            else if (now.getTime() > endSch) {
                let txt = formatTimeDiff(now.getTime(), tomSch, label[0]);
                this.buttonText.set_text(txt);
                break;
            }
        }
        this._loop();
    },

    _loop: function () {
        if(this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
        this._timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refresh));
    }
});

function enable() {
    stMenu = new stApp;
    Main.panel.addToStatusArea('tw-indicator', stMenu, 1, "right");
}

function disable() {
    stMenu.destroy();
}
