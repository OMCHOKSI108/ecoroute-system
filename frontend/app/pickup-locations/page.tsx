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
import type { PickupLocation, Business } from '@/lib/types';

export default function PickupLocationsPage() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState('');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PickupLocation | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('21.1702');
  const [longitude, setLongitude] = useState('72.8311');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingLocation, setDeletingLocation] = useState<PickupLocation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lData, bData] = await Promise.all([
        api.get<PickupLocation[]>('/pickup-locations'),
        api.get<Business[]>('/businesses').catch(() => []),
      ]);
      setLocations(Array.isArray(lData) ? lData : []);
      setBusinesses(Array.isArray(bData) ? bData : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pickup locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setSelectedBusinessId(businesses[0]?.id || '');
    setName('');
    setAddress('');
    setLatitude('21.1702');
    setLongitude('72.8311');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (loc: PickupLocation) => {
    setEditingLocation(loc);
    setSelectedBusinessId(loc.businessId || '');
    setName(loc.name || '');
    setAddress(loc.address || '');
    setLatitude(loc.latitude?.toString() || '21.1702');
    setLongitude(loc.longitude?.toString() || '72.8311');
    setIsActive(loc.isActive ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingLocation) {
        await api.patch(`/pickup-locations/${editingLocation.id}`, {
          name: name.trim() || undefined,
          address: address.trim() || undefined,
          latitude: lat,
          longitude: lng,
          isActive,
        });
      } else {
        if (!selectedBusinessId) {
          setFormError('Please select a business for this pickup location.');
          setSubmitting(false);
          return;
        }
        await api.post(`/businesses/${selectedBusinessId}/locations`, {
          name: name.trim(),
          address: address.trim() || undefined,
          latitude: lat,
          longitude: lng,
        });
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save pickup location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLocation) return;
    setDeleting(true);
    try {
      await api.delete(`/pickup-locations/${deletingLocation.id}`);
      setDeletingLocation(null);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete location');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (loc: PickupLocation) => {
    try {
      await api.patch(`/pickup-locations/${loc.id}`, {
        isActive: !loc.isActive,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update location status');
    }
  };

  const businessMap = new Map(businesses.map((b) => [b.id, b.name]));

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      !searchQuery ||
      (loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (loc.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (businessMap.get(loc.businessId)?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesBusiness = !selectedBusinessFilter || loc.businessId === selectedBusinessFilter;
    return matchesSearch && matchesBusiness;
  });

  return (
    <ProtectedAppPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Pickup Locations"
          description="Manage pickup docks, collection depots, and geocoded premises across partner businesses"
        />
        <Button onClick={handleOpenAdd} data-testid="add-location-button">
          + Add Location
        </Button>
      </div>

      {loading && <LoadingState message="Loading pickup locations…" />}
      {error && <ErrorState message={error} onRetry={loadData} />}

      {!loading && !error && locations.length === 0 && (
        <EmptyState
          title="No pickup locations"
          description="Click '+ Add Location' to create your first pickup spot."
        />
      )}

      {!loading && !error && locations.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search locations by name, address, or business…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="w-56">
              <select
                value={selectedBusinessFilter}
                onChange={(e) => setSelectedBusinessFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Businesses</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {(searchQuery || selectedBusinessFilter) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBusinessFilter('');
                }}
              >
                Clear
              </Button>
            )}
            <div className="ml-auto text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filteredLocations.length}</span> of{' '}
              {locations.length} locations
            </div>
          </div>

          {/* Locations Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
            <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="w-[20%] px-4 py-3">Location Name</th>
                  <th className="w-[17%] px-4 py-3">Partner Business</th>
                  <th className="w-[24%] px-4 py-3">Address</th>
                  <th className="w-[13%] px-4 py-3">Coordinates</th>
                  <th className="w-[10%] px-4 py-3">Status</th>
                  <th className="w-[16%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLocations.map((loc) => {
                  const businessName = businessMap.get(loc.businessId) || loc.businessName || '—';
                  const active = loc.isActive !== false;
                  return (
                    <tr key={loc.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="truncate px-4 py-3 font-medium text-gray-900" title={loc.name}>
                        {loc.name || 'Unnamed Location'}
                      </td>
                      <td className="truncate px-4 py-3 text-gray-600">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-100 truncate max-w-full">
                          {businessName}
                        </span>
                      </td>
                      <td className="truncate px-4 py-3 text-gray-600" title={loc.address}>
                        {loc.address || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                        {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={active ? 'available' : 'cancelled'} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleToggleStatus(loc)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            {active ? 'Disable' : 'Enable'}
                          </button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(loc)}
                          >
                            Edit
                          </Button>
                          <button
                            onClick={() => setDeletingLocation(loc)}
                            className="text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Location Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editingLocation
                ? 'Update location details and geospatial coordinates.'
                : 'Register a physical loading dock or collection point for a partner business.'}
            </p>

            {formError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {!editingLocation && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase">
                    Partner Business *
                  </label>
                  <select
                    required
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Select a business…</option>
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loading Dock B, Main Warehouse Depot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 12, GIDC Sachin, Surat"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase">
                    Latitude (-90 to 90) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 uppercase">
                    Longitude (-180 to 180) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {editingLocation && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="locIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="locIsActive" className="text-sm font-medium text-gray-700">
                    Location is Active
                  </label>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : editingLocation ? 'Save Changes' : 'Create Location'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingLocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Pickup Location?</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete &ldquo;{deletingLocation.name || 'this location'}&rdquo;?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setDeletingLocation(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
