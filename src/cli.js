import chalk from 'chalk';
import createPrompt from 'prompt-sync';

// Local modules
import * as tahoma from './tahoma.js';

const prompt = createPrompt({ sigint: true });

const VERSION = '1.2.0';
const STORE = {
  devices: {
    updatedAt: null,
    list: [],
  },
};

await displayInteractiveShell();

function outputError(errorMessage) {
  console.error(chalk.red(errorMessage));
}

function displayTitleMessage() {
  console.log(
    `${chalk.white('\n<===')} ${chalk.magenta('S')}${chalk.blue('omfy')} ${chalk.magenta('H')}${chalk.blue('ome')} ${chalk.magenta('C')}${chalk.blue(
      'ontroller'
    )} - ${chalk.cyan('Interactive shell')} ${chalk.white('===>')}`
  );
  console.log('By ' + chalk.cyan('@Coko7') + ' - ' + chalk.yellow(`Version ${VERSION}\n`));
  console.log('🔗 Connected to ' + chalk.green(tahoma.getGatewayHost()) + '\n');
}

function displayHelp() {
  // console.log(chalk.green('<===o===o=== HELP ===o===o===>\n\n'));
  console.log('GENERAL HELP\n');
  console.log(
    `${chalk.white('exec')} ${chalk.red('<cmd>')} ${chalk.red(
      '<devid>'
    )}\texecute the given command on the given device identified by <devid>\n\t\t\tavailable commands: close, down, open, stop, up\n`
  );
  console.log(`${chalk.white('exit')}              \tterminates the interactive shell\n`);
  console.log(`${chalk.white('gate')}              \toutputs the gateway url\n`);
  console.log(`${chalk.white('help')}              \tshows the list of commands\n`);
  console.log(`${chalk.white('list')}              \tget the list of all devices\n\t\t\t-s can be used to list in short format\n`);
  console.log(`${chalk.white('load')} ${chalk.red('<id>')}      \t\tlaunch interactive command shell for the given device\n`);
  console.log(`${chalk.white('quit')}              \talias to exit\n`);
  console.log(`${chalk.white('refresh')}           \trefresh the stored list of devices\n`);
  console.log(`${chalk.white('version')}           \toutputs the cli version to the screen\n`);
}

function displayDeviceHelp() {
  // console.log(chalk.green('<===o===o=== HELP ===o===o===>'));
  console.log('DEVICE HELP\n');
  // console.log(chalk.yellow(`Mode: DEVICE (${device.deviceURL})\n\n`));
  console.log(`${chalk.white('down')} \texecutes "down" action on the current device\n`);
  console.log(`${chalk.white('exit')} \tterminates the device interactive shell\n`);
  console.log(`${chalk.white('help')} \tshows the list of commands available for this device\n`);
  console.log(`${chalk.white('quit')} \talias to exit\n`);
  console.log(`${chalk.white('stop')} \texecutes "stop" action on the current device\n`);
  console.log(`${chalk.white('up')}   \texecutes "up" action on the current device\n`);
}

async function displayInteractiveShell() {
  displayTitleMessage();

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

function getIdFromDeviceUrl(deviceUrl) {
  const idx = deviceUrl.lastIndexOf('/');
  const deviceId = deviceUrl.substring(idx + 1);
  return deviceId;
}

async function refreshDevicesCache() {
  STORE.devices.list = (await tahoma.getDevices()).map((device) => {
    const id = getIdFromDeviceUrl(device.deviceURL);
    device.id = id;
    return device;
  });
  STORE.devices.updatedAt = new Date();
}

async function getDevicesFromCache() {
  if (STORE.devices.updatedAt === null) {
    await refreshDevicesCache();
  }

  return STORE.devices.list;
}

async function parseCommand(command, args) {
  if (command === 'help') {
    displayHelp();
    return 0;
  }

  if (command === 'gate') {
    console.log(tahoma.getGatewayHost());
    return 0;
  }

  if (command === 'refresh') {
    await refreshDevicesCache();
    return 0;
  }

  if (command === 'list') {
    const allDevices = await getDevicesFromCache();

    if (args.length > 1) {
      outputError('list: invalid number of arguments. Try: list [-s]');
      return -1;
    }

    if (args.length === 1) {
      if (args[0] !== '-s') {
        outputError(`list: unrecognized option '${args[0]}'. Try: list [-s]`);
        return -1;
      }

      let i = 0;
      for (let device of allDevices) {
        console.log(`${i++}. ${chalk.blue(device.label)}: ${chalk.green(device.id)}`);
      }

      return 0;
    }

    let i = 0;
    for (let device of allDevices) {
      console.log(`${i++}. ${chalk.blue(device.label)}: ${chalk.green(device.deviceURL)}`);
    }
    return 0;
  }

  if (command === 'exec') {
    if (args.length !== 2) {
      outputError('exec: invalid number of arguments. Try: exec <cmd> <devid>');
      return -1;
    }

    const cmd = args[0];
    const deviceId = args[1];

    const allDevices = await getDevicesFromCache();
    const device = allDevices.find((device) => device.id === deviceId);
    if (!device) {
      outputError(`exec: no such device on home network '${deviceId}'`);
      return -1;
    }

    await tahoma.exec(device, cmd);
    console.log(`Executed '${cmd}' on device ${device.label} ("${device.deviceURL}")`);
    return 0;
  }

  if (command === 'version') {
    console.log(VERSION);
    return 0;
  }

  if (command === 'load') {
    if (args.length !== 1) {
      outputError('load: invalid number of arguments. Try: load <devid>');
      return -1;
    }

    const deviceId = args[0];

    const allDevices = await getDevicesFromCache();
    const device = allDevices.find((device) => device.id === deviceId);
    if (!device) {
      outputError(`load: no such device on home network '${deviceId}'`);
      return -1;
    }

    await displayDeviceInteractiveShell(device);
    return 0;
  }

  outputError(`unknown command '${command}'`);
  return -1;
}

async function displayDeviceInteractiveShell(device) {
  while (true) {
    const userInput = prompt(chalk.magenta(`shc `) + chalk.yellow(`@${device.id} `) + chalk.blue('$ '), {
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
    displayDeviceHelp();
    return 0;
  }

  if (command === 'up' || command === 'down' || command === 'stop') {
    await tahoma.exec(device, command);
    console.log(`Executed '${command}' on device ${device.label} ("${device.deviceURL}")`);
    return 0;
  }

  outputError(`unknown command '${command}'`);
  return -1;
}

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
