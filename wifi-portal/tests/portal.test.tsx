import { render, screen } from '@testing-library/react';
import Portal from '@/components/portal/Portal';
import { SessionProvider } from '@/context/SessionContext';
import { apiService } from '@/services/api';

beforeEach(() => {
  vi.spyOn(apiService, 'getPlans').mockResolvedValue({
    data: {
      plans: [
        {
          id: 'plan-1',
          name: '2 hours',
          price: 500,
          duration_display: '2 hours',
          duration_hours: 2,
          is_active: true,
          sort_order: 1,
        },
      ],
      count: 1,
    },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WiFi Portal', () => {
  it('renders the portal entry form', async () => {
    render(
      <SessionProvider>
        <Portal />
      </SessionProvider>
    );

    expect(screen.getAllByText(/wifi hotspot/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /get connected/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/wifi-xxxxx-xxxxx/i)).toBeInTheDocument();
    expect(await screen.findByText(/2 hours/i)).toBeInTheDocument();
  });
});
