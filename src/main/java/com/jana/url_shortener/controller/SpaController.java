package com.jana.url_shortener.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
            "/",
            "/login",
            "/register",
            "/dashboard",
            "/dashboard/urls/{id}/analytics"
    })
    public String forwardToReact() {
        return "forward:/index.html";
    }
}