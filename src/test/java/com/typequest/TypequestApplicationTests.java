package com.typequest;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		// Test-only SMTP configuration
		"MAIL_HOST=localhost",
		"MAIL_PORT=587",
		"MAIL_USERNAME=test",
		"MAIL_PASSWORD=test",
		"MAIL_FROM=test@example.com",

		// Test JWT secret
		"typequest.jwt.secret=VGhpc0lzQVRlc3RTZWNyZXRLZXlUaGF0SXNMb25nRW5vdWdoIQ==",

		// Test database configuration
		"spring.datasource.url=jdbc:mysql://localhost:3306/typequest_db",
		"spring.datasource.username=root",
		"spring.datasource.password=root",

		// Disable admin initialization for this context test
		"typequest.admin.initializer.enabled=false"
})
class TypequestApplicationTests {

	@Test
	void contextLoads() {
	}
}