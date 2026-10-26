package com.typequest.exception;

import com.typequest.dto.AuthResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void responseStatusExceptionKeepsItsStatus() {
        ResponseEntity<AuthResponse> response = handler.handleResponseStatus(
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Progress for this lesson was not found."
                )
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void springMvcErrorsKeepTheirStatusInsteadOfBecoming500() throws Exception {
        ResponseEntity<AuthResponse> response = handler.handleUnexpectedException(
                new HttpRequestMethodNotSupportedException("DELETE")
        );

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    @Test
    void unknownFailuresStillReturn500() throws Exception {
        ResponseEntity<AuthResponse> response = handler.handleUnexpectedException(
                new IllegalStateException("boom")
        );

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
