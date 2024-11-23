import React from 'react';
import { Clock, Filter } from 'lucide-react';
import { Filters, TimeFilter, TIME_FILTERS } from '../types/filters';

interface NewsFiltersProps {
  filters: Filters;
  categories: string[];
  onFilterChange: (filters: Filters) => void;
}

export default function NewsFilters({ filters, categories, onFilterChange }: NewsFiltersProps) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-500" />
        <select
          value={filters.category || ''}
          onChange={(e) => onFilterChange({ ...filters, category: e.target.value || null })}
          className="rounded-lg border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-gray-500" />
        <div className="flex rounded-lg bg-white shadow-sm">
          {(Object.entries(TIME_FILTERS) as [TimeFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => onFilterChange({ ...filters, timeFrame: value })}
              className={`px-4 py-2 text-sm transition-colors first:rounded-l-lg last:rounded-r-lg
                ${filters.timeFrame === value
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}