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
import type { WasteCategory } from '@/lib/types';

// Visual helper for waste category badge styles
function getCategoryColor(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('plastic')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (lower.includes('organic') || lower.includes('food') || lower.includes('compost')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lower.includes('paper') || lower.includes('cardboard')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (lower.includes('metal') || lower.includes('aluminum')) return 'bg-slate-100 text-slate-700 border-slate-300';
  if (lower.includes('glass')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  if (lower.includes('hazard') || lower.includes('chemical') || lower.includes('e-waste') || lower.includes('electronic')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export default function WasteCategoriesPage() {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WasteCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<WasteCategory[]>('/waste-categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load waste categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category: WasteCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setIsActive(category.isActive ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingCategory) {
        await api.patch(`/waste-categories/${editingCategory.id}`, {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
        });
      } else {
        await api.post('/waste-categories', {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      setShowModal(false);
      await loadCategories();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save waste category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: WasteCategory) => {
    try {
      await api.patch(`/waste-categories/${cat.id}`, {
        isActive: !cat.isActive,
      });
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update category status');
    }
  };

  return (
    <ProtectedAppPage>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Waste Categories"
          description="Manage waste streams, recyclable classifications, and handling specifications"
        />
        <Button onClick={handleOpenAdd} data-testid="add-category-button">
          + Add Category
        </Button>
      </div>

      {loading && <LoadingState message="Loading waste categories…" />}
      {error && <ErrorState message={error} onRetry={loadCategories} />}

      {!loading && !error && categories.length === 0 && (
        <EmptyState
          title="No waste categories"
          description="Click '+ Add Category' to create the first waste classification."
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const active = cat.isActive !== false;
              const colorClass = getCategoryColor(cat.name);
              return (
                <div
                  key={cat.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${colorClass}`}
                      >
                        {cat.name}
                      </span>
                      <StatusBadge status={active ? 'available' : 'cancelled'} />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-gray-900">{cat.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                      {cat.description || 'No description provided for this waste category.'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <span>
                      {cat.createdAt
                        ? `Added ${new Date(cat.createdAt).toLocaleDateString()}`
                        : 'Standard Stream'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`font-medium transition-colors ${
                          active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        {active ? 'Deactivate' : 'Activate'}
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Data Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h4 className="text-sm font-semibold text-gray-900">All Waste Categories Table</h4>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={cat.isActive !== false ? 'available' : 'cancelled'} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {cat.isActive !== false ? 'Disable' : 'Enable'}
                        </button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Edit Waste Category' : 'Add Waste Category'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {editingCategory
                ? 'Update category information and handling instructions.'
                : 'Define a new waste classification for pickup requests.'}
            </p>

            {formError && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Food Waste, E-Waste, Cardboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase">
                  Description / Handling Guidelines
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Clean food scraps and biodegradable organic materials."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {editingCategory && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Category is Active (accepts new pickups)
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
                  {submitting ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedAppPage>
  );
}
