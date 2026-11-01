const ranking = require("../services/rankingService");

const flight = (price, time) => ({
  price,
  durationMinutes: 120,
  stops: 0,
  departureTime: `2026-11-02T${time}:00.000Z`,
});

describe("Ranking: departure time windows", () => {
  it("checks both bounds of a morning window", () => {
    expect(ranking.isInTimeWindow("2026-11-02T06:15:00.000Z", "05:00", "12:00")).toBe(true);
    expect(ranking.isInTimeWindow("2026-11-02T22:15:00.000Z", "05:00", "12:00")).toBe(false);
    expect(ranking.isInTimeWindow("2026-11-02T12:00:00.000Z", "05:00", "12:00")).toBe(false);
  });

  it("supports a night window that crosses midnight", () => {
    expect(ranking.isInTimeWindow("2026-11-02T23:30:00.000Z", "21:00", "05:00")).toBe(true);
    expect(ranking.isInTimeWindow("2026-11-02T02:00:00.000Z", "21:00", "05:00")).toBe(true);
    expect(ranking.isInTimeWindow("2026-11-02T10:00:00.000Z", "21:00", "05:00")).toBe(false);
  });

  it("ranks in-window flights above cheaper out-of-window flights", () => {
    const ranked = ranking.rankFlights(
      [flight(3000, "22:15"), flight(4000, "07:00")],
      { sortBy: "price", timeSlot: "morning", afterTime: "05:00", beforeTime: "12:00" }
    );
    expect(ranked[0].departureTime).toContain("T07:00");
    expect(ranked[0].matchesTimeWindow).toBe(true);
    expect(ranked[1].matchesTimeWindow).toBe(false);
  });
});