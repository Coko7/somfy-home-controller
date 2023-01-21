import https from "https";
import fs from "fs/promises";
import axios from "axios";
import config from "./config.json" assert { type: "json" };

const cert = await fs.readFile("./data/overkiz-root-ca-2048.crt", "utf8");

const suff = config.gatewaySuffix ?? "local";
const port = config.port ?? 8443;

const host = `https://gateway-${config.pod}.${suff}:${port}`;

const tahoma = axios.create({
  baseURL: host,
  timeout: 1000,
  headers: { Authorization: `Bearer ${config.token}` },
  httpsAgent: new https.Agent({
    // enabling the following cert causes ERR_TLS_CERT_ALTNAME_INVALID to happen when ran
    // ca: cert,
    rejectUnauthorized: false,
  }),
});

console.log("Everything will close at night time!");
while (true) {
  if (isItNight()) {
    // console.log("ITS ALL GOING DOWN!!!!");
    // const devices = await getDevices();
    // await execAllBlinds(devices, "down");
    break;
  }
}

async function getDevices() {
  try {
    const response = await tahoma.get("/enduser-mobile-web/1/enduserAPI/setup");
    return response.data.devices;
  } catch (err) {
    console.error(err);
  }
}

async function execAllBlinds(devices, cmd) {
  const blinds = devices.filter(
    (dev) =>
      dev.definition.widgetName ===
      "PositionableRollerShutterWithLowSpeedManagement"
  );

  const actions = [];
  for (let bl of blinds) {
    actions.push({
      commands: [
        {
          name: cmd,
          parameters: [],
        },
      ],
      deviceURL: bl.deviceURL,
    });
    console.log(`Closing "${bl.label}"...`);
  }

  tahoma.post("/enduser-mobile-web/1/enduserAPI/exec/apply", {
    label: `On all: ${cmd}`,
    actions: actions,
  });
}

function isItNight() {
  const night = [17, 45];

  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();

  return hours > night[0] || (hours === night[0] && mins >= night[1]);
}
