import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

export default function LimiteDeErro({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
}