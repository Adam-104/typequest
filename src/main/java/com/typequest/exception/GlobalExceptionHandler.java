package com.typequest.exception;

import com.typequest.dto.AuthResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.security.access.AccessDeniedException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<AuthResponse> handleDuplicateEmail(
            EmailAlreadyExistsException exception) {

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

    // Handle unexpected errors without exposing internal details.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthResponse> handleUnexpectedException(
            Exception exception) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse(
                        "An unexpected error occurred. Please try again later."
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<AuthResponse> handleAccessDenied(
            AccessDeniedException exception) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new AuthResponse(exception.getMessage()));
    }
}