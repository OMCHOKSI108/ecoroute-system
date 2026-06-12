import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { config } from '../config/env';

export interface OsrmCoordinate {
  lat: number;
  lng: number;
}

export interface OsrmTripLeg {
  distance: number;
  duration: number;
}

export interface OsrmTrip {
  distance: number;
  duration: number;
  geometry: unknown;
  legs: OsrmTripLeg[];
}

export interface OsrmWaypoint {
  name: string;
  location: [number, number]; // [lng, lat]
  trips_index: number;
  waypoint_index: number;
}

export interface OsrmTripResult {
  code: string;
  trips: OsrmTrip[];
  waypoints: OsrmWaypoint[];
}

function stubTripResult(coordinates: OsrmCoordinate[]): OsrmTripResult {
  return {
    code: 'Ok',
    trips: [
      {
        distance: 0,
        duration: 0,
        geometry: { type: 'LineString', coordinates: coordinates.map((c) => [c.lng, c.lat]) },
        legs: coordinates.slice(1).map(() => ({ distance: 0, duration: 0 })),
      },
    ],
    waypoints: coordinates.map((c, i) => ({
      name: '',
      location: [c.lng, c.lat] as [number, number],
      trips_index: 0,
      waypoint_index: i,
    })),
  };
}

function httpGet(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: string) => {
        data += chunk;
      });
      res.on('end', () => {
        const statusCode = res.statusCode ?? 500;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`OSRM request failed with HTTP ${statusCode}: ${data.slice(0, 200)}`));
          return;
        }
        resolve(data);
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`OSRM request timed out after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

export interface OsrmNearestResult {
  code: string;
  waypoints: {
    nodes: [number, number];
    distance: number;
    name: string;
    location: [number, number];
  }[];
}

export interface OsrmTableResult {
  code: string;
  durations: (number | null)[][];
  distances: (number | null)[][];
  destinations: OsrmWaypoint[];
  sources: OsrmWaypoint[];
}

function stubNearestResult(coordinate: OsrmCoordinate): OsrmNearestResult {
  return {
    code: 'Ok',
    waypoints: [
      {
        nodes: [0, 0],
        distance: 0,
        name: '',
        location: [coordinate.lng, coordinate.lat] as [number, number],
      },
    ],
  };
}

function stubTableResult(coordinates: OsrmCoordinate[]): OsrmTableResult {
  const count = coordinates.length;
  return {
    code: 'Ok',
    durations: [Array(count).fill(0)],
    distances: [Array(count).fill(0)],
    destinations: coordinates.map((c, i) => ({
      name: '',
      location: [c.lng, c.lat] as [number, number],
      trips_index: 0,
      waypoint_index: i,
    })),
    sources: coordinates.map((c, i) => ({
      name: '',
      location: [c.lng, c.lat] as [number, number],
      trips_index: 0,
      waypoint_index: i,
    })),
  };
}

export async function osrmNearest(coordinate: OsrmCoordinate): Promise<OsrmNearestResult> {
  if (config.offline.offlineMode || !config.offline.enableExternalApis) {
    return stubNearestResult(coordinate);
  }

  const url = `${config.osrm.baseUrl}/nearest/v1/driving/${coordinate.lng},${coordinate.lat}?number=1`;
  const raw = await httpGet(url, config.osrm.timeoutMs);
  let result: OsrmNearestResult;
  try {
    result = JSON.parse(raw) as OsrmNearestResult;
  } catch {
    throw new Error('OSRM returned an invalid JSON response');
  }
  if (result.code !== 'Ok') {
    throw new Error(`OSRM nearest failed with code: ${result.code}`);
  }
  return result;
}

export async function osrmTable(coordinates: OsrmCoordinate[]): Promise<OsrmTableResult> {
  if (config.offline.offlineMode || !config.offline.enableExternalApis || coordinates.length < 2) {
    return stubTableResult(coordinates);
  }

  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${config.osrm.baseUrl}/table/v1/driving/${coordStr}?annotations=distance`;
  const raw = await httpGet(url, config.osrm.timeoutMs);
  let result: OsrmTableResult;
  try {
    result = JSON.parse(raw) as OsrmTableResult;
  } catch {
    throw new Error('OSRM returned an invalid JSON response');
  }
  if (result.code !== 'Ok') {
    throw new Error(`OSRM table failed with code: ${result.code}`);
  }
  return result;
}

export async function osrmTrip(coordinates: OsrmCoordinate[]): Promise<OsrmTripResult> {
  if (config.offline.offlineMode || !config.offline.enableExternalApis || coordinates.length < 2) {
    return stubTripResult(coordinates);
  }

  // OSRM expects longitude,latitude (note: lng first)
  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `${config.osrm.baseUrl}/trip/v1/driving/${coordStr}?roundtrip=false&source=first&destination=last&steps=false&geometries=geojson`;

  const raw = await httpGet(url, config.osrm.timeoutMs);
  let result: OsrmTripResult;
  try {
    result = JSON.parse(raw) as OsrmTripResult;
  } catch {
    throw new Error('OSRM returned an invalid JSON response');
  }

  if (result.code !== 'Ok') {
    throw new Error(`OSRM trip failed with code: ${result.code}`);
  }

  return result;
}
