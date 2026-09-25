package com.taskify.auth.jwt;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {
    private String newSecret() {
        return Base64.getEncoder().encodeToString(Keys.secretKeyFor(SignatureAlgorithm.HS256).getEncoded());
    }

    @Test
    void tokensSurviveServiceRecreationWithTheSameConfiguredKey() {
        String secret = newSecret();
        String token = new JwtService(secret).generateToken("test@example.com");
        JwtService restarted = new JwtService(secret);
        assertTrue(restarted.isTokenValid(token));
        assertEquals("test@example.com", restarted.extractUserId(token));
        assertFalse(new JwtService(newSecret()).isTokenValid(token));
    }

    @Test
    void rejectsExpiredAndMalformedTokens() {
        String secret = newSecret();
        JwtService service = new JwtService(secret);
        String expired = Jwts.builder().setSubject("test@example.com")
                .setExpiration(new Date(System.currentTimeMillis() - 10000))
                .signWith(Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret)), SignatureAlgorithm.HS256).compact();
        assertFalse(service.isTokenValid(expired));
        assertFalse(service.isTokenValid("invalid"));
        assertFalse(service.isTokenValid(null));
    }

    @Test
    void missingKeyFailsAtContextStartup() {
        new ApplicationContextRunner().withUserConfiguration(JwtService.class).run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).hasRootCauseMessage(
                    "SECRET_KEY is required: provide a Base64-encoded random key of at least 32 bytes.");
        });
    }

    @Test
    void malformedAndWeakKeysFailAtContextStartupWithoutLeakingTheirValues() {
        for (String secret : new String[] { " ", "not-base64!", Base64.getEncoder().encodeToString(new byte[16]) }) {
            new ApplicationContextRunner().withUserConfiguration(JwtService.class)
                    .withPropertyValues("jwt.secret=" + secret).run(context -> {
                        assertThat(context).hasFailed();
                        Throwable failure = context.getStartupFailure();
                        while (failure.getCause() != null) failure = failure.getCause();
                        assertThat(failure).isInstanceOf(IllegalArgumentException.class);
                        assertThat(failure.getMessage()).startsWith("SECRET_KEY");
                        if (!secret.isBlank()) assertThat(failure.getMessage()).doesNotContain(secret);
                    });
        }
    }
}
