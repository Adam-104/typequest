package com.typequest.service;

import com.typequest.dto.LessonProgressResponse;
import com.typequest.model.LessonProgress;
import com.typequest.model.User;
import com.typequest.repository.LessonProgressRepository;
import com.typequest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;

    public LessonProgressService(
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository
    ) {
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LessonProgressResponse> getAllProgress(Jwt jwt) {
        Long userId = getAuthenticatedUserId(jwt);

        return lessonProgressRepository
                .findAllByUser_IdOrderByLessonIdAsc(userId)
                .stream()
                .map(LessonProgressResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public LessonProgressResponse getLessonProgress(
            Jwt jwt,
            String lessonId
    ) {
        Long userId = getAuthenticatedUserId(jwt);
        String validatedLessonId = validateLessonId(lessonId);

        LessonProgress progress = lessonProgressRepository
                .findByUser_IdAndLessonId(userId, validatedLessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Progress for this lesson was not found."
                ));

        return LessonProgressResponse.from(progress);
    }

    @Transactional
    public LessonProgressResponse saveProgress(
            Jwt jwt,
            String lessonId,
            double wpm,
            double accuracy,
            boolean completed
    ) {
        Long userId = getAuthenticatedUserId(jwt);
        String validatedLessonId = validateLessonId(lessonId);

        if (!Double.isFinite(wpm) || wpm < 0 || wpm > 1000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "WPM must be between 0 and 1000."
            );
        }

        if (!Double.isFinite(accuracy)
                || accuracy < 0
                || accuracy > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Accuracy must be between 0 and 100."
            );
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Authenticated user was not found."
                ));

        LessonProgress progress = lessonProgressRepository
                .findByUser_IdAndLessonId(userId, validatedLessonId)
                .orElseGet(() -> {
                    LessonProgress newProgress = new LessonProgress();
                    newProgress.setUser(user);
                    newProgress.setLessonId(validatedLessonId);
                    return newProgress;
                });

        if (wpm > progress.getBestWpm()) {
            progress.setBestWpm(wpm);
        }

        progress.setAccuracy(
                Math.max(progress.getAccuracy(), accuracy)
        );

        if (completed) {
            progress.setCompleted(true);
        }

        LessonProgress savedProgress =
                lessonProgressRepository.save(progress);

        return LessonProgressResponse.from(savedProgress);
    }

    @Transactional(readOnly = true)
    public long getCompletedLessonCount(Jwt jwt) {
        Long userId = getAuthenticatedUserId(jwt);

        return lessonProgressRepository
                .countByUser_IdAndCompletedTrue(userId);
    }

    private Long getAuthenticatedUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required."
            );
        }

        try {
            return Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid authenticated user."
            );
        }
    }

    private String validateLessonId(String lessonId) {
        if (lessonId == null
                || !lessonId.matches("[A-Za-z0-9_-]{1,20}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid lesson ID."
            );
        }

        return lessonId;
    }
}