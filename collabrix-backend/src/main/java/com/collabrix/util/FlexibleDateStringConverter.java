package com.collabrix.util;

import org.neo4j.driver.Value;
import org.neo4j.driver.Values;
import org.springframework.data.neo4j.core.convert.Neo4jPersistentPropertyConverter;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

public class FlexibleDateStringConverter implements Neo4jPersistentPropertyConverter<String> {
    @Override
    @NonNull
    public Value write(@Nullable String source) {
        return source == null ? Values.NULL : Values.value(source);
    }

    @Override
    public String read(@NonNull Value source) {
        if (source.isNull()) return null;
        try {
            // If it's already a string, return it
            if (source.type().name().equals("STRING")) {
                return source.asString();
            }
            // For temporal types (Date, DateTime, etc.), use toString() which gives ISO format
            return source.asObject().toString();
        } catch (Exception e) {
            // Fallback for any other types
            return source.toString();
        }
    }
}
