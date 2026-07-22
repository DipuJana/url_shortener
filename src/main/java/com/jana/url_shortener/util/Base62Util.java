package com.jana.url_shortener.util;

public final class Base62Util {

    private static final String BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final int BASE = BASE62_ALPHABET.length();

    private Base62Util() {
        // Private constructor to prevent instantiation of utility class
    }

    // Encodes a base-10 ID into a Base62 string.
    public static String encode(long id) {
        if (id <= 0) {
            throw new IllegalArgumentException("ID must be greater than 0 for Base62 encoding");
        }

        StringBuilder sb = new StringBuilder();
        while (id > 0) {
            int remainder = (int) (id % BASE);
            sb.append(BASE62_ALPHABET.charAt(remainder));
            id /= BASE;
        }

        return sb.reverse().toString();
    }

    // Decodes a Base62 string back into a base-10 ID.
    public static long decode(String str) {
        if (str == null || str.isBlank()) {
            throw new IllegalArgumentException("Base62 string cannot be null or empty");
        }

        long id = 0;
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            int charIndex = BASE62_ALPHABET.indexOf(c);
            if (charIndex == -1) {
                throw new IllegalArgumentException("Invalid Base62 character: " + c);
            }
            id = id * BASE + charIndex;
        }

        return id;
    }
}