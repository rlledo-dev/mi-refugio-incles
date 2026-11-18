/**
 * Mi Refugio en Incles: campos privados complementarios.
 *
 * IMPORTANTE:
 * - Este archivo es una propuesta para integrarse en el Apps Script existente.
 * - NO es un endpoint ni modifica doPost. No desplegar como sustituto.
 * - Invocar ÚNICAMENTE después de validar el token, comprobar la reserva,
 *   y determinar que está dentro de su periodo de acceso autorizado.
 * - Nunca enviar la hoja completa, datos ROAT, ni tokens al navegador.
 *
 * Ejemplo en el servicio existente, después de construir `guest`:
 *   refugeAddPrivateExtras_(SpreadsheetApp.getActiveSpreadsheet(), rowNumber, guest);
 *   // a continuación devolver guest con el mecanismo JSON existente.
 *
 * rowNumber es el índice real de la fila de la reserva (1-based).
 */
function refugeAddPrivateExtras_(spreadsheet, rowNumber, guest) {
  if (!spreadsheet || !guest || !Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error('Reserva no validada');
  }

  var sheet = spreadsheet.getSheetByName('Reservas');
  if (!sheet || rowNumber > sheet.getLastRow()) {
    throw new Error('Reserva no disponible');
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var values = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var record = {};
  headers.forEach(function (header, index) { record[header] = values[index] || ''; });

  // La red de respaldo es una configuración común. Solo viaja al navegador
  // DENTRO de la respuesta de una reserva autorizada.
  var config = spreadsheet.getSheetByName('Configuración WiFi');
  if (config && config.getLastRow() >= 2) {
    var rows = config.getRange(2, 1, config.getLastRow() - 1, 2).getDisplayValues();
    var options = {};
    rows.forEach(function (row) { options[row[0]] = row[1]; });
    if (options['wifiBackup.ssid'] && options['wifiBackup.username'] && options['wifiBackup.password']) {
      guest.wifiBackup = {
        ssid: options['wifiBackup.ssid'],
        username: options['wifiBackup.username'],
        password: options['wifiBackup.password']
      };
    }
  }

  // Solo entregamos eSIM reales y explícitamente asignadas. Una demo
  // nunca se envía a un huésped, aunque haya campos rellenos.
  var status = String(record['eSIM - Estado'] || '').trim();
  var isDemo = /demo|fictici|prueba/i.test(status);
  var isAssigned = /^(asignada|asignado|lista para entrega|entregada|activa)$/i.test(status);
  var url = String(record['eSIM - Enlace instalación'] || '').trim();
  var smdp = String(record['eSIM - SM-DP+'] || '').trim();
  var activation = String(record['eSIM - Código activación'] || '').trim();
  var iccid = String(record['eSIM - ICCID'] || '').trim();

  if (!isDemo && isAssigned && (url || (smdp && activation))) {
    guest.esim = {
      status: status,
      provider: String(record['eSIM - Proveedor'] || 'Airalo').slice(0, 80),
      dataAmount: String(record['eSIM - Datos'] || '').slice(0, 80),
      duration: String(record['eSIM - Duración'] || '').slice(0, 80),
      installationUrl: url.slice(0, 2048),
      smdpAddress: smdp.slice(0, 255),
      activationCode: activation.slice(0, 255),
      iccid: iccid.slice(0, 64)
    };
  }

  return guest;
}
