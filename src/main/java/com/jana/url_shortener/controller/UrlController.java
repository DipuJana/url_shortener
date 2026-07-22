package com.jana.url_shortener.controller;

import com.jana.url_shortener.dto.ShortenUrlRequest;
import com.jana.url_shortener.dto.UrlResponse;
import com.jana.url_shortener.service.UrlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class UrlController {

    private final UrlService urlService;

    @PostMapping
    public ResponseEntity<UrlResponse> shortenUrl(@Valid @RequestBody ShortenUrlRequest request) {
        UrlResponse response = urlService.createShortUrl(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UrlResponse> getUrlMetadata(@PathVariable Long id) {
        UrlResponse response = urlService.getUrlMetadata(id);
        return ResponseEntity.ok(response);
    }
}