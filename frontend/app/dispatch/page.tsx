'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { api, ApiError } from '@/lib/api';
import type { Pickup, Vehicle, Driver } from '@/lib/types';

export default function DispatchPage() {
  const router = useRouter();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection states
  const [selectedPickupIds, setSelectedPickupIds] = useState<string[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Execution states
  const [assigning, setAssigning] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  // Route generation states
  const [generatingRoute, setGeneratingRoute] = useState(false);
  const [generatedRouteId, setGeneratedRouteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pData, vData, dData] = await Promise.all([
        api.get<Pickup[]>('/pickups?status=pending'),
        api.get<Vehicle[]>('/vehicles'),
        api.get<Driver[]>('/drivers').catch(() => []),
      ]);
      setPickups(Array.isArray(pData) ? pData : []);
      setVehicles(Array.isArray(vData) ? vData : []);
      setDrivers(Array.isArray(dData) ? dData : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load dispatch board data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePickup = (id: string) => {
    setSelectedPickupIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const selectedPickups = pickups.filter((p) => selectedPickupIds.includes(p.id));
  const totalWeight = selectedPickups.reduce(
    (sum, p) => sum + ((p as any).estimatedWeightKg ?? p.weightKg ?? 0),
    0,
  );
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isOverweight = selectedVehicle ? totalWeight > selectedVehicle.capacityKg : false;

  const handleAssignDispatch = async () => {
    if (!selectedVehicleId) {
      setDispatchError('Please select a target vehicle');
      return;
    }
    if (selectedPickupIds.length === 0) {
      setDispatchError('Please select at least one pickup');
      return;
    }

    setAssigning(true);
    setDispatchError(null);
    setDispatchSuccess(null);

    try {
      await api.post('/dispatch/assign', {
        vehicleId: selectedVehicleId,
        pickupIds: selectedPickupIds,
      });

      setDispatchSuccess(
        `Successfully dispatched ${selectedPickups.length} pickups (${totalWeight} kg) to vehicle ${selectedVehicle?.plateNumber}!`,
      );
      setSelectedPickupIds([]);
      await loadData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Dispatch assignment failed';
      setDispatchError(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleGenerateRoute = async (vehicleId: string) => {
    setGeneratingRoute(true);
    setDispatchError(null);
    try {
      const route = await api.post<{ id: string; pickupCount: number }>('/routes/generate', {
        vehicleId,
      });
      setGeneratedRouteId(route.id);
      router.push(`/routes/${route.id}`);
    } catch (err) {
      setDispatchError(err instanceof ApiError ? err.message : 'Route generation failed');
    } finally {
      setGeneratingRoute(false);
    }
  };

  return (
    <ProtectedAppPage allowedRoles={['admin', 'dispatcher']}>
      <PageHeader
        title="Dispatch Optimization"
        description="Allocate pickup requests to fleet vehicles within capacity boundaries"
      />

      {loading && <LoadingState message="Loading dispatch board…" />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {dispatchError && (
        <div
          className="my-4 rounded-lg bg-red-50 p-4 border border-red-200 text-sm font-medium text-red-800"
          data-testid="dispatch-error"
        >
          {dispatchError}
        </div>
      )}

      {dispatchSuccess && (
        <div
          className="my-4 rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm font-medium text-emerald-800 flex items-center justify-between"
          data-testid="dispatch-success"
        >
          <span>{dispatchSuccess}</span>
          {selectedVehicleId && (
            <Button
              size="sm"
              loading={generatingRoute}
              onClick={() => handleGenerateRoute(selectedVehicleId)}
              data-testid="generate-route-button"
            >
              Generate Optimized Route
            </Button>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Pickups Panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                Pending Pickups ({pickups.length})
              </h3>
              <span className="text-xs text-gray-500">
                {selectedPickupIds.length} selected ({totalWeight} kg)
              </span>
            </div>
            {pickups.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No pending pickups available</p>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto">
                {pickups.map((p) => {
                  const weight = (p as any).estimatedWeightKg ?? p.weightKg ?? 0;
                  const selected = selectedPickupIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      data-testid={`pickup-select-card-${p.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => togglePickup(p.id)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          data-testid={`pickup-checkbox-${p.id}`}
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{p.wasteCategory}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-gray-800" data-testid={`pickup-card-weight-${p.id}`}>
                        {weight} kg
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vehicles Panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Fleet Vehicles ({vehicles.length})</h3>
            </div>
            {vehicles.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No vehicles available</p>
            ) : (
              <div className="space-y-2 max-h-[450px] overflow-y-auto">
                {vehicles.map((v) => {
                  const selected = selectedVehicleId === v.id;
                  const driver = drivers.find((d) => (v as any).driverId === d.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      data-testid={`vehicle-select-card-${v.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedVehicle"
                            checked={selected}
                            onChange={() => setSelectedVehicleId(v.id)}
                            className="h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            data-testid={`vehicle-radio-${v.id}`}
                          />
                          <div>
                            <span className="font-semibold text-sm text-gray-900">
                              {v.plateNumber}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">({v.type})</span>
                          </div>
                        </div>
                        <StatusBadge status={v.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-2 pl-7">
                        <span>
                          Capacity: <strong data-testid={`vehicle-card-capacity-${v.id}`}>{v.capacityKg} kg</strong>
                        </span>
                        <span>
                          Load: <strong data-testid={`vehicle-card-load-${v.id}`}>{v.currentLoadKg ?? 0} kg</strong>
                        </span>
                      </div>
                      {v.status === 'dispatched' && (
                        <div className="mt-2 pl-7">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              handleGenerateRoute(v.id);
                            }}
                            data-testid={`generate-route-btn-${v.id}`}
                          >
                            Generate Route
                          </Button>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Allocation & Preview Panel */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Capacity & Allocation Preview</h3>
              <div className="space-y-3 rounded-lg bg-gray-50 p-4 border border-gray-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Selected Pickups:</span>
                  <span className="font-medium text-gray-900">{selectedPickupIds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Weight:</span>
                  <span
                    className={`font-semibold ${
                      isOverweight ? 'text-red-600' : 'text-gray-900'
                    }`}
                    data-testid="preview-total-weight"
                  >
                    {totalWeight} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle Limit:</span>
                  <span className="font-medium text-gray-900" data-testid="preview-vehicle-capacity">
                    {selectedVehicle ? `${selectedVehicle.capacityKg} kg` : 'None selected'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Capacity Status:</span>
                  <span
                    className={`font-bold ${
                      !selectedVehicle
                        ? 'text-gray-400'
                        : isOverweight
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}
                    data-testid="preview-capacity-status"
                  >
                    {!selectedVehicle
                      ? 'Select Vehicle'
                      : isOverweight
                      ? `OVERFLOW (+${totalWeight - selectedVehicle.capacityKg} kg)`
                      : 'ACCEPTABLE'}
                  </span>
                </div>
              </div>

              {isOverweight && (
                <div className="mt-4 rounded-md bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                  ⚠️ <strong>Capacity Warning:</strong> Selected payload exceeds the vehicle’s max
                  rating. Server dispatch logic will reject this assignment.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                disabled={selectedPickupIds.length === 0 || !selectedVehicleId}
                loading={assigning}
                onClick={handleAssignDispatch}
                data-testid="assign-dispatch-button"
              >
                Confirm Dispatch Assignment
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
