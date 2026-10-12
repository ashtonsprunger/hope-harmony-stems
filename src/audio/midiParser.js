/**
 * Lightweight, robust Standard MIDI File (SMF) parser for HopeHarmony
 * Parses Type 0 and Type 1 MIDI files into structured tracks, note events,
 * tempo changes, and time signatures.
 */

function readVarLen(dataView, offset) {
  let value = 0;
  let bytesRead = 0;
  while (true) {
    const b = dataView.getUint8(offset + bytesRead++);
    value = (value << 7) | (b & 0x7f);
    if (!(b & 0x80)) break;
  }
  return { value, bytesRead };
}

export function parseMidi(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  // Verify 'MThd'
  const headerId = String.fromCharCode(
    view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3)
  );
  if (headerId !== 'MThd') {
    throw new Error('Invalid MIDI file: Missing MThd header');
  }

  const headerLength = view.getUint32(4);
  const format = view.getUint16(8);
  const numTracks = view.getUint16(10);
  const division = view.getUint16(12);

  // PPQ (ticks per quarter note)
  const ppq = (division & 0x8000) === 0 ? division : 480;

  offset = 8 + headerLength;

  const tracks = [];
  const tempos = [];
  const timeSigs = [];

  for (let t = 0; t < numTracks; t++) {
    if (offset >= view.byteLength) break;

    const trackId = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3)
    );
    const trackLen = view.getUint32(offset + 4);
    offset += 8;

    let trkOff = offset;
    const trkEnd = offset + trackLen;
    offset = trkEnd;

    let curTick = 0;
    let runningStatus = 0;
    let trackName = '';
    const noteEvents = [];
    const openNotes = new Map(); // key: channel_pitch -> { startTick, velocity }

    while (trkOff < trkEnd) {
      const dt = readVarLen(view, trkOff);
      trkOff += dt.bytesRead;
      curTick += dt.value;

      let status = view.getUint8(trkOff);
      if (status & 0x80) {
        runningStatus = status;
        trkOff++;
      }

      if (runningStatus === 0xff) {
        // Meta event
        const metaType = view.getUint8(trkOff++);
        const len = readVarLen(view, trkOff);
        trkOff += len.bytesRead;

        if (metaType === 0x03) {
          // Track Name
          let name = '';
          for (let i = 0; i < len.value; i++) {
            name += String.fromCharCode(view.getUint8(trkOff + i));
          }
          trackName = name;
        } else if (metaType === 0x51 && len.value === 3) {
          // Set Tempo (microseconds per quarter note)
          const us = (view.getUint8(trkOff) << 16) | (view.getUint8(trkOff + 1) << 8) | view.getUint8(trkOff + 2);
          const bpm = 60000000 / us;
          tempos.push({ tick: curTick, us, bpm });
        } else if (metaType === 0x58 && len.value >= 2) {
          // Time Signature
          const num = view.getUint8(trkOff);
          const denom = Math.pow(2, view.getUint8(trkOff + 1));
          timeSigs.push({ tick: curTick, num, denom });
        }

        trkOff += len.value;
      } else if (runningStatus === 0xf0 || runningStatus === 0xf7) {
        // SysEx
        const len = readVarLen(view, trkOff);
        trkOff += len.bytesRead + len.value;
      } else {
        const type = runningStatus >> 4;
        const channel = runningStatus & 0x0f;

        if (type === 0x09) {
          // Note On
          const pitch = view.getUint8(trkOff++);
          const velocity = view.getUint8(trkOff++);
          const noteKey = `${channel}_${pitch}`;

          if (velocity > 0) {
            // Close any unclosed note of same pitch
            if (openNotes.has(noteKey)) {
              const prev = openNotes.get(noteKey);
              noteEvents.push({
                pitch,
                startTick: prev.startTick,
                endTick: curTick,
                durationTicks: Math.max(1, curTick - prev.startTick),
                velocity: prev.velocity,
                channel
              });
            }
            openNotes.set(noteKey, { startTick: curTick, velocity });
          } else {
            // Note On with vel 0 == Note Off
            if (openNotes.has(noteKey)) {
              const prev = openNotes.get(noteKey);
              openNotes.delete(noteKey);
              noteEvents.push({
                pitch,
                startTick: prev.startTick,
                endTick: curTick,
                durationTicks: Math.max(1, curTick - prev.startTick),
                velocity: prev.velocity,
                channel
              });
            }
          }
        } else if (type === 0x08) {
          // Note Off
          const pitch = view.getUint8(trkOff++);
          trkOff++; // discard release velocity
          const noteKey = `${channel}_${pitch}`;
          if (openNotes.has(noteKey)) {
            const prev = openNotes.get(noteKey);
            openNotes.delete(noteKey);
            noteEvents.push({
              pitch,
              startTick: prev.startTick,
              endTick: curTick,
              durationTicks: Math.max(1, curTick - prev.startTick),
              velocity: prev.velocity,
              channel
            });
          }
        } else if (type === 0x0a || type === 0x0b || type === 0x0e) {
          trkOff += 2;
        } else if (type === 0x0c || type === 0x0d) {
          trkOff += 1;
        }
      }
    }

    // Flush any remaining open notes
    for (const [noteKey, prev] of openNotes.entries()) {
      const parts = noteKey.split('_');
      noteEvents.push({
        pitch: Number(parts[1]),
        startTick: prev.startTick,
        endTick: curTick,
        durationTicks: Math.max(1, curTick - prev.startTick),
        velocity: prev.velocity,
        channel: Number(parts[0])
      });
    }

    noteEvents.sort((a, b) => a.startTick - b.startTick);
    tracks.push({
      index: t,
      name: trackName || `Track ${t}`,
      notes: noteEvents,
      endTick: curTick
    });
  }

  // Ensure default tempo & time signature if missing
  if (tempos.length === 0) {
    tempos.push({ tick: 0, us: 500000, bpm: 120 });
  }
  if (timeSigs.length === 0) {
    timeSigs.push({ tick: 0, num: 4, denom: 4 });
  }

  tempos.sort((a, b) => a.tick - b.tick);
  timeSigs.sort((a, b) => a.tick - b.tick);

  // Precompute tempo elapsed seconds at 1.0x speed
  let accTime = 0;
  for (let i = 0; i < tempos.length; i++) {
    if (i > 0) {
      const prev = tempos[i - 1];
      const dtTicks = tempos[i].tick - prev.tick;
      accTime += (dtTicks / ppq) * (prev.us / 1000000);
    }
    tempos[i].timeAt1x = accTime;
  }

  // Find overall max tick based on actual notes (with 2 quarter-note decay padding for release ring-out)
  let maxNoteTick = 0;
  for (const trk of tracks) {
    for (const n of trk.notes) {
      if (n.endTick > maxNoteTick) maxNoteTick = n.endTick;
    }
  }
  const maxTick = maxNoteTick > 0 ? maxNoteTick + Math.round(ppq * 1.5) : ppq * 16;

  // Build measure boundaries
  let curMeasure = 1;
  let curTick = 0;
  let sigIdx = 0;
  const measures = [];
  const safeEndTick = Math.max(maxTick + ppq * 16, ppq * 16);

  while (curTick <= safeEndTick) {
    while (sigIdx + 1 < timeSigs.length && timeSigs[sigIdx + 1].tick <= curTick) {
      sigIdx++;
    }
    const sig = timeSigs[sigIdx];
    const ticksPerBeat = ppq * (4 / sig.denom);
    const measureTicks = sig.num * ticksPerBeat;
    measures.push({
      measure: curMeasure,
      startTick: curTick,
      endTick: curTick + measureTicks,
      num: sig.num,
      denom: sig.denom,
      ticksPerBeat
    });
    curTick += measureTicks;
    curMeasure++;
  }

  // Bidirectional tick/time converters
  function tickToTime(tick, speed = 1.0) {
    if (tick <= 0) return 0;
    let seg = tempos[0];
    for (let i = tempos.length - 1; i >= 0; i--) {
      if (tick >= tempos[i].tick) {
        seg = tempos[i];
        break;
      }
    }
    const dtTicks = tick - seg.tick;
    const timeAt1x = seg.timeAt1x + (dtTicks / ppq) * (seg.us / 1000000);
    return timeAt1x / (speed || 1.0);
  }

  function timeToTick(timeSecs, speed = 1.0) {
    if (timeSecs <= 0) return 0;
    const time1x = timeSecs * (speed || 1.0);
    let seg = tempos[0];
    for (let i = tempos.length - 1; i >= 0; i--) {
      if (time1x >= tempos[i].timeAt1x) {
        seg = tempos[i];
        break;
      }
    }
    const dtSecs = time1x - seg.timeAt1x;
    const dtTicks = (dtSecs / (seg.us / 1000000)) * ppq;
    return seg.tick + dtTicks;
  }

  function getMeasureAndBeat(tick) {
    if (tick <= 0) {
      return { measure: 1, beat: 1, timeSig: `${measures[0]?.num || 4}/${measures[0]?.denom || 4}` };
    }
    let m = measures[0];
    // Binary search or linear search
    for (let i = 0; i < measures.length; i++) {
      if (tick >= measures[i].startTick && tick < measures[i].endTick) {
        m = measures[i];
        break;
      }
    }
    const tickInMeasure = Math.max(0, tick - m.startTick);
    const beat = Math.floor(tickInMeasure / m.ticksPerBeat) + 1;
    return {
      measure: m.measure,
      beat: Math.min(beat, m.num),
      timeSig: `${m.num}/${m.denom}`
    };
  }

  const endMeasureInfo = getMeasureAndBeat(maxTick);
  const totalMeasures = endMeasureInfo.measure;

  return {
    format,
    ppq,
    tracks,
    tempos,
    timeSigs,
    measures,
    maxTick,
    totalMeasures,
    totalDuration1x: tickToTime(maxTick, 1.0),
    tickToTime,
    timeToTick,
    getMeasureAndBeat
  };
}
