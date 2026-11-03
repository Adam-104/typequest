package com.typequest.service;

import java.net.URI;

// Builds the HTML and plain-text bodies of every email TypeQuest sends.
//
// The HTML follows the rules email clients need: table layout, inline styles,
// system fonts, a button made from a link (works without images), and the logo
// drawn with plain markup so it still shows when a client blocks images. A
// plain-text version is always included for clients that cannot show HTML.
final class EmailTemplates {

    private static final String INK = "#201b15";
    private static final String PAPER = "#efe6d0";
    private static final String SHEET = "#fbf7ea";
    private static final String RULE = "#d6c8a8";
    private static final String RIBBON = "#b3321f";
    private static final String MUTED = "#6f6553";

    private EmailTemplates() {
    }

    record Message(String subject, String html, String text) {
    }

    static Message verifyEmail(String link) {
        return build(new Content(
                "Confirm your TypeQuest email",
                "Confirm your email to finish setting up your account.",
                "Welcome to TypeQuest",
                "You are one click away from saving your progress. Confirm your email address so you can "
                        + "recover your password later and keep your account secure.",
                "Confirm my email",
                link,
                "This link works once and expires in 24 hours.",
                "Once you are in, you can:",
                new String[]{
                        "Learn touch typing through 8 levels and 26 lessons",
                        "Play 5 typing games and earn XP and achievements",
                        "Climb the leaderboard and track your speed"},
                "If you did not create a TypeQuest account, you can safely ignore this email.",
                """
                        Welcome to TypeQuest!

                        Please confirm your email address with this link:

                        %s

                        The link works once and expires in 24 hours.

                        If you did not create a TypeQuest account, you can ignore this email.

                        Happy typing,
                        TypeQuest Team
                        """.formatted(link)));
    }

    static Message resetPassword(String link) {
        return build(new Content(
                "Reset Your TypeQuest Password",
                "Choose a new password for your TypeQuest account.",
                "Reset your password",
                "We received a request to reset the password for your TypeQuest account. "
                        + "Press the button below to choose a new one.",
                "Reset my password",
                link,
                "This link works once and expires in 15 minutes.",
                null,
                null,
                "If you did not ask for this, you can safely ignore this email. Your password will not change. "
                        + "TypeQuest will never ask for your password by email.",
                """
                        Hello TypeQuest player,

                        We received a request to reset your password.

                        Use the following link to choose a new password:

                        %s

                        This link expires in 15 minutes and can only be used once.

                        If you did not request a password reset, you can ignore this email.

                        Happy typing,
                        TypeQuest Team
                        """.formatted(link)));
    }

    static Message confirmNewEmail(String link) {
        return build(new Content(
                "Confirm your new TypeQuest email",
                "Confirm the new email address for your TypeQuest account.",
                "Confirm your new email",
                "Someone asked to use this address for a TypeQuest account. "
                        + "Press the button below to confirm the change. Your account keeps its old address until you do.",
                "Confirm new email",
                link,
                "This link works once and expires in 24 hours.",
                null,
                null,
                "If this was not you, ignore this email and nothing changes.",
                """
                        Hello TypeQuest player,

                        Someone asked to use this address for a TypeQuest account.
                        Confirm the change with this link:

                        %s

                        The link works once and expires in 24 hours. Your account keeps its
                        old address until you confirm.

                        If this was not you, ignore this email and nothing changes.

                        Happy typing,
                        TypeQuest Team
                        """.formatted(link)));
    }

    static Message test() {
        return build(new Content(
                "TypeQuest Email Configuration Test",
                "Your TypeQuest email setup works.",
                "Email is working",
                "This is a test message from TypeQuest. Your application is connected to the email service, "
                        + "so confirmation and password reset emails will reach your players.",
                null,
                null,
                null,
                null,
                null,
                "You received this because someone ran the TypeQuest email test.",
                """
                        Hello!

                        This is a test email from TypeQuest.

                        Your application is connected to the email service.

                        Happy typing,
                        TypeQuest Team
                        """));
    }

    // ---- Layout -----------------------------------------------------------

    private record Content(
            String subject,
            String preheader,
            String heading,
            String intro,
            String buttonLabel,
            String link,
            String expiry,
            String listTitle,
            String[] listItems,
            String note,
            String text
    ) {
    }

