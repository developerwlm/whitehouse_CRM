import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', description = 'There are currently no items matching your criteria.', action = null, icon = null }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-white border border-dashed border-slate-200">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100 shadow-sm">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
