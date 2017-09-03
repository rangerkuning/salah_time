# Salah Time
An extension for Gnome Shell. 
Get international Salah (Islamic pray) times and notifications.

Time APIs are gotten from http://muslimsalat.com/api/
Get API Key from http://muslimsalat.com/panel/signup.php change the option from the "extension.js" from this line

```
let stOptions = {
    location: null, //auto detect
    times   : "monthly",
    daylight: null, //auto select
    method  : null, //auto select
    api_key : "xxxxxxx"
};
```

![alt text](https://cdn.pbrd.co/images/GIAeT1h.png "Screenshot")

Not available at gnome extension yet. To use copy the project to `~/.local/share/gnome-shell` and activate from gnome tweak tool.