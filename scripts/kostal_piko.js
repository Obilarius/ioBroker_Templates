// Ausleseskript Wechselrichter Kostal Piko ab Firmware v05.31 (12.10.2015)

//Variablen

 //Leistungswerte
const ID_DCEingangGesamt = 33556736;         // in W
const ID_Ausgangsleistung = 67109120;        // in W
const ID_Eigenverbrauch = 83888128;          // in W
//Status
const ID_Status = 16780032;                  // 0:Off
//Statistik - Tag
const ID_Ertrag_d = 251658754;               // in Wh
const ID_Hausverbrauch_d = 251659010;        // in Wh
const ID_Eigenverbrauch_d = 251659266;       // in Wh
const ID_Eigenverbrauchsquote_d = 251659278; // in %
const ID_Autarkiegrad_d = 251659279;         // in %
//Statistik - Gesamt
const ID_Ertrag_G = 251658753;               // in kWh
const ID_Hausverbrauch_G = 251659009;        // in kWh
const ID_Eigenverbrauch_G = 251659265;       // in kWh
const ID_Eigenverbrauchsquote_G = 251659280; // in %
const ID_Autarkiegrad_G = 251659281;         // in %
const ID_Betriebszeit = 251658496;           // in h
//Momentanwerte - PV Genertor
const ID_DC1Spannung = 33555202;             // in V
const ID_DC1Strom = 33555201;                // in A
const ID_DC1Leistung = 33555203;             // in W
const ID_DC2Spannung = 33555458;             // in V
const ID_DC2Strom = 33555457;                // in A
const ID_DC2Leistung = 33555459;             // in W
//Momentanwerte Haus
const ID_HausverbrauchSolar = 83886336;      // in W
const ID_HausverbrauchBatterie = 83886592;   // in W
const ID_HausverbrauchNetz = 83886848;       // in W
const ID_HausverbrauchPhase1 = 83887106;     // in W
const ID_HausverbrauchPhase2 = 83887362;     // in W
const ID_HausverbrauchPhase3 = 83887618;     // in W
//Netz Netzparameter
const ID_NetzAusgangLeistung = 67109120;     // in W
const ID_NetzFrequenz = 67110400;            // in Hz
const ID_NetzCosPhi = 67110656;
//Netz Phase 1
const ID_P1Spannung = 67109378;              // in V
const ID_P1Strom = 67109377;                 // in A
const ID_P1Leistung = 67109379;              // in W
//Netz Phase 2
const ID_P2Spannung = 67109634;              // in V
const ID_P2Strom = 67109633;                 // in A
const ID_P2Leistung = 67109635;              // in W
//Netz Phase 3
const ID_P3Spannung = 67109890;              // in V
const ID_P3Strom = 67109889;                 // in A
const ID_P3Leistung = 67109891;              // in W
//Batterie
const ID_BatSpannung = 33556226;             // in V
const ID_BatLadezustand = 33556229;          // in %
const ID_BatLadestrom = 33556238;            // in A
const ID_BatCurrentDir = 33556230;
const ID_BatLadezyklen = 33556228;
const ID_BatTemperatur = 33556227;           // in °C


 
var IPAnlage = '192.168.1.50/api/dxs.json';   // IP der Photovoltaik-Anlage

