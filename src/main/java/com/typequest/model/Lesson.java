package com.typequest.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Arrays;
import java.util.List;

// One lesson. The id (like "2-3") is what lesson progress points at, so it
// never changes; admins edit the text fields only.
@Entity
@Table(name = "lessons")
public class Lesson {

    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "level_id", nullable = false)
    private Integer levelId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 20)
    private String duration;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, length = 150)
    private String heading;

    @Column(nullable = false, length = 500)
    private String instruction;

    @Column(nullable = false, length = 500)
    private String tip;

    @Column(nullable = false, length = 1000)
    private String target;

    // The practice words, one per line.
    @Column(nullable = false, length = 4000)
    private String words;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    public String getId() {
        return id;
    }

    public Integer getLevelId() {
        return levelId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getHeading() {
        return heading;
    }

    public void setHeading(String heading) {
        this.heading = heading;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public String getTip() {
        return tip;
    }

    public void setTip(String tip) {
        this.tip = tip;
    }

    public String getTarget() {
        return target;
    }

    public void setTarget(String target) {
        this.target = target;
    }

    public String getWords() {
        return words;
    }

    public void setWords(String words) {
        this.words = words;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public List<String> wordList() {
        return words.isBlank() ? List.of() : Arrays.asList(words.split("\n"));
    }
}
