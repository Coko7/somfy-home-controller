import https from 'https';
import axios from 'axios';

// Local modules
import logger from './logger.js';
import * as cfg from './config.js';
const AppConfig = cfg.getConfig();

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

export function getGatewayHost() {
  return host;
}

export async function getDevices(typeFilter = null) {
  try {
    const response = await tahoma.get('/enduser-mobile-web/1/enduserAPI/setup');
    let devices = response.data.devices;
    if (typeFilter) {
      devices = devices.filter((d) => d.controllableName === typeFilter);
    }
    return devices;
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Failed to get all devices: ${err}`,
    });
  }
}

export async function GetDeviceFromConfig(id) {
  const device = AppConfig.devices.find((d) => d.id === id);
  if (!device) return null;

  return getDevice(device.url);
}

export async function getDevice(deviceUrl) {
  try {
    const encodeDevUrl = encodeURIComponent(deviceUrl);
    const response = await tahoma.get(
      `/enduser-mobile-web/1/enduserAPI/setup/devices/${encodeDevUrl}`
    );
    return response.data;
  } catch (err) {
    logger.log({
      level: 'error',
      message: `Failed to get single device with URL '${deviceUrl}': ${err}`,
    });
  }
}

export function getState(device, stateName) {
  return device.states.find((s) => s.name === stateName);
}

export async function exec(device, cmd, params = []) {
  logger.log({
    level: 'info',
    message: `Executing '${cmd}' on "${device.label}"...`,
  });

  await tahoma.post('/enduser-mobile-web/1/enduserAPI/exec/apply', {
    label: `Exec ${cmd} on '${device.label}'`,
    actions: [
      {
        commands: [
          {
            name: cmd,
            parameters: params,
          },
        ],
        deviceURL: device.deviceURL,
      },
    ],
  });
}

export async function execAll(devices, cmd, params = []) {
  if (devices.length === 0) return;

  const allActions = [];
  for (let dev of devices) {
    allActions.push({
      commands: [
        {
          name: cmd,
          parameters: params,
        },
      ],
      deviceURL: dev.deviceURL,
    });

    logger.log({
      level: 'info',
      message: `Executing '${cmd}' on "${dev.label}"...`,
    });
  }

  await tahoma.post('/enduser-mobile-web/1/enduserAPI/exec/apply', {
    label: `Exec ${cmd} on ${devices.length} devices`,
    actions: allActions,
  });
}