createState('KostalPiko.Momentanwerte.Leistung_AC_aktuell', 0);
createState('KostalPiko.Summenwerte.Autarkiegrad_d',0);
createState('KostalPiko.Summenwerte.Autarkiegrad_G',0);
createState('KostalPiko.Summenwerte.Betriebszeit',0);
createState('KostalPiko.Momentanwerte.Leistung_DC_aktuell',0);
createState('KostalPiko.Momentanwerte.Eigenverbrauch',0);
createState('KostalPiko.Summenwerte.Eigenverbrauch_d');
createState('KostalPiko.Summenwerte.Eigenverbrauch_G', 0);
createState('KostalPiko.Summenwerte.Eigenverbrauchsquote_d', 0);
createState('KostalPiko.Summenwerte.Eigenverbrauchsquote_G', 0);
createState('KostalPiko.Summenwerte.Tagesertrag', 0);
createState('KostalPiko.Summenwerte.Gesamtertrag', 0);
createState('KostalPiko.Summenwerte.Hausverbrauch_d', 0);
createState('KostalPiko.Summenwerte.Hausverbrauch_G', 0);
// createState('KostalPiko.Momentanwerte.P1Spannung');
// createState('KostalPiko.Momentanwerte.P2Spannung');
// createState('KostalPiko.Momentanwerte.P1Strom');
// createState('KostalPiko.Momentanwerte.P2Strom');
// createState('KostalPiko.Momentanwerte.P1Leistung');
// createState('KostalPiko.Momentanwerte.P2Leistung');
createState('KostalPiko.Momentanwerte.Status');
createState('KostalPiko.Momentanwerte.Leistung_String1');
createState('KostalPiko.Momentanwerte.Leistung_String2');
createState('KostalPiko.Momentanwerte.HausverbrauchSolar');
createState('KostalPiko.Momentanwerte.HausverbrauchBatterie');
// createState('KostalPiko.Momentanwerte.HausverbrauchNetz', 0, {name: 'Hausverbrauch aus dem Netz', unit: 'Watt'});
createState('KostalPiko.Momentanwerte.HausverbrauchNetz');
createState('KostalPiko.Momentanwerte.HausverbrauchTotal');
createState('KostalPiko.Batterie.Spannung');
createState('KostalPiko.Batterie.Ladezustand');
createState('KostalPiko.Batterie.Ladestrom');
createState('KostalPiko.Batterie.CurrentDir');
createState('KostalPiko.Batterie.Ladezyklen');
createState('KostalPiko.Batterie.Temperatur');

var request = require('request');
var logging = false;

function GetValueOf(json, dxsId) {
      for (var i = 0; i < json.length; i++){
            if (json[i].dxsId == dxsId){
                  return json[i].value.toFixed(0);
            }
      }
}

