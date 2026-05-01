package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.model.BorrowRecord;
import com.lms.model.BorrowStatus;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminBorrowRecordController {

    private final AuthService authService;
    private final BorrowService borrowService;

    public AdminBorrowRecordController(AuthService authService, BorrowService borrowService) {
        this.authService = authService;
        this.borrowService = borrowService;
    }

    @GetMapping("/records")
    public ApiResponse<List<Map<String, Object>>> listRecords(@RequestHeader("X-Token") String token,
                                                               @RequestParam(required = false) String status,
                                                               @RequestParam(required = false) String keyword,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "10") int size) {
        authService.requireAdmin(token);
        BorrowStatus statusFilter = parseStatus(status);
        Page<BorrowRecord> result = borrowService.listAdminRecords(statusFilter, keyword, page, size);
        List<Map<String, Object>> data = result.getContent().stream().map(this::recordMap).toList();
        return ApiResponse.success("查询成功", data, pagination(result));
    }

    private BorrowStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return BorrowStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private Map<String, Object> pagination(Page<?> page) {
        Map<String, Object> map = new HashMap<>();
        map.put("page", page.getNumber());
        map.put("size", page.getSize());
        map.put("totalElements", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        map.put("first", page.isFirst());
        map.put("last", page.isLast());
        return map;
    }

    private Map<String, Object> recordMap(BorrowRecord record) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", record.getId());
        map.put("userId", record.getUser().getId());
        map.put("username", record.getUser().getUsername());
        map.put("realName", record.getUser().getRealName());
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
}