    private static Message build(Content c) {
        String site = siteOf(c.link());
        StringBuilder body = new StringBuilder();

        body.append(row("padding:30px 36px 0 36px;",
                "<h1 style=\"margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;"
                        + "line-height:1.25;color:" + INK + ";\">" + esc(c.heading()) + "</h1>"
                        + "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;"
                        + "line-height:1.6;color:#3a332a;\">" + esc(c.intro()) + "</p>"));

        if (c.buttonLabel() != null && c.link() != null) {
            body.append(row("padding:26px 36px 0 36px;", button(c.buttonLabel(), c.link())));

            if (c.expiry() != null) {
                body.append(row("padding:14px 36px 0 36px;",
                        "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;"
                                + "line-height:1.5;color:" + MUTED + ";\">" + esc(c.expiry()) + "</p>"));
            }
        }

        if (c.listItems() != null) {
            StringBuilder items = new StringBuilder();

            for (String item : c.listItems()) {
                items.append("<tr><td width=\"22\" valign=\"top\" style=\"font-family:Arial,Helvetica,sans-serif;"
                        + "font-size:15px;line-height:1.5;color:" + RIBBON + ";\">&#9656;</td>"
                        + "<td style=\"font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;"
                        + "color:#3a332a;padding-bottom:6px;\">" + esc(item) + "</td></tr>");
            }

            body.append(row("padding:26px 36px 0 36px;",
                    "<p style=\"margin:0 0 10px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;"
                            + "font-weight:bold;color:" + INK + ";\">" + esc(c.listTitle()) + "</p>"
                            + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                            + "border=\"0\">" + items + "</table>"));
        }

        if (c.note() != null) {
            body.append(row("padding:22px 36px 0 36px;",
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
                            + "<tr><td style=\"background:" + SHEET + ";border-left:4px solid " + RIBBON
                            + ";padding:12px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;"
                            + "line-height:1.55;color:#3a332a;\">" + esc(c.note()) + "</td></tr></table>"));
        }

        if (c.link() != null) {
            body.append(row("padding:22px 36px 0 36px;",
                    "<p style=\"margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;"
                            + "line-height:1.5;color:" + MUTED + ";\">Button not working? Copy this link into your browser:</p>"
                            + "<p style=\"margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;"
                            + "line-height:1.5;color:" + MUTED + ";word-break:break-all;\">"
                            + "<a href=\"" + esc(c.link()) + "\" style=\"color:" + MUTED + ";\">"
                            + esc(c.link()) + "</a></p>"));
        }

        String footer = "<p style=\"margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;"
                + "line-height:1.5;color:" + MUTED + ";\">Sent by TypeQuest, learn to type, properly.</p>"
                + (site == null ? "" : "<p style=\"margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;"
                + "line-height:1.5;\"><a href=\"" + esc(site) + "\" style=\"color:" + MUTED + ";\">"
                + esc(site.replaceFirst("^https?://", "")) + "</a></p>");

        String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                <title>{{TITLE}}</title>
                </head>
                <body style="margin:0;padding:0;background:{{PAPER}};">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{PREHEADER}}</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{{PAPER}};">
                <tr><td align="center" style="padding:28px 12px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid {{RULE}};">
                <tr><td align="center" style="background:{{PAPER}};padding:26px 20px 20px 20px;border-bottom:3px double {{INK}};">
                {{LOGO}}
                </td></tr>
                {{BODY}}
                <tr><td style="padding:30px 36px 0 36px;"><div style="border-top:1px solid {{RULE}};height:1px;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
                <tr><td align="center" style="padding:18px 36px 28px 36px;">{{FOOTER}}</td></tr>
                </table>
                </td></tr>
                </table>
                </body>
                </html>
                """
                .replace("{{TITLE}}", esc(c.subject()))
                .replace("{{PREHEADER}}", esc(c.preheader()))
                .replace("{{PAPER}}", PAPER)
                .replace("{{RULE}}", RULE)
                .replace("{{INK}}", INK)
                .replace("{{LOGO}}", logo(site))
                .replace("{{BODY}}", body.toString())
                .replace("{{FOOTER}}", footer);

        return new Message(c.subject(), html, c.text());
    }

    // The logo is plain markup (no image file), so it never gets blocked.
    private static String logo(String site) {
        String badge = "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"center\">"
                + "<tr><td width=\"48\" height=\"48\" align=\"center\" valign=\"middle\" bgcolor=\"" + INK + "\" "
                + "style=\"width:48px;height:48px;border-radius:50%;border:3px solid #d3c9ae;background:" + INK
                + ";font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;line-height:48px;"
                + "color:" + SHEET + ";text-align:center;\">T</td>"
                + "<td width=\"12\" style=\"width:12px;\">&nbsp;</td>"
                + "<td align=\"left\" valign=\"middle\">"
                + "<div style=\"font-family:'Courier New',Courier,monospace;font-size:24px;font-weight:bold;"
                + "line-height:1.1;color:" + INK + ";letter-spacing:1px;\">typequest</div>"
                + "<div style=\"font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;"
                + "color:" + MUTED + ";letter-spacing:1px;\">learn to type, properly</div></td></tr></table>";

        return site == null ? badge
                : "<a href=\"" + esc(site) + "\" style=\"text-decoration:none;\">" + badge + "</a>";
    }

    // A button made from a table cell and a link, so it works in Outlook too.
    private static String button(String label, String link) {
        return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" align=\"left\"><tr>"
                + "<td align=\"center\" bgcolor=\"" + RIBBON + "\" style=\"background:" + RIBBON
                + ";border-radius:6px;\">"
                + "<a href=\"" + esc(link) + "\" target=\"_blank\" style=\"display:inline-block;padding:15px 34px;"
                + "font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1;"
                + "color:#ffffff;text-decoration:none;border-radius:6px;\">" + esc(label) + "</a>"
                + "</td></tr></table>";
    }

    private static String row(String padding, String inner) {
        return "<tr><td style=\"" + padding + "\">" + inner + "</td></tr>";
    }

    // Scheme and host of a link, so the logo and footer can point at the site.
    static String siteOf(String link) {
        if (link == null) {
            return null;
        }

        try {
            URI uri = URI.create(link);

            if (uri.getScheme() == null || uri.getHost() == null
                    || !(uri.getScheme().equals("http") || uri.getScheme().equals("https"))) {
                return null;
            }

            String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();

            return uri.getScheme() + "://" + uri.getHost() + port;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    static String esc(String value) {
        if (value == null) {
            return "";
        }

        StringBuilder out = new StringBuilder(value.length() + 16);

        for (char c : value.toCharArray()) {
            switch (c) {
                case '&' -> out.append("&amp;");
                case '<' -> out.append("&lt;");
                case '>' -> out.append("&gt;");
                case '"' -> out.append("&quot;");
                case '\'' -> out.append("&#39;");
                default -> out.append(c);
            }
        }

        return out.toString();
    }
}
