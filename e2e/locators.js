/** 一律走 data-testid。 */

export const tid = (page, id) => page.getByTestId(id);

export const roomRow = (page, roomId) =>
  page.locator(`[data-testid="mr-room-row"][data-room-id="${roomId}"]`);

export const roomCard = (page, roomId) =>
  page.locator(`[data-testid="mr-room-card"][data-room-id="${roomId}"]`);

export const mineCard = (page, bookingId) =>
  page.locator(`[data-testid="mr-mine-card"][data-booking-id="${bookingId}"]`);
