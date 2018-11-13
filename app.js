
const hue = require("node-hue-api");
const ioHook = require('iohook');

//{"devicetype":"raspberry#cantina "}
const username = "azGwnYlzV76mr6NbV2A2cAv7cEnkjztzomJxjlyl";
const room = "Cantina";

// make `process.stdin` begin emitting "keypress" events


(async () => {
    console.log("Searching Hue Bridge");

    const api = await searchAndConneectBridge();
    ioHook.on('keyup', event => {
        console.log(event);
        if (event.keycode == 8) {
            console.log("Enter Pressed");
            await toggleLight(api, room);
        }
    });

    // Register and start hook
    ioHook.start();
})();


async function searchAndConneectBridge() {
    //Search hue bridge
    const bridge = await hue.nupnpSearch();
    console.log(`Found this bridge:\n ${JSON.stringify(bridge)}`);
    //connecting to the first one
    return new hue.HueApi(bridge[0].ipaddress, username);
}

async function getLightOfGroup(api, group) {
    const fullstate = await api.getFullState();
    console.log();

    for (let groupKey of Object.keys(fullstate.groups)) {
        const groupState = fullstate.groups[groupKey];
        if (groupState.name == group) return groupState.lights
    }
}


async function toggleLight(api, group) {
    const lightsFoundId = await getLightOfGroup(api, group);
    const allLightsStatus = await api.lights();
    const interessedLights = []

    // search for the correct light
    for (let groupLights of Object.keys(allLightsStatus.lights)) {
        const light = allLightsStatus.lights[groupLights];
        if (lightsFoundId.includes(light.id))
            interessedLights.push(light);
    }

    //check if there are some light to Switch
    if (interessedLights.length <= 0) throw new Error("No lights to toggle");

    //chech the state of all lights and reverse it
    for (let light of interessedLights) {
        let state;
        if (light.state.on)
            state = hue.lightState.create().off();
        else
            state = hue.lightState.create().on();

        await api.setLightState(light.id, state)
    }


}