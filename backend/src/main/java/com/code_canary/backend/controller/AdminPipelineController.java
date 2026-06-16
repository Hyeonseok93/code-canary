package com.code_canary.backend.controller;

import com.code_canary.backend.dto.PipelineDto;
import com.code_canary.backend.service.PipelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/pipeline")
@RequiredArgsConstructor
public class AdminPipelineController {

    private final PipelineService pipelineService;

    @GetMapping("/status")
    public ResponseEntity<PipelineDto.StatusResponse> status() {
        return ResponseEntity.ok(pipelineService.getStatus());
    }

    @GetMapping("/activity")
    public ResponseEntity<PipelineDto.ActivityLogResponse> activity(
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(pipelineService.getRecentActivity(limit));
    }

    @GetMapping("/staging")
    public ResponseEntity<PipelineDto.StagingResponse> staging() {
        return ResponseEntity.ok(pipelineService.getStaging());
    }

    @PostMapping("/jobs")
    public ResponseEntity<PipelineDto.EnqueueJobResponse> enqueueJob(
            @Valid @RequestBody PipelineDto.EnqueueJobRequest request,
            @AuthenticationPrincipal(expression = "username") String requestedBy
    ) {
        PipelineDto.EnqueueJobResponse response = pipelineService.enqueueJob(
                request.stepKey(),
                requestedBy,
                request.stagingRef(),
                request.collectMode()
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @PostMapping("/jobs/stop")
    public ResponseEntity<PipelineDto.StopJobResponse> stopJob(
            @Valid @RequestBody PipelineDto.StopJobRequest request,
            @AuthenticationPrincipal(expression = "username") String requestedBy
    ) {
        return ResponseEntity.ok(pipelineService.stopJob(request.stepKey(), requestedBy));
    }

    @PostMapping("/jobs/stuck/release")
    public ResponseEntity<PipelineDto.ReleaseStuckJobsResponse> releaseStuckJobs(
            @AuthenticationPrincipal(expression = "username") String requestedBy
    ) {
        return ResponseEntity.ok(pipelineService.releaseStuckJobs(requestedBy));
    }
}
