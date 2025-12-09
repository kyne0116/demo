'use client';

import React from 'react';
import InventoryMonitor from '../../components/InventoryMonitor';
import PermissionGuard from '../../components/PermissionGuard';

export default function InventoryMonitorPage() {
  return (
    <PermissionGuard permission="inventory:read" showMessage={false}>
      <InventoryMonitor />
    </PermissionGuard>
  );
}