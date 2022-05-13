const BodenfeuchteSensorObj = "mqtt.0.Bewaesserungssteuerung.SoilMoistureSensor.Feuchtigkeit_in_Prozent"

const kreisGpio = {
  1: {
    gpio: 5,
    name: "RasenNaschtunnel",
  },
  2: {
    gpio: 4,
    name: "RasenVorgarten",
  },
  3: {
    gpio: 0,
    name: "BeetNaschtunnel",
  },
  4: {
    gpio: 2,
    name: "Gewaechshau",
  },
  5: {
    gpio: 14,
    name: "Rasen01",
  },
  6: {
    gpio: 12,
    name: "Rasen02",
  },
  7: {
    gpio: 13,
    name: "Blumenbeet",
  },
}

/**
 * Steuerung der Bewässerungsanlage
 */
function bewaesserungSteuerung(kreis, aktivieren, msg) {
  var gpio = kreisGpio[kreis].gpio
  var status = 1

  if (aktivieren) {
    status = 0
  }

  const url = "http://192.168.1.41/control?cmd=gpio," + gpio + "," + status

  try {
    require("request")(url).on("error", function (e) {
      log("ERROR Request: " + e)
      // log("STATUS: Kreis " + kreis + "; Aktiviert: " +aktivieren);
    })

    log("STATUS: Kreis " + kreis + "; Aktiviert: " + aktivieren + "; URL: " + url + "; MSG: " + msg)
  } catch (e) {
    log("ERROR: " + e)
  }
}

function Telegram(message) {
  sendTo("telegram", "send", {
    text: message,
  })
}

/**
 * Legt die Felder zum Speichern der Werte an
 */
function Felder_anlegen() {
  createState("Bewaesserung", {
    name: "Bewaesserung",
  })

  createState("javascript.0.Bewaesserung.ManuelleBewaesserung", false, {
    name: "ManuelleBewaesserung",

    type: "boolean",
  })

  createState("javascript.0.Bewaesserung.AutomatischeBewaesserung", false, {
    name: "AutomatischeBewaesserung",

    type: "boolean",
  })

  createState("javascript.0.Bewaesserung.BewaesserungAktiv", false, {
    name: "BewaesserungAktiv",

    type: "boolean",
  })

  createState("javascript.0.Bewaesserung.BodenfeuchteGrenze", 60, {
    name: "BodenfeuchteGrenze",
  })

  // Kreise

  Object.entries(kreisGpio).forEach(([key, value]) => {
    createState("javascript.0.Bewaesserung.BewaesserungsdauerKreis" + key, 15, {
      name: "BewaesserungsdauerKreis" + key + "_" + value.name,
    })

    createState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis" + key, 10, {
      name: "ManuelleBewaesserungsDauerKreis" + key + "_" + value.name,
    })
  })

  // Tage

  const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

  days.forEach((day) => {
    createState("javascript.0.Bewaesserung.Tage." + day, false, {
      name: day,

      type: "boolean",
    })

    createState("javascript.0.Bewaesserung.Tage." + day + "Zeit1", {
      name: day + "Zeit1",
    })

    createState("javascript.0.Bewaesserung.Tage." + day + "Zeit2", {
      name: day + "Zeit2",
    })
  })

  // Restdauern

  createState("javascript.0.Bewaesserung.RestdauerIn%", 0, {
    name: "RestdauerIn%",
  })

  createState("javascript.0.Bewaesserung.RestdauerInMinuten", 0, {
    name: "RestdauerInMinuten",
  })

  createState("javascript.0.Bewaesserung.Laufzaehler", 0, {
    name: "Laufzaehler",
  })
}

Felder_anlegen()

// Initiale States
setState("javascript.0.Bewaesserung.ManuelleBewaesserung", false)
setState("javascript.0.Bewaesserung.BewaesserungAktiv", false)
setState("javascript.0.Bewaesserung.AutomatischeBewaesserung", false)

var Abschaltautomatik, Einschaltzeitpunkt, timeout

// Einschaltzeitpunkt finden
Einschaltzeitpunkt = schedule("* * * * * *", function () {
  // Wenn Automatische Bewässerung aktiv und Manuelle Bewässerung nicht aktiv
  if (
    getState("javascript.0.Bewaesserung.ManuelleBewaesserung").val == false &&
    getState("javascript.0.Bewaesserung.AutomatischeBewaesserung").val == true
  ) {
    var actualDay = formatDate(new Date(), "WW", "de")
    var dayEnabled = getState("javascript.0.Bewaesserung.Tage." + actualDay).val

    if (dayEnabled) {
      var actualTime = formatDate(new Date(), "hh:mm:ss")
      var time1 = getState("javascript.0.Bewaesserung.Tage." + actualDay + "Zeit1").val
      var time2 = getState("javascript.0.Bewaesserung.Tage." + actualDay + "Zeit2").val

      if (time1 == actualTime || time2 == actualTime) {
        // Bewässerung starten
        if (getState(BodenfeuchteSensorObj).val <= getState(BodenfeuchteGrenze).val) {
          setState("javascript.0.Bewaesserung.BewaesserungAktiv", true, true)
          bewaesserungSteuerung(1, true)
          Telegram("Bewässerung wird gestartet")
        } else {
          Telegram("Bodenfeuchtigkeit zu hoch. Bewässerung wird ausgesetzt.")
        }
      }
    }
  }
})

