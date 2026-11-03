package com.typequest.service;

import com.typequest.service.EmailTemplates.Message;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EmailTemplatesTest {

    private static final String LINK = "https://typequest-adam.vercel.app/verify-email?token=abc_DEF-123&x=1";

    @Test
    void verificationEmailHasAButtonTheLogoAndAPlainTextVersion() {
        Message message = EmailTemplates.verifyEmail(LINK);

        assertEquals("Confirm your TypeQuest email", message.subject());
        assertTrue(message.html().contains("Confirm my email"));
        assertTrue(message.html().contains("typequest"));
        assertTrue(message.html().contains("expires in 24 hours"));
        // The link is placed in the button and in the "button not working" line.
        assertTrue(message.html().contains("href=\"https://typequest-adam.vercel.app/verify-email?token=abc_DEF-123&amp;x=1\""));
        assertTrue(message.text().contains(LINK));
    }

    @Test
    void resetEmailKeepsTheFifteenMinuteRuleAndTheSecurityNote() {
        Message message = EmailTemplates.resetPassword("https://typequest-adam.vercel.app/reset-password?token=t");

        assertEquals("Reset Your TypeQuest Password", message.subject());
        assertTrue(message.html().contains("Reset my password"));
        assertTrue(message.html().contains("expires in 15 minutes"));
        assertTrue(message.html().contains("will not change"));
        assertTrue(message.text().contains("expires in 15 minutes"));
    }

    @Test
    void emailChangeEmailExplainsTheOldAddressStaysUntilConfirmed() {
        Message message = EmailTemplates.confirmNewEmail(LINK);

        assertTrue(message.html().contains("Confirm new email"));
        assertTrue(message.html().contains("old address"));
        assertTrue(message.text().contains(LINK));
    }

    @Test
    void testEmailHasNoButton() {
        Message message = EmailTemplates.test();

        assertFalse(message.html().contains("target=\"_blank\""));
        assertTrue(message.html().contains("Email is working"));
    }

    @Test
    void aLinkIsEscapedSoItCannotInjectMarkup() {
        Message message = EmailTemplates.resetPassword("https://example.com/x\"><script>alert(1)</script>");

        assertFalse(message.html().contains("<script>"));
        assertTrue(message.html().contains("&lt;script&gt;"));
    }

    @Test
    void theSiteIsTakenFromTheLinkAndOnlyForWebAddresses() {
        assertEquals("https://typequest-adam.vercel.app", EmailTemplates.siteOf(LINK));
        assertEquals("http://localhost:5173", EmailTemplates.siteOf("http://localhost:5173/reset-password?token=t"));
        assertNull(EmailTemplates.siteOf("javascript:alert(1)"));
        assertNull(EmailTemplates.siteOf(null));
    }
}
