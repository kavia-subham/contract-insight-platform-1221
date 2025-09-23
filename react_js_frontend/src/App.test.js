import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard link in sidebar/topbar', () => {
  render(<App />);
  const el = screen.getAllByText(/dashboard/i)[0];
  expect(el).toBeInTheDocument();
});
