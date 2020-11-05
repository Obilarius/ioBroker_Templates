const BodenfeuchteSensorObj = "mqtt.0.BewaesserungsSteuerung.SoilMoistureSensor_01.BodenFeuchtigkeit_in_%";
const BodenfeuchteGrenze = 60;


/**
 * Steuerung der Bewässerungsanlage
 */
function bewaesserungSteuerung(kreis, aktivieren) {
  var gpio;
  if (kreis == 1) {
    gpio = 5
  } else if (kreis == 2) {
    gpio = 4
  }

  var status = 1;
  if (aktivieren) {
    status = 0
  }

  try {
    require("request")(('http://192.168.1.41/control?cmd=gpio,' + gpio + ',' + status)).on("error", function (e) {
      log("ERROR Request: " + e);
    // log("STATUS: Kreis " + kreis + "; Aktiviert: " +aktivieren);
    });
  } catch (e) {
    log("ERROR: " + e);
  }
}


/**
 * Legt die Felder zum Speichern der Werte an
 */
function Felder_anlegen() {
  createState('javascript.0.Bewaesserung', {
    name: "Bewaesserung"
  });
  createState('javascript.0.Bewaesserung.ManuelleBewaesserung', false, {
    name: "ManuelleBewaesserung",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.AutomatischeBewaesserung', false, {
    name: "AutomatischeBewaesserung",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.BewaesserungAktiv', false, {
    name: "BewaesserungAktiv",
    type: "boolean"
  });

  createState('javascript.0.Bewaesserung.BewaesserungsdauerKreis1', 15, {
    name: "BewaesserungsdauerKreis1"
  });
  createState('javascript.0.Bewaesserung.BewaesserungsdauerKreis2', 30, {
    name: "BewaesserungsdauerKreis2"
  });
  createState('javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis1', 10, {
    name: "ManuelleBewaesserungsDauerKreis1",
  });
  createState('javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis2', 10, {
    name: "ManuelleBewaesserungsDauerKreis2",
  });

  createState('javascript.0.Bewaesserung.RestdauerIn%', 0, {
    name: "RestdauerIn%"
  });
  createState('javascript.0.Bewaesserung.RestdauerInMinuten', 0, {
    name: "RestdauerInMinuten"
  });
  createState('javascript.0.Bewaesserung.Laufzaehler', 0, {
    name: "Laufzaehler"
  });

  createState('javascript.0.Bewaesserung.Tage.Montag', false, {
    name: "Montag",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Dienstag', false, {
    name: "Dienstag",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Mittwoch', false, {
    name: "Mittwoch",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Donnerstag', false, {
    name: "Donnerstag",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Freitag', false, {
    name: "Freitag",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Samstag', false, {
    name: "Samstag",
    type: "boolean"
  });
  createState('javascript.0.Bewaesserung.Tage.Sonntag', false, {
    name: "Sonntag",
    type: "boolean"
  });

  createState('javascript.0.Bewaesserung.Tage.MontagZeit1', {
    name: "MontagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.MontagZeit2', {
    name: "MontagZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.DienstagZeit1', {
    name: "DienstagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.DienstagZeit2', {
    name: "DienstagZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.MittwochZeit1', {
    name: "MittwochZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.MittwochZeit2', {
    name: "MittwochZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.DonnerstagZeit1', {
    name: "DonnerstagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.DonnerstagZeit2', {
    name: "DonnerstagZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.FreitagZeit1', {
    name: "FreitagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.FreitagZeit2', {
    name: "FreitagZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.SamstagZeit1', {
    name: "SamstagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.SamstagZeit2', {
    name: "SamstagZeit2"
  });
  createState('javascript.0.Bewaesserung.Tage.SonntagZeit1', {
    name: "SonntagZeit1"
  });
  createState('javascript.0.Bewaesserung.Tage.SonntagZeit2', {
    name: "SonntagZeit2"
  });

}


Felder_anlegen();

// Initiale States
setState("javascript.0.Bewaesserung.ManuelleBewaesserung", false);
setState("javascript.0.Bewaesserung.BewaesserungAktiv", false);
setState("javascript.0.Bewaesserung.AutomatischeBewaesserung", false);

function Telegram(message) {
  sendTo("telegram", "send", {
    text: message
  });
}

var Abschaltautomatik, Einschaltzeitpunkt, timeout;

// Einschaltzeitpunkt finden
Einschaltzeitpunkt = schedule('* * * * * *', function () {

  // Wenn Automatische Bewässerung aktiv und Manuelle Bewässerung nicht aktiv
  if (getState("javascript.0.Bewaesserung.ManuelleBewaesserung").val == false && getState("javascript.0.Bewaesserung.AutomatischeBewaesserung").val == true) {

    var actualDay = formatDate(new Date(), "WW", "de");
    var dayEnabled = getState("javascript.0.Bewaesserung.Tage." + actualDay).val;

    if (dayEnabled) {
      var actualTime = formatDate(new Date(), "hh:mm:ss")
      var time1 = getState("javascript.0.Bewaesserung.Tage." + actualDay + "Zeit1").val;
      var time2 = getState("javascript.0.Bewaesserung.Tage." + actualDay + "Zeit2").val

      if (time1 == actualTime || time2 == actualTime) {
        // Bewässerung starten

        if (getState(BodenfeuchteSensorObj).val <= BodenfeuchteGrenze) {
          setState("javascript.0.Bewaesserung.BewaesserungAktiv", true, true);
          bewaesserungSteuerung(1, true);
          Telegram("Bewässerung wird gestartet");
        } else {
          Telegram("Bodenfeuchtigkeit zu hoch. Bewässerung wird ausgesetzt.");
        }
      }
    }

  }
});


