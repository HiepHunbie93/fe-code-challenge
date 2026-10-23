import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { formatAmount } from './lib/format';
import { mockBalances, normalizePrices } from './lib/tokens';
import type { SwapRequest } from './services/swapService';
import { PRICE_FEED, mockFetch } from './test/fixtures';

const ETH_BALANCE = mockBalances(normalizePrices(PRICE_FEED)).ETH;

const instantSwap = vi.fn((req: SwapRequest) =>
  Promise.resolve({ ...req, id: 'TEST1234', executedAt: '2024-01-01T00:00:00Z' }),
);

const setup = async (props: Parameters<typeof App>[0] = { submitSwap: instantSwap }) => {
  mockFetch();
  const user = userEvent.setup();
  render(<App {...props} />);
  const send = await screen.findByLabelText('You send');
  const receive = screen.getByLabelText('You receive');
  const submit = () => screen.getByRole('button', { name: /confirm swap|enter an amount|insufficient|try again/i });
  return { user, send, receive, submit };
};

const sendToken = () => screen.getByRole('button', { name: /^You send token:/ });
const receiveToken = () => screen.getByRole('button', { name: /^You receive token:/ });

describe('swap form', () => {
  it('shows a loading state, then defaults to ETH → USDC', async () => {
    mockFetch();
    render(<App />);
    expect(screen.getByLabelText('Loading prices')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'You send token: ETH' })).toBeInTheDocument();
    expect(receiveToken()).toHaveAccessibleName('You receive token: USDC');
    expect(screen.getByRole('button', { name: 'Enter an amount' })).toBeDisabled();
  });

  it('converts in both directions', async () => {
    const { user, send, receive } = await setup();

    await user.type(send, '1.5');
    expect(Number((receive as HTMLInputElement).value)).toBeCloseTo((1.5 * 1645.9337373737374) / 0.9998782611186441, 4);

    await user.clear(receive);
    await user.type(receive, '100');
    expect(Number((send as HTMLInputElement).value)).toBeCloseTo((100 * 0.9998782611186441) / 1645.9337373737374, 6);
  });

  it('ignores characters that are not part of a number', async () => {
    const { user, send } = await setup();
    await user.type(send, '1a2.3.4');
    expect(send).toHaveValue('12.34');
  });

  it('blocks amounts above the balance and amounts of zero', async () => {
    const { user, send, submit } = await setup();

    await user.type(send, '999999');
    expect(screen.getByRole('alert')).toHaveTextContent('Insufficient ETH balance');
    expect(submit()).toBeDisabled();

    await user.clear(send);
    await user.type(send, '0');
    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than 0');
  });

  it('MAX fills the whole balance and stays submittable', async () => {
    const { user, send, submit } = await setup();
    await user.click(screen.getByRole('button', { name: 'MAX' }));
    expect(Number((send as HTMLInputElement).value)).toBe(ETH_BALANCE);
    expect(submit()).toBeEnabled();
  });

  it('flips the pair and keeps the typed amount with its token', async () => {
    const { user, send, receive } = await setup();
    await user.type(send, '2');
    await user.click(screen.getByRole('button', { name: 'Swap send and receive tokens' }));

    expect(sendToken()).toHaveTextContent('USDC');
    expect(receiveToken()).toHaveTextContent('ETH');
    expect(receive).toHaveValue('2');
    expect(Number((send as HTMLInputElement).value)).toBeGreaterThan(3000);
  });

  it('picks a token from the searchable list with the keyboard', async () => {
    const { user } = await setup();
    await user.click(sendToken());

    const dialog = screen.getByRole('dialog', { name: 'Select a token' });
    await user.type(within(dialog).getByPlaceholderText('Search by symbol'), 'swth{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sendToken()).toHaveTextContent('SWTH');
  });

  it('choosing the other side’s token swaps the pair instead of duplicating it', async () => {
    const { user } = await setup();
    await user.click(sendToken());
    await user.click(within(screen.getByRole('dialog')).getByRole('option', { name: /USDC/ }));

    expect(sendToken()).toHaveTextContent('USDC');
    expect(receiveToken()).toHaveTextContent('ETH');
  });

  it('closes the picker with Escape and returns focus to the opener', async () => {
    const { user } = await setup();
    const opener = sendToken();
    await user.click(opener);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('submits, shows the receipt and updates balances', async () => {
    const { user, send, submit } = await setup();
    await user.type(send, '1');
    await user.click(submit());

    expect(instantSwap).toHaveBeenCalledWith(
      expect.objectContaining({ fromSymbol: 'ETH', toSymbol: 'USDC', fromAmount: 1 }),
    );
    expect(await screen.findByText('Swap complete')).toBeInTheDocument();
    expect(screen.getByText(/TEST1234/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Make another swap' }));
    expect(screen.getByLabelText('You send')).toHaveValue('');
    expect(screen.getAllByText(/^Balance:/)[0]).toHaveTextContent(`Balance: ${formatAmount(ETH_BALANCE - 1)}`);
  });

  it('shows a loading state while the swap is pending and locks the form', async () => {
    let resolve!: () => void;
    const slowSwap = vi.fn(
      (req: SwapRequest) =>
        new Promise<never>((res) => {
          resolve = () => res({ ...req, id: 'X', executedAt: '' } as never);
        }),
    );
    const { user, send, submit } = await setup({ submitSwap: slowSwap });
    await user.type(send, '1');
    await user.click(submit());

    expect(screen.getByRole('button', { name: /swapping/i })).toBeDisabled();
    expect(send).toBeDisabled();
    resolve();
    expect(await screen.findByText('Swap complete')).toBeInTheDocument();
  });

  it('shows the error and lets the user retry when the swap fails', async () => {
    const failingSwap = vi.fn().mockRejectedValueOnce(new Error('Network down')).mockImplementation(instantSwap);
    const { user, send } = await setup({ submitSwap: failingSwap });
    await user.type(send, '1');
    await user.click(screen.getByRole('button', { name: 'Confirm swap' }));

    expect(await screen.findByText('Network down')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Swap complete')).toBeInTheDocument();
  });

  it('offers a retry when prices fail to load', async () => {
    const fetch = mockFetch([], false);
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('503');

    fetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(PRICE_FEED) });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByLabelText('You send')).toBeInTheDocument());
  });
});
