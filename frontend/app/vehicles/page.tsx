'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, ApiError } from '@/lib/api';
import type { Vehicle, Driver } from '@/lib/types';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add vehicle modal
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('Truck');
  const [capacityKg, setCapacityKg] = useState('500');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Assign driver modal
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, dData] = await Promise.all([
        api.get<Vehicle[]>('/vehicles'),
        api.get<Driver[]>('/drivers').catch(() => []),
      ]);
      setVehicles(Array.isArray(vData) ? vData : []);
      setDrivers(Array.isArray(dData) ? dData : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateVehicle = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/vehicles', {
        plateNumber,
        model: type || 'Truck',
        capacityKg: parseFloat(capacityKg),
      });
      setShowVehicleModal(false);
      setPlateNumber('');
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDriver = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedDriverId) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await api.post(`/vehicles/${selectedVehicle.id}/driver`, {
        driverId: selectedDriverId,
      });
      setSelectedVehicle(null);
      setSelectedDriverId('');
      await loadData();
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Failed to assign driver');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <ProtectedAppPage>
      <div className="flex items-center justify-between">
        <PageHeader title="Vehicles" description="Manage fleet vehicles, capacity, and driver allocations" />
        <Button onClick={() => setShowVehicleModal(true)} data-testid="add-vehicle-button">
          Add Vehicle
        </Button>
      </div>

      {loading && <LoadingState message="Loading vehicles…" />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && vehicles.length === 0 && (
        <EmptyState
          title="No vehicles"
          description="Click 'Add Vehicle' to register a new collection vehicle."
        />
      )}

      {!loading && !error && vehicles.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white" data-testid="vehicles-table">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Plate Number</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Capacity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Current Load</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Driver</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vehicles.map((v) => {
                const assignedDriver = drivers.find((d) => (v as any).driverId === d.id);
                return (
                  <tr key={v.id} data-testid={`vehicle-row-${v.id}`}>
                    <td className="px-4 py-3 font-semibold text-gray-900" data-testid={`vehicle-plate-${v.id}`}>
                      {v.plateNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.type}</td>
                    <td className="px-4 py-3 text-gray-900" data-testid={`vehicle-capacity-${v.id}`}>
                      {v.capacityKg} kg
                    </td>
                    <td className="px-4 py-3 text-gray-900" data-testid={`vehicle-load-${v.id}`}>
                      {v.currentLoadKg ?? 0} kg
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600" data-testid={`vehicle-driver-${v.id}`}>
                      {assignedDriver ? (assignedDriver.name || `${assignedDriver.firstName || ''} ${assignedDriver.lastName || ''}`.trim() || assignedDriver.email) : ((v as any).driverId ? 'Assigned' : 'Unassigned')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVehicle(v);
                          setSelectedDriverId((v as any).driverId || '');
                        }}
                        data-testid={`assign-driver-button-${v.id}`}
                      >
                        Assign Driver
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="vehicle-modal">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Add New Vehicle</h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" data-testid="vehicle-form-error">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label htmlFor="plateNumber" className="block text-xs font-semibold uppercase text-gray-700">
                  Plate Number *
                </label>
                <input
                  id="plateNumber"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="GJ-05-AB-1234"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="vehicleType" className="block text-xs font-semibold uppercase text-gray-700">
                  Vehicle Type *
                </label>
                <select
                  id="vehicleType"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Compactor">Compactor</option>
                  <option value="Electric Carrier">Electric Carrier</option>
                </select>
              </div>

              <div>
                <label htmlFor="capacityKg" className="block text-xs font-semibold uppercase text-gray-700">
                  Capacity (kg) *
                </label>
                <input
                  id="capacityKg"
                  type="number"
                  min="1"
                  required
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                  placeholder="500"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowVehicleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} data-testid="submit-vehicle-button">
                  Save Vehicle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="assign-driver-modal">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Assign Driver</h3>
            <p className="mb-4 text-sm text-gray-500">
              Assign a certified driver to vehicle <span className="font-semibold text-gray-900">{selectedVehicle.plateNumber}</span>.
            </p>
            {assignError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" data-testid="assign-driver-error">
                {assignError}
              </div>
            )}
            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label htmlFor="driverSelect" className="block text-xs font-semibold uppercase text-gray-700">
                  Select Driver *
                </label>
                <select
                  id="driverSelect"
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  data-testid="driver-select"
                >
                  <option value="">-- Choose an available driver --</option>
                  {drivers.map((d) => {
                    const displayName = (d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email).trim();
                    const statusStr = d.status || d.driverStatus || 'available';
                    return (
                      <option key={d.id} value={d.id}>
                        {displayName} ({statusStr})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedVehicle(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={assigning} data-testid="confirm-assign-driver-button">
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
