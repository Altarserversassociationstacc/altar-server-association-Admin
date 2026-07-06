import React, { useState } from 'react';
import { AdminGalleryForm } from './AdminGalleryForm';
import { AdminGalleryList } from './AdminGalleryList';

const AdminGalleryManager = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    // Incrementing this key triggers the useEffect in AdminGalleryList
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-8 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <AdminGalleryForm onSuccess={handleRefresh} />
        </div>
        <div className="lg:col-span-2">
          <AdminGalleryList refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default AdminGalleryManager;