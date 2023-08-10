import https from 'https';
import axios from 'axios';

import chalk from 'chalk';
import createPrompt from 'prompt-sync';
function complete(commands) {
  return function (str) {
    var i;
    var ret = [];
    for (i = 0; i < commands.length; i++) {
      if (commands[i].indexOf(str) == 0) ret.push(commands[i]);
    }
    return ret;
  };
}
const prompt = createPrompt({ sigint: true });

// local module
import * as cfg from './config.js';
const AppConfig = cfg.getConfig();

const VERSION = '1.0.0';

const STORE = {
  devices: {
    updatedAt: null,
    list: [],
  },
};

// const cert = await fs.readFile("./data/overkiz-root-ca-2048.crt", "utf8");

const gatewaySuffix = AppConfig.gatewaySuffix ?? 'local';
const port = AppConfig.port ?? 8443;

const host = `https://gateway-${AppConfig.pod}.${gatewaySuffix}:${port}`;

export const DeviceType = {
  RollerShutter: 'io:RollerShutterWithLowSpeedManagementIOComponent',
  GarageDoor: 'io:GarageOpenerIOComponent',
};

export const DeviceState = {
  StatusStr: 'core:StatusState',
  OpenCloseStr: 'core:OpenClosedState',
  ClosureInt: 'core:ClosureState',
  MovingBool: 'core:MovingState',
  NameStr: 'core:NameState',
};

const tahoma = axios.create({
  baseURL: host,
  timeout: 1000,
  headers: { Authorization: `Bearer ${AppConfig.token}` },
  httpsAgent: new https.Agent({
    // enabling the following cert causes ERR_TLS_CERT_ALTNAME_INVALID to happen when ran
    // ca: cert,
    rejectUnauthorized: false,
  }),
});

await displayInteractiveShell();

async function displayInteractiveShell() {
  console.log(
    `${chalk.white('<===')} ${chalk.magenta('S')}${chalk.blue('omfy')} ${chalk.magenta('H')}${chalk.blue('ome')} ${chalk.magenta('C')}${chalk.blue(
      'ontroller'
    )} - ${chalk.cyan('Interactive shell')} ${chalk.white('===>')}`
  );
  console.log(chalk.yellow(`Version ${VERSION}\n`));

  await refreshDevicesCache();

  while (true) {
    const userInput = prompt(chalk.magenta('shc ') + chalk.blue('$ '), {
      autocomplete: complete(['exec', 'exit', 'help', 'list', 'load', 'quit', 'refresh', 'version']),
    });

    const args = userInput.split(' ');
    const command = args.shift();

    if (command.length === 0) continue;

    if (command === 'exit' || command === 'quit') break;
    const success = await parseCommand(command, args);
  }
}

async function displayDeviceInteractiveShell(device) {
  while (true) {
    const userInput = prompt(chalk.magenta(`shc (${device.deviceURL}) `) + chalk.blue('$ '), {
      autocomplete: complete(['down', 'exit', 'help', 'quit', 'up']),
    });

    const args = userInput.split(' ');
    const command = args.shift();

    if (command.length === 0) continue;

    if (command === 'exit' || command === 'quit') break;
    const success = await parseDeviceCommand(device, command, args);
  }
}

async function parseDeviceCommand(device, command, args) {
  if (command === 'help') {
    console.log(chalk.green('<===o===o=== HELP ===o===o===>'));
    console.log(chalk.yellow(`Mode: DEVICE (${device.deviceURL})\n\n`));
    console.log('down              \texecutes "down" action on the current device\n');
    console.log('exit              \tterminates the device interactive shell\n');
    console.log('help              \tshows the list of commands available for this device\n');
    console.log('quit              \talias to exit\n');
    console.log('stop              \texecutes "stop" action on the current device\n');
    console.log('up                \texecutes "up" action on the current device\n');

    return 0;
  }

  if (command === 'up' || command === 'down' || command === 'stop') {
    await exec(device, command);
    console.log(`Executed '${command}' on device ${device.label} ("${device.deviceURL}")`);
    return 0;
  }

  console.error(chalk.red(`unknown command '${command}'`));
  return -1;
}

function getIdFromDeviceUrl(deviceUrl) {
  const idx = deviceUrl.lastIndexOf('/');
  const deviceId = deviceUrl.substring(idx + 1);
  return deviceId;
}

async function refreshDevicesCache() {
  STORE.devices.list = await getDevices();
  STORE.devices.updatedAt = new Date();
}

async function getDevicesCached() {
  if (STORE.devices.updatedAt === null) {
    await refreshDevicesCache();
  }

  return STORE.devices.list;
}

