package com.jana.url_shortener.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class Base62UtilTest {

    @ParameterizedTest(name = "ID: {0} -> Base62: {1}")
    @CsvSource({
            "1, 1",
            "13, d",
            "62, 10",
            "45821, bV3"
    })
    @DisplayName("Should correctly encode base-10 IDs to Base62 strings")
    void shouldEncodeCorrectly(long id, String expectedBase62) {
        assertEquals(expectedBase62, Base62Util.encode(id));
    }

    @ParameterizedTest(name = "Base62: {1} -> ID: {0}")
    @CsvSource({
            "1, 1",
            "13, d",
            "62, 10",
            "45821, bV3"
    })
    @DisplayName("Should correctly decode Base62 strings back to base-10 IDs")
    void shouldDecodeCorrectly(long expectedId, String base62) {
        assertEquals(expectedId, Base62Util.decode(base62));
    }

    @ParameterizedTest
    @ValueSource(longs = {
            1L,
            100L,
            999999L,
            1234567890L,
            Long.MAX_VALUE
    })
    @DisplayName("Encoding and decoding should return the original ID")
    void shouldBeReversible(long originalId) {
        String encoded = Base62Util.encode(originalId);
        long decoded = Base62Util.decode(encoded);

        assertEquals(originalId, decoded);
    }

    @Test
    @DisplayName("Should throw exception when encoding non-positive IDs")
    void shouldThrowOnInvalidEncodeInput() {
        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.encode(0)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.encode(-5)
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.encode(-1)
        );
    }

    @Test
    @DisplayName("Should throw exception when decoding invalid Base62 strings")
    void shouldThrowOnInvalidDecodeInput() {
        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.decode("invalid!@#")
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.decode("")
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> Base62Util.decode(null)
        );
    }
}