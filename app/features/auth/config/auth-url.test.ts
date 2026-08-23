import { getSafeNextPath } from "./auth-url";

describe("getSafeNextPath", () => {
  it.each([undefined, null, "", "https://evil.example", "//evil.example"]) (
    "mengganti tujuan tidak aman %p dengan halaman akun",
    (value) => {
      expect(getSafeNextPath(value)).toBe("/account");
    },
  );

  it("mempertahankan path internal", () => {
    expect(getSafeNextPath("/cek-lartas?mode=file")).toBe(
      "/cek-lartas?mode=file",
    );
  });
});
