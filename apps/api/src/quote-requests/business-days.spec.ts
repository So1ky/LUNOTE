import { addBusinessDays } from './business-days';

// 날짜는 UTC로 고정해 로컬 타임존에 흔들리지 않게 한다 (2026-10-21은 수요일)
const at = (iso: string) => new Date(iso);

describe('addBusinessDays', () => {
  it('주중에서 주중으로 — 달력일과 같다', () => {
    expect(addBusinessDays(at('2026-10-20T09:30:00Z'), 2)).toEqual(
      at('2026-10-22T09:30:00Z'),
    );
  });

  it('금요일 + 1영업일 = 월요일 (토·일 건너뜀)', () => {
    expect(addBusinessDays(at('2026-10-23T09:30:00Z'), 1)).toEqual(
      at('2026-10-26T09:30:00Z'),
    );
  });

  it('수요일 + 5영업일 = 다음 주 수요일', () => {
    expect(addBusinessDays(at('2026-10-21T09:30:00Z'), 5)).toEqual(
      at('2026-10-28T09:30:00Z'),
    );
  });

  it('토요일에 시작하면 다음 월요일부터 센다', () => {
    expect(addBusinessDays(at('2026-10-24T09:30:00Z'), 1)).toEqual(
      at('2026-10-26T09:30:00Z'),
    );
  });

  it('0일이면 그대로, 시각은 유지된다', () => {
    const d = at('2026-10-21T23:59:59Z');
    expect(addBusinessDays(d, 0)).toEqual(d);
  });
});
