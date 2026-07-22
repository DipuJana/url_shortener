package com.jana.url_shortener.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class Base62UtilTest {

    @Test
    @DisplayName("Should correctly encode base-10 IDs to Base62 strings")
    void shouldEncodeCorrectly() {
        assertEquals("1", Base62Util.encode(1));
        assertEquals("d", Base62Util.encode(13));
        assertEquals("10", Base62Util.encode(62));
        assertEquals("bV3", Base62Util.encode(45821));
    }

    @Test
    @DisplayName("Should correctly decode Base62 strings back to base-10 IDs")
    void shouldDecodeCorrectly() {
        assertEquals(1, Base62Util.decode("1"));
        assertEquals(13, Base62Util.decode("d"));
        assertEquals(62, Base62Util.decode("10"));
        assertEquals(45821, Base62Util.decode("bV3"));
    }

    @ParameterizedTest
    @ValueSource(longs = {1L, 100L, 999999L, 1234567890L})
    @DisplayName("Encoding and then decoding should return the original ID")
    void shouldBeReversible(long originalId) {
        String encoded = Base62Util.encode(originalId);
        long decoded = Base62Util.decode(encoded);
        assertEquals(originalId, decoded);
    }

    @Test
    @DisplayName("Should throw exception when encoding non-positive IDs")
    void shouldThrowOnInvalidEncodeInput() {
        assertThrows(IllegalArgumentException.class, () -> Base62Util.encode(0));
        assertThrows(IllegalArgumentException.class, () -> Base62Util.encode(-5));
    }

    @Test
    @DisplayName("Should throw exception when decoding invalid Base62 strings")
    void shouldThrowOnInvalidDecodeInput() {
        assertThrows(IllegalArgumentException.class, () -> Base62Util.decode("invalid!@#"));
        assertThrows(IllegalArgumentException.class, () -> Base62Util.decode(""));
        assertThrows(IllegalArgumentException.class, () -> Base62Util.decode(null));
    }
}