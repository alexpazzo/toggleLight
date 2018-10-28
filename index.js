const gpio = require("gpio");
const hue = require("node-hue-api");
const pin = 4

//{"devicetype":"raspberry#cantina "}
const username = "azGwnYlzV76mr6NbV2A2cAv7cEnkjztzomJxjlyl"


// Calling export with a pin number will export that header and return a gpio header instance
var gpio4 = gpio.export(pin, {
    // When you export a pin, the default direction is out. This allows you to set
    // the pin value to either LOW or HIGH (3.3V) from your program.
    //direction: gpio.DIRECTION.OUT,
    direction: gpio.DIRECTION.IN,

    // set the time interval (ms) between each read when watching for value changes
    // note: this is default to 100, setting value too low will cause high CPU usage
    interval: 100,

    // Due to the asynchronous nature of exporting a header, you may not be able to
    // read or write to the header right away. Place your logic in this ready
    // function to guarantee everything will get fired properly
    ready: async function () {
        console.log(`Exported Pin ${pin}`);

        console.log("Searching Hue Bridge");
        try {
            const api = await searchAndConneectBridge();

            gpio4.on("change", async function (val) {
                // Switch close val = 1
                console.log(val);
                if (val) {
                    console.log("Switch Pressed");
                    await toggleLight(api, "Cantina");
                }
            });

        } catch (error) {
            console.error(error);
        }
    }
});


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

    if (interessedLights.length <= 0) throw new Error("No lights to toggle");

    for (let light of interessedLights) {
        let state;
        if (light.state.on)
            state = hue.lightState.create().off();
        else
            state = hue.lightState.create().on();

        await api.setLightState(light.id, state)

    }


}