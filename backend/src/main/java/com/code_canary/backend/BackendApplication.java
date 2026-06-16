package com.code_canary.backend;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class BackendApplication {

	public static void main(String[] args) {
		// 상위 폴더(..)에 있는 .env 파일을 로드합니다.
		Dotenv dotenv = Dotenv.configure()
				.directory("..")
				.ignoreIfMissing()
				.load();

		// 로드된 환경 변수를 시스템 속성으로 설정하여 스프링이 읽을 수 있게 합니다.
		dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

		SpringApplication.run(BackendApplication.class, args);
	}

}
