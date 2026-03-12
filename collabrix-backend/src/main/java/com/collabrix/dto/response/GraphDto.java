package com.collabrix.dto.response;

import java.util.List;

public record GraphDto(
        List<NodeDto> nodes,
        List<EdgeDto> edges
) {}