async function parseCommand(command, args) {
  if (command === 'help') {
    console.log(chalk.green('<===o===o=== HELP ===o===o===>\n\n'));
    console.log(
      `exec ${chalk.red('<cmd>')} ${chalk.red(
        '<devid>'
      )}\texecute the given command on the given device identified by <devid>\n\t\t\tavailable commands: close, down, open, stop, up\n`
    );
    console.log('exit              \tterminates the interactive shell\n');
    console.log('help              \tshows the list of commands\n');
    console.log(`list              \tget the list of all devices\n\t\t\t-s can be used to list in short format\n`);
    console.log(`load ${chalk.red('<id>')}      \t\tlaunch interactive command shell for the given device\n`);
    console.log('quit              \talias to exit\n');
    console.log('refresh           \trefresh the stored list of devices\n');
    console.log('version           \tOutputs the shell version to the screen\n');

    return 0;
  }

  if (command === 'refresh') {
    await refreshDevicesCache();
    return 0;
  }

  if (command === 'list') {
    const allDevices = await getDevicesCached();
    const deviceDtos = allDevices.map((deviceFullJson) => {
      return {
        label: deviceFullJson.label,
        url: deviceFullJson.deviceURL,
        id: getIdFromDeviceUrl(deviceFullJson.deviceURL),
      };
    });

    // all devices
    if (args.length === 0) {
      let i = 0;
      for (let device of deviceDtos) {
        console.log(`${i++}. ${chalk.blue(device.label)}: ${chalk.green(device.url)}`);
      }

      return 0;
    } else if (args.length === 1 && args[0] === '-s') {
      let i = 0;
      for (let device of deviceDtos) {
        console.log(`${i++}. ${chalk.blue(device.label)}: ${chalk.green(device.id)}`);
      }

      return 0;
    }
  }

  if (command === 'exec') {
    if (args.length !== 2) {
      console.error(chalk.red('exec: invalid number of arguments. Try: exec <cmd> <devid>'));
      return -1;
    }

    const cmd = args[0];
    const deviceId = args[1];

    const deviceURL = `io://${AppConfig.pod}/${deviceId}`;

    const allDevices = await getDevicesCached();
    const device = allDevices.find((device) => device.deviceURL === deviceURL);
    if (!device) {
      console.error(chalk.red(`exec: no such device on home network '${deviceId}'`));
      return -1;
    }

    await exec(device, cmd);
    console.log(`Executed '${cmd}' on device ${device.label} ("${device.deviceURL}")`);
    return 0;

    // if (cmd === 'up') {
    //   await exec(device, 'up');
    //   return 0;
    // }

    // if (cmd === 'down') {
    //   await exec(device, 'down');
    //   console.log(`Executed '${cmd}' on device ${device.label} ("${device.deviceURL}")`);
    //   return 0;
    // }

    // if (cmd === 'stop') {
    //   console.log(`Executed '${cmd}' on device ${device.label} ("${device.deviceURL}")`);
    //   return 0;
    // }

    // console.error(chalk.red(`exec: no such command '${cmd}'`));
    // return -1;
  }

  if (command === 'version') {
    console.log(VERSION);
    return 0;
  }

  if (command === 'load') {
    if (args.length !== 1) {
      console.error(chalk.red('load: invalid number of arguments. Try: load <devid>'));
      return -1;
    }

    const deviceId = args[0];
    const deviceURL = `io://${AppConfig.pod}/${deviceId}`;

    const allDevices = await getDevicesCached();
    const device = allDevices.find((device) => device.deviceURL === deviceURL);
    if (!device) {
      console.error(chalk.red(`load: no such device on home network '${deviceId}'`));
      return -1;
    }

    await displayDeviceInteractiveShell(device);
    return 0;
  }

  console.error(chalk.red(`unknown command '${command}'`));
  return -1;
}

export async function getDevices(typeFilter = null) {
  const response = await tahoma.get('/enduser-mobile-web/1/enduserAPI/setup');
  let devices = response.data.devices;
  if (typeFilter) {
    devices = devices.filter((d) => d.controllableName === typeFilter);
  }
  return devices;
}

// export async function GetDeviceFromConfig(id) {
//   const device = AppConfig.devices.find((d) => d.id === id);
//   if (!device) return null;

//   return getDevice(device.url);
// }

// export async function getDevice(deviceUrl) {
//   try {
//     const encodeDevUrl = encodeURIComponent(deviceUrl);
//     const response = await tahoma.get(
//       `/enduser-mobile-web/1/enduserAPI/setup/devices/${encodeDevUrl}`
//     );
//     return response.data;
//   } catch (err) {
//     logger.log({
//       level: 'error',
//       message: `Failed to get single device with URL '${deviceUrl}': ${err}`,
//     });
//   }
// }

// export function getState(device, stateName) {
//   return device.states.find((s) => s.name === stateName);
// }

export async function exec(device, cmd) {
  // logger.log({
  //   level: 'info',
  //   message: `Executing '${cmd}' on "${device.label}"...`,
  // });
  await tahoma.post('/enduser-mobile-web/1/enduserAPI/exec/apply', {
    label: `Exec ${cmd} on '${device.label}'`,
    actions: [
      {
        commands: [
          {
            name: cmd,
            parameters: [],
          },
        ],
        deviceURL: device.deviceURL,
      },
    ],
  });
}

// export async function execAll(devices, cmd) {
//   if (devices.length === 0) return;

//   const allActions = [];
//   for (let dev of devices) {
//     allActions.push({
//       commands: [
//         {
//           name: cmd,
//           parameters: [],
//         },
//       ],
//       deviceURL: dev.deviceURL,
//     });

//     logger.log({
//       level: 'info',
//       message: `Executing '${cmd}' on "${dev.label}"...`,
//     });
//   }

//   await tahoma.post('/enduser-mobile-web/1/enduserAPI/exec/apply', {
//     label: `Exec ${cmd} on ${devices.length} devices`,
//     actions: allActions,
//   });
// }