function Piko() {
    if (logging) log("Kostal Piko auslesen");

    var uri = 'http://' + IPAnlage + 
    '?dxsEntries=' + ID_DCEingangGesamt +
    '&dxsEntries=' + ID_Ausgangsleistung +
    '&dxsEntries=' + ID_Eigenverbrauch +
    '&dxsEntries=' + ID_Eigenverbrauch_d +
    '&dxsEntries=' + ID_Eigenverbrauch_G +
    '&dxsEntries=' + ID_Eigenverbrauchsquote_d +
    '&dxsEntries=' + ID_Eigenverbrauchsquote_G +
    '&dxsEntries=' + ID_Ertrag_d +
    '&dxsEntries=' + ID_Ertrag_G +
    '&dxsEntries=' + ID_Hausverbrauch_d +
    '&dxsEntries=' + ID_Hausverbrauch_G +
    '&dxsEntries=' + ID_Autarkiegrad_G +
    '&dxsEntries=' + ID_Autarkiegrad_d +
    '&dxsEntries=' + ID_Betriebszeit +
    // '&dxsEntries=' + ID_P1Spannung +
    // '&dxsEntries=' + ID_P2Spannung +
    // '&dxsEntries=' + ID_P1Strom +
    // '&dxsEntries=' + ID_P2Strom +
    // '&dxsEntries=' + ID_P1Leistung +
    // '&dxsEntries=' + ID_P2Leistung +
    '&dxsEntries=' + ID_Status +
    '&dxsEntries=' + ID_DC1Leistung +
    '&dxsEntries=' + ID_DC2Leistung +
    '&dxsEntries=' + ID_HausverbrauchSolar +
    '&dxsEntries=' + ID_HausverbrauchBatterie +
    '&dxsEntries=' + ID_HausverbrauchNetz +
    '&dxsEntries=' + ID_HausverbrauchPhase1 +
    '&dxsEntries=' + ID_HausverbrauchPhase2 +
    '&dxsEntries=' + ID_HausverbrauchPhase3 +
    '&dxsEntries=' + ID_BatSpannung +
    '&dxsEntries=' + ID_BatLadezustand +
    '&dxsEntries=' + ID_BatLadestrom +
    '&dxsEntries=' + ID_BatCurrentDir +
    '&dxsEntries=' + ID_BatLadezyklen +
    '&dxsEntries=' + ID_BatTemperatur;
    
    if (logging) log("URI: " + uri);
    
    request(uri, function (error, response, body) {
        if(!error && response.statusCode ==200) {
            if(logging) log(body);
            var result = JSON.parse(body).dxsEntries;

            setState('KostalPiko.Momentanwerte.Leistung_DC_aktuell', GetValueOf(result, ID_DCEingangGesamt));
            setState('KostalPiko.Momentanwerte.Leistung_AC_aktuell', GetValueOf(result, ID_Ausgangsleistung));
            setState('KostalPiko.Momentanwerte.Eigenverbrauch', GetValueOf(result, ID_Eigenverbrauch));
            setState('KostalPiko.Summenwerte.Eigenverbrauch_d', GetValueOf(result, ID_Eigenverbrauch_d)); 
            setState('KostalPiko.Summenwerte.Eigenverbrauch_G', GetValueOf(result, ID_Eigenverbrauch_G));
            setState('KostalPiko.Summenwerte.Eigenverbrauchsquote_d', GetValueOf(result, ID_Eigenverbrauchsquote_d));
            setState('KostalPiko.Summenwerte.Eigenverbrauchsquote_G', GetValueOf(result, ID_Eigenverbrauchsquote_G));
            setState('KostalPiko.Summenwerte.Tagesertrag', GetValueOf(result, ID_Ertrag_d));
            setState('KostalPiko.Summenwerte.Gesamtertrag', GetValueOf(result, ID_Ertrag_G));
            setState('KostalPiko.Summenwerte.Hausverbrauch_d', GetValueOf(result, ID_Hausverbrauch_d));
            setState('KostalPiko.Summenwerte.Hausverbrauch_G', GetValueOf(result, ID_Hausverbrauch_G));
            setState('KostalPiko.Summenwerte.Autarkiegrad_G', GetValueOf(result, ID_Autarkiegrad_G));
            setState('KostalPiko.Summenwerte.Autarkiegrad_d', GetValueOf(result, ID_Autarkiegrad_d));
            setState('KostalPiko.Summenwerte.Betriebszeit', GetValueOf(result, ID_Betriebszeit));
            // setState('KostalPiko.Momentanwerte.P1Spannung', result[14].value.toFixed(0), true);
            // setState('KostalPiko.Momentanwerte.P2Spannung', result[15].value.toFixed(0), true);
            // setState('KostalPiko.Momentanwerte.P1Strom', result[16].value.toFixed(0), true);
            // setState('KostalPiko.Momentanwerte.P2Strom', result[17].value.toFixed(0), true);
            // setState('KostalPiko.Momentanwerte.P1Leistung', result[18].value.toFixed(0), true);
            // setState('KostalPiko.Momentanwerte.P2Leistung', result[19].value.toFixed(0), true);
            setState('KostalPiko.Momentanwerte.Status', GetValueOf(result, ID_Status));
            setState('KostalPiko.Momentanwerte.Leistung_String1', GetValueOf(result, ID_DC1Leistung));
            setState('KostalPiko.Momentanwerte.Leistung_String2', GetValueOf(result, ID_DC2Leistung));
            setState('KostalPiko.Momentanwerte.HausverbrauchSolar', GetValueOf(result, ID_HausverbrauchSolar));
            setState('KostalPiko.Momentanwerte.HausverbrauchBatterie', GetValueOf(result, ID_HausverbrauchBatterie));
            setState('KostalPiko.Momentanwerte.HausverbrauchNetz', GetValueOf(result, ID_HausverbrauchNetz));
            var hausverbrauchTotal = parseInt(GetValueOf(result, ID_HausverbrauchPhase1)) + parseInt(GetValueOf(result, ID_HausverbrauchPhase2)) + parseInt(GetValueOf(result, ID_HausverbrauchPhase3));
            setState('KostalPiko.Momentanwerte.HausverbrauchTotal', hausverbrauchTotal);
            setState('KostalPiko.Batterie.Spannung', GetValueOf(result, ID_BatSpannung));
            setState('KostalPiko.Batterie.Ladezustand', GetValueOf(result, ID_BatLadezustand));
            setState('KostalPiko.Batterie.Ladestrom', GetValueOf(result, ID_BatLadestrom));
            setState('KostalPiko.Batterie.CurrentDir', GetValueOf(result, ID_BatCurrentDir));
            setState('KostalPiko.Batterie.Ladezyklen', GetValueOf(result, ID_BatLadezyklen));
            setState('KostalPiko.Batterie.Temperatur', GetValueOf(result, ID_BatTemperatur));

        } else {
            log("Fehler: " + error + " bei Abfrage von: " + uri, "warn");
        }
    });
    
}

// Wird alle 20 sek ausgeführt
schedule("*/20 * * * * *", function () {
    log("Kostal Piko Schedule");
    Piko();
});

Piko();
