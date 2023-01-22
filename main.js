import dayjs from "dayjs";

// Local modules
import * as dlc from "./daylight-cycles.js";
import * as tahoma from "./tahoma.js";

await autoDaylightBlinds();

async function autoDaylightBlinds() {
  console.log(
    `[${dayjs().format(
      "DD/MM/YYYY HH:mm:ss"
    )}] Starting auto daylight shutter manager`
  );
  // password must be inputted, if wrong password, throw

  // get all controllable blinds and filter only ones that are allowed to follow daylight cycle (DLC blinds)
  // first check states of all DLC blinds:
  // - DLC blinds that are closed even though it is day should be open
  // - DLC blinds that are open even though it is night should be closed
  // open/close blinds that have the wrong state

  while (true) {
    const todState = dlc.getTodayState();

    switch (todState) {
      case dlc.DayState.Sunrise:
        // Get all shutters that are not moving and that are closed
        const idleClosedShutters = (await getTargetedShutters()).filter(
          (shutter) => {
            const openClose = tahoma.getState(
              shutter,
              tahoma.DeviceState.OpenCloseStr
            )?.value;

            return openClose === "closed";
          }
        );

        if (idleClosedShutters.length > 0) {
          console.log(
            `[${dayjs().format("DD/MM/YYYY HH:mm:ss")}] The ☀️ is rising! ${
              idleClosedShutters.length
            } shutters are about to open...`
          );
          await tahoma.execAll(idleClosedShutters, "up");
        }
        break;
      case dlc.DayState.Sunset:
        // Get all shutters that are not moving and that are open
        const idleOpenShutters = (await getTargetedShutters()).filter(
          (shutter) => {
            const openClose = tahoma.getState(
              shutter,
              tahoma.DeviceState.OpenCloseStr
            )?.value;

            return openClose === "open";
          }
        );

        if (idleOpenShutters.length > 0) {
          console.log(
            `[${dayjs().format(
              "DD/MM/YYYY HH:mm:ss"
            )}] The 🌙 is lighting up the dark! ${
              idleOpenShutters.length
            } shutters are about to be closed...`
          );
          await tahoma.execAll(idleOpenShutters, "down");
        }
        break;
      case dlc.DayState.Day:
      case dlc.DayState.Night:
        break;
      default:
        throw new Error(`Unknown day state: ${todState}`);
    }

    // Pause the script for 30 seconds between each check
    await new Promise((resolve) => setTimeout(resolve, 30000));
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
