'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface VehicleFormValues {
  plateNumber: string;
  type: string;
  capacityKg: number;
}

interface VehicleFormProps {
  onSubmit: (data: VehicleFormValues) => Promise<void>;
  loading?: boolean;
}

export function VehicleForm({ onSubmit, loading }: VehicleFormProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState('');
  const [capacityKg, setCapacityKg] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit({ plateNumber, type, capacityKg: Number(capacityKg) });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Plate Number
        </label>
        <input
          required
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
        <input
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Capacity (kg)
        </label>
        <input
          type="number"
          min="0"
          required
          value={capacityKg}
          onChange={(e) => setCapacityKg(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <Button type="submit" loading={loading}>
        Save Vehicle
      </Button>
    </form>
  );
}
