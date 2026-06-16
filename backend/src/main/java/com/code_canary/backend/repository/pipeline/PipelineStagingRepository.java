package com.code_canary.backend.repository.pipeline;

import com.code_canary.backend.config.PipelineStagingProperties;
import com.code_canary.backend.constants.PipelineStagingConstants;
import com.code_canary.backend.exception.PipelineStagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

@Slf4j
@Repository
@RequiredArgsConstructor
public class PipelineStagingRepository {

    private static final String NVD_PREFIX = PipelineStagingConstants.NVD_BASELINE_PREFIX;
    private static final String OSV_PREFIX = PipelineStagingConstants.OSV_BASELINE_PREFIX;

    private final PipelineStagingProperties stagingProperties;

    public List<StagingEntry> listNvdBaselines() {
        return listDirectoryBaselines(dataRoot().resolve("nvd"), NVD_PREFIX, false);
    }

    public List<StagingEntry> listOsvBaselines() {
        return listDirectoryBaselines(dataRoot().resolve("osv"), OSV_PREFIX, true);
    }

    public Optional<StagingEntry> findLatestNvdBaseline() {
        List<StagingEntry> baselines = listNvdBaselines();
        return baselines.isEmpty() ? Optional.empty() : Optional.of(baselines.getFirst());
    }

    public Optional<StagingEntry> findLatestOsvBaseline() {
        List<StagingEntry> baselines = listOsvBaselines();
        return baselines.isEmpty() ? Optional.empty() : Optional.of(baselines.getFirst());
    }

    public boolean nvdBaselineExists(String stagingRef) {
        return Files.isDirectory(dataRoot().resolve("nvd").resolve(stagingRef));
    }

    public boolean osvBaselineExists(String stagingRef) {
        return Files.isRegularFile(dataRoot().resolve("osv").resolve(stagingRef));
    }

    private Path dataRoot() {
        return Path.of(stagingProperties.resolvedDataRoot());
    }

    private List<StagingEntry> listDirectoryBaselines(Path directory, String prefix, boolean zipOnly) {
        if (!Files.isDirectory(directory)) {
            return List.of();
        }

        List<StagingEntry> entries = new ArrayList<>();
        try (Stream<Path> stream = Files.list(directory)) {
            stream.filter(path -> {
                        String name = path.getFileName().toString();
                        if (!name.startsWith(prefix)) {
                            return false;
                        }
                        return zipOnly ? Files.isRegularFile(path) && name.endsWith(".zip") : Files.isDirectory(path);
                    })
                    .sorted(Comparator.comparing(path -> path.getFileName().toString(), Comparator.reverseOrder()))
                    .forEach(path -> entries.add(toEntry(path, zipOnly)));
        } catch (IOException ex) {
            throw new PipelineStagingException(
                    "Failed to read staging directory: " + directory,
                    ex
            );
        }
        return entries;
    }

    private StagingEntry toEntry(Path path, boolean zipFile) {
        String name = path.getFileName().toString();
        long sizeBytes = 0L;
        Instant modifiedAt = null;
        try {
            sizeBytes = zipFile ? Files.size(path) : directorySize(path);
            modifiedAt = Files.getLastModifiedTime(path).toInstant();
        } catch (IOException ex) {
            log.warn("Skipping unreadable staging entry {}: {}", name, ex.getMessage());
        }
        return new StagingEntry(name, modifiedAt, sizeBytes);
    }

    private long directorySize(Path directory) throws IOException {
        try (Stream<Path> walk = Files.walk(directory)) {
            return walk.filter(Files::isRegularFile).mapToLong(path -> {
                try {
                    return Files.size(path);
                } catch (IOException ex) {
                    return 0L;
                }
            }).sum();
        }
    }

    public record StagingEntry(String id, Instant modifiedAt, long sizeBytes) {
        public String label() {
            String sizeLabel = formatBytes(sizeBytes);
            return id + " (" + sizeLabel + ")";
        }

        private static String formatBytes(long bytes) {
            if (bytes < 1024) {
                return bytes + " B";
            }
            if (bytes < 1024 * 1024) {
                return String.format(Locale.US, "%.1f KB", bytes / 1024.0);
            }
            if (bytes < 1024L * 1024 * 1024) {
                return String.format(Locale.US, "%.1f MB", bytes / (1024.0 * 1024));
            }
            return String.format(Locale.US, "%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }
}
