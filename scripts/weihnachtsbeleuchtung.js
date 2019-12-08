// AN - Bei Sonnenuntergang
schedule({astro: "sunsetStart", shift: 0}, function () {
  setState("hs100.0.192_168_1_70.state"/*TP01*/, true);
  setStateDelayed("hs100.0.192_168_1_71.state"/*TP02*/, true, 1000, false);
  setStateDelayed("hs100.0.192_168_1_72.state"/*TP03*/, true, 2000, false);
  setStateDelayed("zigbee.0.7cb03eaa00acff43.state"/*Switch state*/, true, 3000, false);
  setStateDelayed("zigbee.0.7cb03eaa00ad0664.state"/*Switch state*/, true, 4000, false);
});
// AUS - Um 00:00 Uhr
schedule("0 0 * * *", function () {
  setState("hs100.0.192_168_1_70.state"/*TP01*/, false);
  setStateDelayed("hs100.0.192_168_1_71.state"/*TP02*/, false, 1000, false);
  setStateDelayed("hs100.0.192_168_1_72.state"/*TP03*/, false, 2000, false);
  setStateDelayed("zigbee.0.7cb03eaa00acff43.state"/*Switch state*/, false, 3000, false);
  setStateDelayed("zigbee.0.7cb03eaa00ad0664.state"/*Switch state*/, false, 4000, false);
});
// AN - Um 05:00 Uhr
schedule("30 5 * * *", function () {
  setState("hs100.0.192_168_1_70.state"/*TP01*/, true);
  setStateDelayed("hs100.0.192_168_1_71.state"/*TP02*/, true, 1000, false);
  setStateDelayed("hs100.0.192_168_1_72.state"/*TP03*/, true, 2000, false);
  setStateDelayed("zigbee.0.7cb03eaa00acff43.state"/*Switch state*/, true, 3000, false);
  setStateDelayed("zigbee.0.7cb03eaa00ad0664.state"/*Switch state*/, true, 4000, false);
});
// AUS - Sonnenaufgang
schedule({astro: "sunriseEnd", shift: 0}, function () {
  setState("hs100.0.192_168_1_70.state"/*TP01*/, false);
  setStateDelayed("hs100.0.192_168_1_71.state"/*TP02*/, false, 1000, false);
  setStateDelayed("hs100.0.192_168_1_72.state"/*TP03*/, false, 2000, false);
  setStateDelayed("zigbee.0.7cb03eaa00acff43.state"/*Switch state*/, false, 3000, false);
  setStateDelayed("zigbee.0.7cb03eaa00ad0664.state"/*Switch state*/, false, 4000, false);
});

