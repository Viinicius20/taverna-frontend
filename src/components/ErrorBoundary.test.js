import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Quebra() {
  throw new Error('falhou');
}

test('mostra o aviso em vez de uma tela preta quando um filho quebra', () => {
  const silencio = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<ErrorBoundary><Quebra /></ErrorBoundary>);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('ALGO DEU ERRADO')).toBeTruthy();
  silencio.mockRestore();
});

test('não interfere quando não há erro', () => {
  render(<ErrorBoundary><p>tudo certo</p></ErrorBoundary>);
  expect(screen.getByText('tudo certo')).toBeTruthy();
});