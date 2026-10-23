package com.typequest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class TypequestApplication {

	public static void main(String[] args) {
		SpringApplication.run(TypequestApplication.class, args);
	}

}
