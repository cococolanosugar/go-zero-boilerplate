import { describe, it, expect } from "vitest";
import {
  buildCasdoorAuthUrl,
  parseCasdoorCallback,
  DEFAULT_CASDOOR_CONFIG,
} from "@zero/shared";

describe("Casdoor SSO Utilities", () => {
  describe("buildCasdoorAuthUrl", () => {
    it("builds auth URL with default configurations and custom redirectUri", () => {
      const redirectUri = "http://localhost:3001/callback";
      const urlStr = buildCasdoorAuthUrl({ redirectUri });
      const url = new URL(urlStr);

      expect(url.origin).toBe(DEFAULT_CASDOOR_CONFIG.endpoint);
      expect(url.pathname).toBe("/login/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe(DEFAULT_CASDOOR_CONFIG.clientId);
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("redirect_uri")).toBe(redirectUri);
      expect(url.searchParams.get("scope")).toBe("read");
      expect(url.searchParams.get("state")).toBeTruthy();
    });

    it("respects custom state and overrides for endpoint and clientId", () => {
      const redirectUri = "http://example.com/callback";
      const customEndpoint = "https://sso.mycorp.internal/";
      const customClientId = "custom-client-123";
      const customState = "test-csrf-token-xyz";

      const urlStr = buildCasdoorAuthUrl(
        {
          endpoint: customEndpoint,
          clientId: customClientId,
          redirectUri,
        },
        customState
      );
      const url = new URL(urlStr);

      expect(url.origin).toBe("https://sso.mycorp.internal");
      expect(url.pathname).toBe("/login/oauth/authorize");
      expect(url.searchParams.get("client_id")).toBe(customClientId);
      expect(url.searchParams.get("redirect_uri")).toBe(redirectUri);
      expect(url.searchParams.get("state")).toBe(customState);
    });

    it("trims trailing slashes in endpoint properly", () => {
      const urlStr = buildCasdoorAuthUrl({
        endpoint: "http://localhost:8000///",
        redirectUri: "http://localhost:3001/callback",
      });
      expect(urlStr.startsWith("http://localhost:8000/login/oauth/authorize?")).toBe(true);
    });
  });

  describe("parseCasdoorCallback", () => {
    it("extracts code and state from standard search query", () => {
      const search = "?code=auth_code_12345&state=random_state_987";
      const result = parseCasdoorCallback(search);
      expect(result.code).toBe("auth_code_12345");
      expect(result.state).toBe("random_state_987");
    });

    it("handles search queries with extra parameters", () => {
      const search = "?foo=bar&code=xyz123&baz=qux&state=state456";
      const result = parseCasdoorCallback(search);
      expect(result.code).toBe("xyz123");
      expect(result.state).toBe("state456");
    });

    it("returns null when code or state is missing", () => {
      const result1 = parseCasdoorCallback("");
      expect(result1.code).toBeNull();
      expect(result1.state).toBeNull();

      const result2 = parseCasdoorCallback("?error=access_denied");
      expect(result2.code).toBeNull();
      expect(result2.state).toBeNull();
    });
  });
});
