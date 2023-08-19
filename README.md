# 🏠 somfy-home-controller

Simple Node app to automatically control your Somfy shutters based on your local day cycle.

## 🧰 Requirements

Make sure you have Node.js v16.18.0 installed. This project uses [Import Assertions](https://nodejs.org/api/esm.html#json-modules) and when I tested with Node v16.**14**.0 it did not work, so I had to upgrade to v16.**18**.0.

I am not a Node expert so maybe there is a cleaner way to handle JSON file import within an ES6 module but this is working for now.

## 🛠️ Setup

1. Clone the repository and open it `cd somfy-home-controller`
2. Add a new file `shc-config.json` at the project root:
```json
{
  "somfyUrl": "ha101-1.overkiz.com",
  "pod": "XXXX-XXXX-XXXX",
  "port": 8443,
  "gatewaySuffix": "home",
  "token": "PUT_YOUR_SUPER_SECRET_TOKEN_HERE",
  "location": {
    "latitude": 0.0,
    "longitude": 0.0,
    "altitude": 0,
    "timezone": "Europe/Paris"
  },
  "devices": [
    {
      "protocol": "io",
      "id": "shutter_kitchen",
      "name": "Volet Cuisine",
      "url": "io://XXXX-XXXX-XXXX//1111111"
    },
    {
      "protocol": "io",
      "id": "shutter_kitchen_door",
      "name": "Volet Porte Cuisine",
      "url": "io://XXXX-XXXX-XXXX//2222222"
    },
    {
      "protocol": "io",
      "id": "shutter_room",
      "name": "Volet Chambre",
      "url": "io://XXXX-XXXX-XXXX/3333333"
    }
  ]
}
```
3. Set the `pod` and `token` to link to your local Tahoma API
4. Fill in the location data with (`altitude` and `timezone` are optional). *But timezone is not supported yet anyway...*
5. Setup the devices you want to control automatically. Only shutters are supported.
6. Once your config file is all set, you can test the script with `npm start`. But if you want to have this script running all day, you might want to use actual libraries such as [pm2](https://www.npmjs.com/package/pm2) or [forever](https://www.npmjs.com/package/forever). In case you are using pm2, you can start the script in background like this:

    ```bash
    pm2 start npm --name "my-somfy-home-controller" -- start 
    ```

## 💻 Command Line Interface

It is also possible to use a CLI to manually interact with the Tahoma box.
To launch the CLI, simply enter `npm run cli` in your shell.
Here is what the latest version of the CLI looks like:

![image](https://github.com/Coko7/somfy-home-controller/assets/91132775/7a464624-6d61-4760-a88d-65aaa27432a8)

If you want full control over a device, you should control it via the _device mode_.

You can enter _device mode_ by typing `load <id>` in the general CLI.
The `<id>` refers to the combination of digits after the gateway pin in the device URL.

## 📚 Resources

- GitHub repo of [Somfy-TaHoma-Developer-Mode](https://github.com/Somfy-Developer/Somfy-TaHoma-Developer-Mode)
- Swagger UI for [local gateway API](https://somfy-developer.github.io/Somfy-TaHoma-Developer-Mode/)
- Get yearly daylight cycles on: https://dev.timeanddate.com/time/
