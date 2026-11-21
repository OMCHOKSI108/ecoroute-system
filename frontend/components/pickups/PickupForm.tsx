'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface PickupFormValues {
  wasteCategory: string;
  weightKg: number;
  scheduledAt: string;
}

interface PickupFormProps {
  onSubmit: (data: PickupFormValues) => Promise<void>;
  loading?: boolean;
}

export function PickupForm({ onSubmit, loading }: PickupFormProps) {
  const [wasteCategory, setWasteCategory] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({ wasteCategory, weightKg: Number(weightKg), scheduledAt });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Waste Category
        </label>
        <input
          required
          value={wasteCategory}
          onChange={(e) => setWasteCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Weight (kg)
        </label>
        <input
          type="number"
          min="0"
          step="0.1"
          required
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Scheduled At
        </label>
        <input
          type="datetime-local"
          required
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" loading={loading}>
        Create Pickup
      </Button>
    </form>
  );
}
