// Zona kohore e biznesit (Kosovë). Vizitat planifikohen gjithmonë sipas kësaj zone,
// pavarësisht se në cilën zonë kohore ekzekutohet vetë procesi i serverit
// (p.sh. shërbimet serverless si Vercel ekzekutohen zakonisht në UTC).
// Baza e të dhënave IANA nuk ka një zonë të veçantë "Europe/Prishtina"; Kosova ndjek
// të njëjtat rregulla CET/CEST si "Europe/Belgrade", identifikuesi korrekt IANA për këtë.
export const APP_TIME_ZONE = 'Europe/Belgrade'

// Kthen një datë+orë "civile" (ashtu siç e zgjedh përdoruesi, p.sh. "2026-07-31" + "09:00")
// në instantin korrekt UTC. E domosdoshme sepse new Date(`${date}T${time}:00`) — pa "Z" —
// e interpreton vargun sipas zonës kohore AMBIENTALE të procesit që e ekzekuton, jo sipas
// zonës kohore të biznesit; kjo prodhonte një zhvendosje orësh të gabuar sa herë që serveri
// ekzekutohej në një zonë tjetër kohore nga Europe/Prishtina.
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string = APP_TIME_ZONE): Date {
  // 1) Interpretojmë vargun civil sikur të ishte UTC — thjesht si "hamendje" fillestare.
  const guessUtc = new Date(`${dateStr}T${timeStr}:00Z`)
  // 2) Shohim si duket ky instant kur shfaqet në zonën e synuar (formati "YYYY-MM-DD HH:mm:ss",
  //    i pavarur nga vendosja rajonale/gjuhësore e ambientit të ekzekutimit).
  const tzWallClock = guessUtc.toLocaleString('sv-SE', { timeZone })
  const tzWallClockAsUtc = new Date(tzWallClock.replace(' ', 'T') + 'Z')
  // 3) Diferenca mes tyre është zhvendosja (offset) e zonës së synuar në atë instant (përfshin DST-në).
  const offsetMs = guessUtc.getTime() - tzWallClockAsUtc.getTime()
  // 4) E aplikojmë këtë zhvendosje mbi hamendjen fillestare për të marrë instantin korrekt UTC.
  return new Date(guessUtc.getTime() + offsetMs)
}

// Data kalendarike (YYYY-MM-DD) e një timestamp-i UTC, ashtu siç shfaqet në zonën e biznesit.
export function localDateKey(iso: string, timeZone: string = APP_TIME_ZONE): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone })
}

// Ora (HH:mm) e një timestamp-i UTC, ashtu siç shfaqet në zonën e biznesit.
export function localTimeKey(iso: string, timeZone: string = APP_TIME_ZONE): string {
  return new Date(iso).toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' })
}
