'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { ProtectedAppPage } from '@/components/layout/ProtectedAppPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { api, ApiError } from '@/lib/api';

interface Business {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('21.1702');
  const [longitude, setLongitude] = useState('72.8311');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Business[]>('/businesses');
      setBusinesses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/businesses', {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
      });
      setShowModal(false);
      setName('');
      setAddress('');
      await loadBusinesses();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedAppPage>
      <div className="flex items-center justify-between">
        <PageHeader title="Businesses" description="View and manage partner businesses and pickup locations" />
        <Button onClick={() => setShowModal(true)} data-testid="add-business-button">
          Add Business
        </Button>
      </div>

      {loading && <LoadingState message="Loading businesses…" />}
      {error && <ErrorState message={error} onRetry={loadBusinesses} />}

      {!loading && !error && businesses.length === 0 && (
        <EmptyState
          title="No businesses"
          description="Click 'Add Business' to register a new partner location."
        />
      )}

      {!loading && !error && businesses.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white" data-testid="businesses-table">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Address</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Coordinates</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {businesses.map((b) => (
                <tr key={b.id} data-testid={`business-row-${b.id}`}>
                  <td className="px-4 py-3 font-semibold text-gray-900">{b.name}</td>
                  <td className="px-4 py-3 text-gray-600">{b.address}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {b.latitude?.toFixed(4)}, {b.longitude?.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.contactEmail || b.contactPhone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="business-modal">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Add New Business</h3>
            {formError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" data-testid="business-form-error">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="businessName" className="block text-xs font-semibold uppercase text-gray-700">
                  Business Name *
                </label>
                <input
                  id="businessName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Recycling Center"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="businessAddress" className="block text-xs font-semibold uppercase text-gray-700">
                  Address *
                </label>
                <input
                  id="businessAddress"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Industrial Area, Surat"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="businessLatitude" className="block text-xs font-semibold uppercase text-gray-700">
                    Latitude *
                  </label>
                  <input
                    id="businessLatitude"
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="businessLongitude" className="block text-xs font-semibold uppercase text-gray-700">
                    Longitude *
                  </label>
                  <input
                    id="businessLongitude"
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="businessEmail" className="block text-xs font-semibold uppercase text-gray-700">
                  Contact Email
                </label>
                <input
                  id="businessEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@acme.com"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="businessPhone" className="block text-xs font-semibold uppercase text-gray-700">
                  Contact Phone
                </label>
                <input
                  id="businessPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting} data-testid="submit-business-button">
                  Save Business
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
