import { render, screen } from '@testing-library/react';
import Hud from './Hud';

test('renders learn react link', () => {
  render(<Hud />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
