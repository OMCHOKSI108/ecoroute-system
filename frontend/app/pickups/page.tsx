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
import type { Pickup, Business } from '@/lib/types';

export default function PickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [businessId, setBusinessId] = useState('');
  const [wasteCategory, setWasteCategory] = useState('Plastic');
  const [weightKg, setWeightKg] = useState('200');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pData = await api.get<Pickup[]>('/pickups').catch(async (err) => {
        if (err instanceof ApiError && err.status === 403) {
          return api.get<Pickup[]>('/pickups/my').catch(() => []);
        }
        return [];
      });
      const bData = await api.get<Business[]>('/businesses').catch(() => []);
      setPickups(Array.isArray(pData) ? pData : []);
      setBusinesses(Array.isArray(bData) ? bData : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pickups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePickup = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setFormError('Weight must be a positive number');
      return;
    }

    if (!businessId) {
      setFormError('Please select a business');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/pickups', {
        businessId,
        wasteCategory,
        estimatedWeightKg: parsedWeight,
        notes: notes || undefined,
      });
      setShowModal(false);
      setWeightKg('200');
      setNotes('');
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create pickup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedAppPage>
      <div className="flex items-center justify-between">
        <PageHeader title="Pickups" description="Manage on-demand and scheduled waste collection requests" />
        <Button onClick={() => setShowModal(true)} data-testid="add-pickup-button">
          Create Pickup
        </Button>
      </div>

      {loading && <LoadingState message="Loading pickups…" />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && pickups.length === 0 && (
        <EmptyState
          title="No pickups"
          description="Click 'Create Pickup' to request a new waste collection."
        />
      )}

      {!loading && !error && pickups.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white" data-testid="pickups-table">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Weight</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pickups.map((p) => {
                const weight = (p as any).estimatedWeightKg ?? p.weightKg ?? 0;
                return (
                  <tr key={p.id} data-testid={`pickup-row-${p.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.wasteCategory}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900" data-testid={`pickup-weight-${p.id}`}>
                      {weight} kg
                    </td>
                    <td className="px-4 py-3" data-testid={`pickup-status-${p.id}`}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {(p as any).assignedVehicleId || (p as any).assigned_vehicle_id ? 'Assigned' : 'Unassigned'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Pickup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="pickup-modal">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Create Pickup Request</h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" data-testid="pickup-form-error">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreatePickup} className="space-y-4">
              <div>
                <label htmlFor="businessSelect" className="block text-xs font-semibold uppercase text-gray-700">
                  Business Location *
                </label>
                <select
                  id="businessSelect"
                  required
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  data-testid="pickup-business-select"
                >
                  <option value="">-- Select Partner Business --</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="wasteCategory" className="block text-xs font-semibold uppercase text-gray-700">
                  Waste Category *
                </label>
                <select
                  id="wasteCategory"
                  value={wasteCategory}
                  onChange={(e) => setWasteCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  data-testid="pickup-category-select"
                >
                  <option value="Plastic">Plastic</option>
                  <option value="Paper">Paper</option>
                  <option value="Glass">Glass</option>
                  <option value="Metal">Metal</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Organic">Organic</option>
                </select>
              </div>

              <div>
                <label htmlFor="weightKg" className="block text-xs font-semibold uppercase text-gray-700">
                  Estimated Weight (kg) *
                </label>
                <input
                  id="weightKg"
                  type="number"
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="200"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  data-testid="pickup-weight-input"
                />
              </div>

              <div>
                <label htmlFor="pickupNotes" className="block text-xs font-semibold uppercase text-gray-700">
                  Notes
                </label>
                <input
                  id="pickupNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Loading dock entrance B"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} data-testid="submit-pickup-button">
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
