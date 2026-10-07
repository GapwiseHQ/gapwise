import { describe, expect, test } from "bun:test";
import { selectableCampusesForUniversity, universityById } from "@/universities/registry";

describe("campus selector campus candidates", () => {
  test("includes only host-addressable campuses for each active edition", () => {
    expect(selectableCampusesForUniversity(universityById("uoft")!)).toEqual(["utm", "utsg", "utsc"]);
    expect(selectableCampusesForUniversity(universityById("carleton")!)).toEqual(["carleton"]);
    expect(selectableCampusesForUniversity(universityById("tmu")!)).toEqual(["tmu"]);
    expect(selectableCampusesForUniversity(universityById("queens")!)).toEqual(["queens"]);
    expect(selectableCampusesForUniversity(universityById("laurier")!)).toEqual(["waterloo"]);
  });
});
