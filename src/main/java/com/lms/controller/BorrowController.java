package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.model.BorrowRecord;
import com.lms.model.OverdueRecord;
import com.lms.model.User;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/borrow")
public class BorrowController {

    private final AuthService authService;
    private final BorrowService borrowService;

    public BorrowController(AuthService authService, BorrowService borrowService) {
        this.authService = authService;
        this.borrowService = borrowService;
    }

    @PostMapping("/{bookId}")
    public ApiResponse<Map<String, Object>> borrow(@RequestHeader("X-Token") String token, @PathVariable Long bookId) {
        User user = authService.requireUser(token);
        BorrowRecord record = borrowService.borrow(user, bookId);
        return ApiResponse.success("借阅成功", recordMap(record));
    }

    @PostMapping("/return/{recordId}")
    public ApiResponse<Map<String, Object>> returnBook(@RequestHeader("X-Token") String token, @PathVariable Long recordId) {
        User user = authService.requireUser(token);
        BorrowRecord record = borrowService.returnBook(user, recordId);
        return ApiResponse.success("归还成功", recordMap(record));
    }

    @PostMapping("/renew/{recordId}")
    public ApiResponse<Map<String, Object>> renew(@RequestHeader("X-Token") String token, @PathVariable Long recordId) {
        User user = authService.requireUser(token);
        BorrowRecord record = borrowService.renew(user, recordId);
        return ApiResponse.success("续借成功", recordMap(record));
    }

    @GetMapping("/my")
    public ApiResponse<List<Map<String, Object>>> myRecords(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        List<Map<String, Object>> data = borrowService.myRecords(user).stream().map(this::recordMap).collect(Collectors.toList());
        return ApiResponse.success("查询成功", data);
    }

    @GetMapping("/my-overdue")
    public ApiResponse<List<Map<String, Object>>> myOverdue(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);
        List<Map<String, Object>> data = borrowService.myOverdueRecords(user).stream().map(this::overdueMap).collect(Collectors.toList());
        return ApiResponse.success("查询成功", data);
    }

    @PostMapping("/scan-overdue")
    public ApiResponse<Map<String, Object>> scanOverdue(@RequestHeader("X-Token") String token) {
        authService.requireAdmin(token);
        int updated = borrowService.markOverdueRecords();
        return ApiResponse.success("逾期扫描完成", Map.of("updatedCount", updated));
    }

    private Map<String, Object> recordMap(BorrowRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("userId", record.getUser().getId());
        map.put("bookId", record.getBook().getId());
        map.put("bookTitle", record.getBook().getTitle());
        map.put("borrowTime", record.getBorrowTime());
        map.put("dueTime", record.getDueTime());
        map.put("returnTime", record.getReturnTime());
        map.put("status", record.getStatus());
        map.put("renewCount", record.getRenewCount());
        map.put("overdueFee", record.getOverdueFee());
        return map;
    }

    private Map<String, Object> overdueMap(OverdueRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("borrowRecordId", record.getBorrowRecord().getId());
        map.put("bookId", record.getBook().getId());
        map.put("bookTitle", record.getBook().getTitle());
        map.put("overdueDays", record.getOverdueDays());
        map.put("overdueFee", record.getOverdueFee());
        map.put("createdAt", record.getCreatedAt());
        return map;
    }
}
