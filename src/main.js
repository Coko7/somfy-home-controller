import dayjs from 'dayjs';

// Local modules
import * as st from './sun-tracker.js';
import * as tahoma from './tahoma.js';
import logger from './logger.js';

// How much time to wait before checking again for possible events. Expressed in milliseconds.
const EVENT_CHECK_TIMEOUT = 30 * 1000;

await autoDaylightBlinds();

async function autoDaylightBlinds() {
  logger.log({
    level: 'info',
    message: 'Starting auto daylight shutter manager',
  });
  // password must be inputted, if wrong password, throw

  // get all controllable blinds and filter only ones that are allowed to follow daylight cycle (DLC blinds)
  // first check states of all DLC blinds:
  // - DLC blinds that are closed even though it is day should be open
  // - DLC blinds that are open even though it is night should be closed
  // open/close blinds that have the wrong state

  while (true) {
    const schedState = st.getCurrentAction();

    switch (schedState) {
      case st.ShutterSchedule.OpeningTime:
        await OpenAllShutters();
        break;
      case st.ShutterSchedule.ClosingTime:
        await CloseAllShutters();
        break;
      case st.ShutterSchedule.Open:
      case st.ShutterSchedule.Closed:
        break;
      default:
        throw new Error(`Unknown schedule state: ${schedState}`);
    }

    // Pause the script between each check
    await new Promise((resolve) => setTimeout(resolve, EVENT_CHECK_TIMEOUT));
  }
}

async function OpenAllShutters() {
  // Get all shutters that are not moving and that are closed
  const idleClosedShutters = (await getTargetedShutters()).filter((shutter) => {
    const openClose = tahoma.getState(
      shutter,
      tahoma.DeviceState.OpenCloseStr
    )?.value;

    return openClose === 'closed';
  });

  if (idleClosedShutters.length > 0) {
    logger.log({
      level: 'info',
      message: `The ☀️ is rising! ${idleClosedShutters.length} shutters are about to open...`,
    });
    await tahoma.execAll(idleClosedShutters, 'up');
  }
}

async function CloseAllShutters() {
  // Get all shutters that are not moving and that are open
  const idleOpenShutters = (await getTargetedShutters()).filter((shutter) => {
    const openClose = tahoma.getState(
      shutter,
      tahoma.DeviceState.OpenCloseStr
    )?.value;

    return openClose === 'open';
  });

  if (idleOpenShutters.length > 0) {
    logger.log({
      level: 'info',
      message: `The 🌙 is lighting up the dark! ${idleOpenShutters.length} shutters are about to be closed...`,
    });
    await tahoma.execAll(idleOpenShutters, 'down');
  }
}

async function getTargetedShutters(onlyIdle = true) {
  // Following three lines are for testing only
  // const testShutter = await tahoma.GetDeviceFromConfig("shutter_my_room");
  // if (!testShutter) return [];

  // let devices = [testShutter];

  let devices = await tahoma.getDevices();

  if (onlyIdle) {
    devices = devices.filter(
      (d) => tahoma.getState(d, tahoma.DeviceState.MovingBool)?.value === false
    );
  }

  return devices;
}
