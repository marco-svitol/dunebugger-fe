// Test sequence from the user's example
const testSequence = {
  "sequence": [
    {
      "time": "0",
      "command": "audio",
      "action": "playSfx",
      "parameter": "2009.mp3"
    },
    {
      "time": "0",
      "command": "switch",
      "action": "LuceStartButton",
      "parameter": "on"
    },
    {
      "time": "10",
      "command": "dmx",
      "action": "set",
      "parameter": "10 red"
    },
    {
      "time": "12",
      "command": "dmx",
      "action": "fade",
      "parameter": "40 red 6"
    },
    {
      "time": "15",
      "command": "dmx",
      "action": "dimmer",
      "parameter": "13 0.4"
    },
    {
      "time": "19",
      "command": "dmx",
      "action": "fade_dimmer",
      "parameter": "40 0.6"
    },
    {
      "time": "295",
      "command": "dmx",
      "action": "set",
      "parameter": "10 blue"
    },
    {
      "time": "298",
      "command": "dmx",
      "action": "fade",
      "parameter": "13 green 60"
    },
    {
      "time": "330",
      "command": "switch",
      "action": "LuceStartButton",
      "parameter": "on"
    }
  ]
};

// Test calculations
console.log("Test Sequence Analysis:");
console.log("======================");

const totalTime = Math.max(...testSequence.sequence.map((ev) => parseFloat(ev.time)));
console.log(`Total sequence duration: ${totalTime}s`);

const dmxEvents = testSequence.sequence.filter((ev) => ev.command === "dmx");
console.log(`\nDMX Events:`);

dmxEvents.forEach((ev) => {
  const startTime = parseFloat(ev.time);
  
  if (ev.action === 'fade' || ev.action === 'fade_dimmer') {
    const parts = ev.parameter.split(' ');
    const duration = parts[2] ? parseFloat(parts[2]) : 2;
    const actualEndTime = startTime + duration;
    const exceedsTimeline = actualEndTime > totalTime;
    
    console.log(`- ${ev.action} at ${startTime}s, duration ${duration}s, ends at ${actualEndTime}s ${exceedsTimeline ? '⚠️ EXCEEDS TIMELINE' : '✅ OK'}`);
  } else {
    console.log(`- ${ev.action} at ${startTime}s (instant)`);
  }
});

console.log(`\nProblem case:`);
console.log(`DMX 13 fade at 298s with 60s duration ends at 358s`);
console.log(`Timeline total is ${totalTime}s`);
console.log(`Overflow: ${358 - totalTime}s beyond timeline`);