// Abschalten nach festgelegter Zeit
on(
  {
    id: "javascript.0.Bewaesserung.BewaesserungAktiv",
    change: "ne",
  },
  function (obj) {
    var value = obj.state.val
    var oldValue = obj.oldState.val

    // Wenn Bewässerung aktiv
    if (value == true) {
      setState("javascript.0.Bewaesserung.Laufzaehler", 0)
      setState("javascript.0.Bewaesserung.RestdauerIn%", 100)

      // Dauer automatische Bewässerung
      var dauerKreise = {}
      var bewaesserungsdauerSumme = 0

      var manuell = getState("javascript.0.Bewaesserung.ManuelleBewaesserung").val
      if (manuell) {
        // Dauer wenn manuell bewässert wird
        Object.entries(kreisGpio).forEach(([key, value]) => {
          var dauer = parseInt(getState("javascript.0.Bewaesserung.ManuelleBewaesserungsDauerKreis" + key).val)

          if (dauer > 0) {
            dauerKreise[key] = dauer
            bewaesserungsdauerSumme += dauer
          }
        })
      } else {
        // Dauer bei automatischer Bewässerung
        Object.entries(kreisGpio).forEach(([key, value]) => {
          var dauer = parseInt(getState("javascript.0.Bewaesserung.BewaesserungsdauerKreis" + key).val)

          if (dauer > 0) {
            dauerKreise[key] = dauer
            bewaesserungsdauerSumme += dauer
          }
        })
      }

      setState("javascript.0.Bewaesserung.RestdauerInMinuten", bewaesserungsdauerSumme)

      // Abschaltpunkte suchen
      var abschaltpunkte = []
      var abschaltDauer = 0

      Object.entries(dauerKreise).forEach(([kreis, dauer]) => {
        abschaltDauer += dauer / 2
        abschaltpunkte.push([abschaltDauer, kreis, 1])
      })
      Object.entries(dauerKreise).forEach(([kreis, dauer]) => {
        abschaltDauer += dauer / 2
        abschaltpunkte.push([abschaltDauer, kreis, 2])
      })

      // Start erster Kreis
      var kreis = abschaltpunkte[0][1]
      bewaesserungSteuerung(kreis, true)
      log("Kreis " + kreis + " - " + kreisGpio[kreis].name + " - Teil 1 - gestartet")

      // Jede Minute
      Abschaltautomatik = schedule("* * * * *", function () {
        var laufzaehler = getState("javascript.0.Bewaesserung.Laufzaehler").val

        log("Laufzaehler - " + laufzaehler + " min")

        var abschaltzeit = abschaltpunkte[0][0]
        var kreis = abschaltpunkte[0][1]
        var teil = abschaltpunkte[0][2]

        if (laufzaehler == abschaltzeit) {
          // Beendet aktuell aktiven Kreis
          bewaesserungSteuerung(kreis, false, "Zeile 255")
          log("Kreis " + kreis + " - " + kreisGpio[kreis].name + " - Teil " + teil + " - beendet")

          // Lösche beendeten Kreis aus array
          abschaltpunkte.shift()

          if (abschaltpunkte.length > 0) {
            abschaltzeit = abschaltpunkte[0][0]
            kreis = abschaltpunkte[0][1]
            teil = abschaltpunkte[0][2]
            bewaesserungSteuerung(kreis, true)
            log("Kreis " + kreis + " - " + kreisGpio[kreis].name + " - Teil " + teil + " - gestartet")
          } else {
            // Alle Kreise beendet
            setState("javascript.0.Bewaesserung.BewaesserungAktiv", false)

            if (manuell) {
              setState("javascript.0.Bewaesserung.ManuelleBewaesserung", false)
              log("Manuelle Bewässerung wurde beendet")
              Telegram("Manuelle Bewässerung wurde beendet")
            } else {
              log("Bewässerung wurde beendet")
              Telegram("Bewässerung wurde beendet")
            }
          }
        }

        // Noch kein Ende
        if (laufzaehler < bewaesserungsdauerSumme) {
          setState("javascript.0.Bewaesserung.Laufzaehler", laufzaehler + 1, true)
          setState(
            "javascript.0.Bewaesserung.RestdauerInMinuten",
            getState("javascript.0.Bewaesserung.RestdauerInMinuten").val - 1,
            true
          )

          setState("javascript.0.Bewaesserung.RestdauerIn%", ((laufzaehler + 1) / bewaesserungsdauerSumme) * 100, true)
        }
      })
    } else {
      // Bewässerung nicht aktiv
      ;(function () {
        if (Abschaltautomatik) {
          clearSchedule(Abschaltautomatik)
          Abschaltautomatik = null
        }
      })()

      setState("javascript.0.Bewaesserung.Laufzaehler", 0, true)
      setState("javascript.0.Bewaesserung.RestdauerIn%", 0, true)
      setState("javascript.0.Bewaesserung.RestdauerInMinuten", 0, true)
    }
  }
)

// Manuelle Bewässerung
on(
  {
    id: "javascript.0.Bewaesserung.ManuelleBewaesserung",
    change: "ne",
  },
  function (obj) {
    var value = obj.state.val
    var oldValue = obj.oldState.val

    // Manuelle Bewässerung wurde aktiviert
    if (value == true) {
      setState("javascript.0.Bewaesserung.BewaesserungAktiv", true)
    }
    // Manuelle Bewässerung wurde deaktiviert
    else {
      setState("javascript.0.Bewaesserung.BewaesserungAktiv", false)

      Object.entries(kreisGpio).forEach(([key, value]) => {
        bewaesserungSteuerung(key, false, "Zeile 329")
      })
    }
  }
)
