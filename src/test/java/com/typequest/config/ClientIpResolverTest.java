package com.typequest.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientIpResolverTest {

    private HttpServletRequest request(String remote, String forwarded) {
        HttpServletRequest request = mock(HttpServletRequest.class);

        when(request.getRemoteAddr()).thenReturn(remote);
        when(request.getHeader("X-Forwarded-For")).thenReturn(forwarded);

        return request;
    }

    @Test
    void headerIsIgnoredWhenNoProxyIsTrusted() {
        // Otherwise anyone could pick their own rate-limit bucket.
        assertEquals("1.2.3.4", ClientIpResolver.resolve(request("1.2.3.4", "9.9.9.9"), 0));
    }

    @Test
    void oneProxyUsesTheLastEntry() {
        assertEquals(
                "203.0.113.9",
                ClientIpResolver.resolve(request("10.0.0.1", "6.6.6.6, 203.0.113.9"), 1)
        );
    }

    @Test
    void twoProxiesUseTheSecondEntryFromTheRight() {
        assertEquals(
                "203.0.113.9",
                ClientIpResolver.resolve(
                        request("10.0.0.1", "6.6.6.6, 203.0.113.9, 172.16.0.4"), 2)
        );
    }

    @Test
    void missingOrShortHeaderFallsBackToTheSocketAddress() {
        assertEquals("10.0.0.1", ClientIpResolver.resolve(request("10.0.0.1", null), 1));
        assertEquals("10.0.0.1", ClientIpResolver.resolve(request("10.0.0.1", "  "), 1));
        assertEquals("10.0.0.1", ClientIpResolver.resolve(request("10.0.0.1", "1.1.1.1"), 2));
    }

    @Test
    void garbageInTheHeaderIsNotUsedAsAKey() {
        assertEquals(
                "10.0.0.1",
                ClientIpResolver.resolve(request("10.0.0.1", "<script>alert(1)</script>"), 1)
        );
    }

    @Test
    void ipv6AddressesAreAccepted() {
        assertEquals(
                "2001:db8::1",
                ClientIpResolver.resolve(request("10.0.0.1", "2001:db8::1"), 1)
        );
    }
}
