package com.jana.url_shortener.dto;

public record AuthResponse(

        String token,
        String type

) {

    public AuthResponse(String token) {
        this(token, "Bearer");
    }
}