import * as osrm from '../clients/osrm.client';
import type { OsrmCoordinate } from '../clients/osrm.client';

interface RouteBetweenResult {
  distanceM: number;
  durationS: number;
  geometry: unknown;
}

interface NearestRoadResult {
  latitude: number;
  longitude: number;
  distanceM: number;
  name: string;
}

interface DistanceMatrixResult {
  durations: (number | null)[][];
  distances: (number | null)[][];
  coordinates: { latitude: number; longitude: number }[];
}

interface TripOptimizeResult {
  distanceM: number;
  durationS: number;
  geometry: unknown;
  waypoints: { latitude: number; longitude: number }[];
}

export async function routeBetween(
  input: { originLat: number; originLng: number; destLat: number; destLng: number },
): Promise<RouteBetweenResult> {
  const tripResult = await osrm.osrmTrip([
    { lat: input.originLat, lng: input.originLng },
    { lat: input.destLat, lng: input.destLng },
  ]);
  const trip = tripResult.trips[0]!;
  return {
    distanceM: trip.distance,
    durationS: trip.duration,
    geometry: trip.geometry,
  };
}

export async function nearestRoad(
  input: { lat: number; lng: number },
): Promise<NearestRoadResult> {
  const result = await osrm.osrmNearest({ lat: input.lat, lng: input.lng });
  const waypoint = result.waypoints[0]!;
  return {
    latitude: waypoint.location[1],
    longitude: waypoint.location[0],
    distanceM: waypoint.distance,
    name: waypoint.name,
  };
}

export async function distanceMatrix(
  input: { latitudes: number[]; longitudes: number[] },
): Promise<DistanceMatrixResult> {
  const coordinates: OsrmCoordinate[] = input.latitudes.map((lat, i) => ({
    lat,
    lng: input.longitudes[i]!,
  }));

  const result = await osrm.osrmTable(coordinates);

  return {
    durations: result.durations,
    distances: result.distances ?? [],
    coordinates: coordinates.map((c) => ({ latitude: c.lat, longitude: c.lng })),
  };
}

export async function tripOptimize(
  input: { latitudes: number[]; longitudes: number[] },
): Promise<TripOptimizeResult> {
  const coordinates: OsrmCoordinate[] = input.latitudes.map((lat, i) => ({
    lat,
    lng: input.longitudes[i]!,
  }));

  const result = await osrm.osrmTrip(coordinates);
  const trip = result.trips[0]!;

  return {
    distanceM: trip.distance,
    durationS: trip.duration,
    geometry: trip.geometry,
    waypoints: result.waypoints.map((wp) => ({
      latitude: wp.location[1],
      longitude: wp.location[0],
    })),
  };
}
