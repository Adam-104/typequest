package com.typequest.exception;

import com.typequest.dto.AuthResponse;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<AuthResponse> handleDuplicateEmail(
            EmailAlreadyExistsException exception) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new AuthResponse(exception.getMessage()));
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<AuthResponse> handleDuplicateUsername(
            UsernameAlreadyExistsException exception) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new AuthResponse(exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthResponse> handleValidationErrors(
            MethodArgumentNotValidException exception) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .findFirst()
                .orElse("Invalid request data.");

        return ResponseEntity
                .badRequest()
                .body(new AuthResponse(message));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<AuthResponse> handleInvalidCredentials(
            InvalidCredentialsException exception) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse(exception.getMessage()));
    }

    // Handle invalid or expired password-reset tokens and other
    // invalid arguments.
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthResponse> handleIllegalArgument(
            IllegalArgumentException exception) {

        return ResponseEntity
                .badRequest()
                .body(new AuthResponse(exception.getMessage()));
    }

    // Services such as LessonProgressService throw ResponseStatusException
    // with a deliberate status (400/401/404). Without this handler the
    // catch-all below turned all of them into 500 responses.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<AuthResponse> handleResponseStatus(
            ResponseStatusException exception) {

        HttpStatusCode status = exception.getStatusCode();
        String reason = exception.getReason();

        return ResponseEntity
                .status(status)
                .body(new AuthResponse(
                        reason != null ? reason : reasonFor(status)
                ));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<AuthResponse> handleEntityNotFound(
            EntityNotFoundException exception) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new AuthResponse(exception.getMessage()));
    }

    // Malformed JSON, wrong types, missing body.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AuthResponse> handleUnreadableBody(
            HttpMessageNotReadableException exception) {

        return ResponseEntity
                .badRequest()
                .body(new AuthResponse("Malformed or missing request body."));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<AuthResponse> handleAccessDenied(
            AccessDeniedException exception) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new AuthResponse(exception.getMessage()));
    }

    // Handle unexpected errors without exposing internal details.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthResponse> handleUnexpectedException(
            Exception exception) throws Exception {

        // Spring MVC's own exceptions (405 method not allowed, 404 unknown
        // route, missing request parameter, unsupported media type, ...)
        // already know their correct status code. Keep it instead of
        // reporting a 500.
        if (exception instanceof ErrorResponse errorResponse) {
            HttpStatusCode status = errorResponse.getStatusCode();

            return ResponseEntity
                    .status(status)
                    .body(new AuthResponse(reasonFor(status)));
        }

        // Never swallow real failures silently.
        log.error("Unhandled exception", exception);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse(
                        "An unexpected error occurred. Please try again later."
                ));
    }

    private static String reasonFor(HttpStatusCode status) {
        HttpStatus resolved = HttpStatus.resolve(status.value());

        return resolved != null
                ? resolved.getReasonPhrase()
                : "Request failed.";
    }
}
