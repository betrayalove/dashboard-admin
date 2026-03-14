import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router/router';
import '@/app/styles/global.css';

export function App() {
  return <RouterProvider router={router} />;
}
