import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/app/layout/Layout';
import { ProtectedRoute } from '@/app/providers/ProtectedRoute';
import { GuestOnlyRoute } from '@/app/providers/GuestOnlyRoute';
import { LoginPage } from '@/pages/login/LoginPage';
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const UsersTablePage = lazy(() => import('@/pages/users-table/UsersTablePage').then((module) => ({ default: module.UsersTablePage })));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Suspense fallback={<p role="status">Загрузка…</p>}><DashboardPage /></Suspense> },
      { path: 'users', element: <Suspense fallback={<p role="status">Загрузка…</p>}><UsersTablePage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<p role="status">Загрузка…</p>}><SettingsPage /></Suspense> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