// Abschalten nach festgelegter Zeit
on({
  id: 'javascript.0.Bewaesserung.BewaesserungAktiv',
  change: "ne"
}, function (obj) {
  var value = obj.state.val;
  var oldValue = obj.oldState.val;

  // Wenn Bewässerung aktiv
  if (value == true) {
    setState("javascript.0.Bewaesserung.Laufzaehler", 0);
    setState("javascript.0.Bewaesserung.RestdauerIn%", 0);

    // Dauer automatische Bewässerung
    var dauerKreis1 = parseInt(getState("javascript.0.Bewaesserung.BewaesserungsdauerKreis1").val);
    var dauerKreis2 = parseInt(getState("javascript.0.Bewaesserung.BewaesserungsdauerKreis2").val);

    // Dauer wenn manuell bewässert wird
    var manuell = getState("javascript.0.Bewaesserung.ManuelleBewaesserung").val
    if (manuell) {
      dauerKreis1 = parseInt(getState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis1").val);
      dauerKreis2 = parseInt(getState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis2").val);
    }

    var bewaesserungsdauerSumme = dauerKreis1 + dauerKreis2;
    setState("javascript.0.Bewaesserung.RestdauerInMinuten", bewaesserungsdauerSumme);

    // Jede Minute
    Abschaltautomatik = schedule('* * * * *', function () {
        var Laufzähler = getState("javascript.0.Bewaesserung.Laufzaehler").val

        log("Laufzähler - " + Laufzähler + " min");
        

        // Ende Kreis 2 // Teil 2
        if (Laufzähler >= bewaesserungsdauerSumme) {
            bewaesserungSteuerung(2, false);
            log("Kreis 2 - Teil 2 aus");

            setState("javascript.0.Bewaesserung.BewaesserungAktiv", false);

            if (manuell) {
                setState("javascript.0.Bewaesserung.ManuelleBewaesserung", false);
                Telegram("Manuelle Bewässerung wurde beendet");
            } else {
                Telegram("Bewässerung wurde beendet");
            }
        }
        // Ende Kreis 1 // Teil 2
        else if (Laufzähler >= dauerKreis1 + (dauerKreis2 / 2)) {
            bewaesserungSteuerung(1, false);
            bewaesserungSteuerung(2, true);
            log("Kreis 1 - Teil 2 aus");
        }
        // Ende Kreis 2 // Teil 1
        else if (Laufzähler >= ((dauerKreis1 / 2) + (dauerKreis2 / 2)) ) {
            bewaesserungSteuerung(2, false);
            bewaesserungSteuerung(1, true);
            log("Kreis 2 - Teil 1 aus");
        }
        // Ende Kreis 1 // Teil 1
        else if (Laufzähler >= dauerKreis1 / 2) {
            bewaesserungSteuerung(1, false);
            bewaesserungSteuerung(2, true);
            log("Kreis 1 - Teil 1 aus");
        }

        // Noch kein Ende
        if (getState("javascript.0.Bewaesserung.Laufzaehler").val < bewaesserungsdauerSumme) {

            setState("javascript.0.Bewaesserung.Laufzaehler", (getState("javascript.0.Bewaesserung.Laufzaehler").val + 1), true);
            setState("javascript.0.Bewaesserung.RestdauerInMinuten", (getState("javascript.0.Bewaesserung.RestdauerInMinuten").val - 1), true);

            // timeout = setTimeout(function () {
            // log("PROZENT: " + ((parseInt(getState("javascript.0.Bewaesserung.Laufzaehler").val) + 1) / bewaesserungsdauerSumme) * 100);
            setState("javascript.0.Bewaesserung.RestdauerIn%", (((parseInt(getState("javascript.0.Bewaesserung.Laufzaehler").val) +1) / bewaesserungsdauerSumme) * 100), true);
            // }, 1000);
        }
    });

  }
  // Bewässerung nicht aktiv
  else {
    (function () {
      if (Abschaltautomatik) {
        clearSchedule(Abschaltautomatik);
        Abschaltautomatik = null;
      }
    })();

    setState("javascript.0.Bewaesserung.Laufzähler", 0, true);
    setState("javascript.0.Bewaesserung.RestdauerIn%", 0, true);
    setState("javascript.0.Bewaesserung.RestdauerInMinuten", 0, true);
  }
});


// Manuelle Bewässerung
on({
  id: 'javascript.0.Bewaesserung.ManuelleBewaesserung',
  change: "ne"
}, function (obj) {
  var value = obj.state.val;
  var oldValue = obj.oldState.val;

  // Manuelle Bewässerung wurde aktiviert
  if (value == true) {
    setState("javascript.0.Bewaesserung.BewaesserungAktiv", true);

    if (getState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis1").val > 0) {
      bewaesserungSteuerung(1, true);
      Telegram("Manuelle Bewässerung wird gestartet");
    } else if (getState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis2").val > 0) {
      bewaesserungSteuerung(2, true);
      Telegram("Manuelle Bewässerung wird gestartet");
    } else {
      Telegram("Keine Dauer für Manuelle Bewässerung");
    }
  }
  // Manuelle Bewässerung wurde deaktiviert
  else {
    setState("javascript.0.Bewaesserung.BewaesserungAktiv", false);
    bewaesserungSteuerung(1, false);
    bewaesserungSteuerung(2, false);
  }
});



