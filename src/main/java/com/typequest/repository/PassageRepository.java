package com.typequest.repository;

import com.typequest.model.Passage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PassageRepository extends JpaRepository<Passage, Long> {

    List<Passage> findAllByOrderByIdDesc();

    List<Passage> findByCategoryAndActiveTrueOrderByIdAsc(String category);

    boolean existsByCategoryAndText(String category, String text);
}
