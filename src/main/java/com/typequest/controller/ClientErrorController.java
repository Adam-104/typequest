package com.typequest.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Receives crashes from the browser so they show up in the server logs next
// to backend errors. Public (a crash can happen before sign-in), size-limited
// and rate-limited per IP in RateLimitInterceptor.
@RestController
@RequestMapping("/api/client-errors")
public class ClientErrorController {

    private static final Logger log = LoggerFactory.getLogger("typequest.client-errors");

    public record ClientErrorReport(
            @Size(max = 500) String message,
            @Size(max = 4000) String stack,
            @Size(max = 300) String url,
            @Size(max = 40) String source
    ) {
    }

    @PostMapping
    public ResponseEntity<Void> report(@Valid @RequestBody ClientErrorReport report) {
        log.warn("Browser error [{}] {} at {} :: {}",
                clean(report.source(), 40),
                clean(report.message(), 500),
                clean(report.url(), 300),
                clean(report.stack(), 1500));

        return ResponseEntity.noContent().build();
    }

    // Line breaks removed so a report cannot forge extra log lines.
    private static String clean(String value, int max) {
        if (value == null) {
            return "-";
        }

        String flat = value.replaceAll("[\\r\\n\\t]+", " ");

        return flat.length() > max ? flat.substring(0, max) : flat;
    }
}
