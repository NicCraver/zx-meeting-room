/** 冻结「现在」为周二 10:00（上海）。只改 Date，不碰 setTimeout（Vue/axios 还要定时器）。 */

export const FROZEN_ISO = "2026-09-15T10:00:00+08:00";
export const TODAY = "2026-09-15";
export const TOMORROW = "2026-09-16";
export const YESTERDAY = "2026-09-14";

export async function freezeClock(page) {
  const frozen = Date.parse(FROZEN_ISO);
  await page.addInitScript((ms) => {
    const RealDate = Date;
    const FakeDate = class extends RealDate {
      constructor(...args) {
        if (args.length === 0) super(ms);
        else super(...args);
      }
      static now() {
        return ms;
      }
    };
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    FakeDate.toString = () => "function Date() { [native code] }";
    // eslint-disable-next-line no-global-assign
    Date = FakeDate;
  }, frozen);
}
